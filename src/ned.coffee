
fs = require('fs')
path = require('path')


optimist = (command, argv)->
  opt = require('../node_modules/optimist')(argv)
    .usage(usage)
    .boolean([1..9])
  if command == 'replace' or command == 'suppress'
    opt.boolean('l')
       .alias('l', 'literal')
       .boolean('i')
       .alias('i', 'insensitive')
       .alias('m', 'multiline')
       .boolean('m')
  if command == 'replace'
    opt.alias('n', 'limit').check( (argv)-> not argv.n? or typeof argv.n == 'number' or !!argv.n.match(/^[0-9]+\.\.[0-9]+$/) )
  if command == 'inplace'
    opt.alias('c', 'confirm')
      .boolean('c')
  opt.argv

ned = (process)->
  [node, cmd, argv...] = process.argv
  output_debug = if argv[argv.length-1] == '--debug' then argv.pop() else false
  
  # the list of ned commands
  neds = []
  
  options = null
  command = null
  next = 'command'
  commands = ['-R', '-S', '-N', '-I']
  
  at = 0
  while at < argv.length or next == 'ned'
    arg = argv[at]
    console.log {next, arg, options} if output_debug

    if next == 'command'
      command = null
      switch arg
        when '-R', '--replace'  then command = 'replace'
        when '-S', '--grep'     then command = 'grep'
        when '-N', '--suppress' then command = 'suppress'
        when '-I', '--inplace'  then command = 'inplace'
      
      if command == 'inplace' and neds.length
        console.log "inplace command must be the first ned command"
        process.exit(1)
        
      if command then at++
      else if at == argv.length - 1 then command = 'grep'
      else command = 'replace'
      console.log {command} if output_debug
      
      options = []
      
      next = 'options'
    else if next == 'search'
      console.log {search:arg} if output_debug
      options.push arg
      
      next = 'replace'
      at++
    else if next == 'replace'
      console.log {replace:arg} if output_debug
      options.push arg
      
      next = 'ned'
      at++
    else if next == command # 'grep', 'suppress' and 'inplace' all "suck up" remaining arguments, until the next command
      if arg in commands
        next = 'ned'
      else if command == 'inplace' and arg == '-c'
        options.push arg
        at++
      else
        console.log {"command+=":arg} if output_debug
        options.push arg
        at++
        if at == argv.length
          next = 'ned'
    else if next == 'skip_options'
      if command == 'replace'
        next = 'search'
      else
        next = command
    else if arg == '--'
      options.push '--'
      
      at++
      next = 'skip_options'
    else if next == 'options' and arg.substring(0, 1) != '-'
      next = 'skip_options'
    else if next == 'options'
      options.push arg
      at++
    else if next == 'ned'
      ned = optimist(command, options)
      ned.command = command
      if command == 'replace' and ned._.length < 2
        # in this case, we incorrectly matched an options value, e.g. ned -n 11..40 search replace
        # but good ol optimist correctly noticed, so there's no value for 'r' yet
        next = 'replace' # get one more value
      else
        if command == 'inplace'
          ned.files = ned._
        else if command in ['grep', 'suppress']
          ned.patterns = ned._
        else if command == 'replace'
          ned.search = ned._[0]
          ned.replace = ned._[1]
        delete ned._
        
        console.log {ned} if output_debug
        neds.push ned
        next = 'command'
    else
      throw new Error("I should not be @ #{next}")
  # /while
  if next != 'command'
    showHelpAndExit(1)
    console.log "Expected 'command', got #{next}" if output_debug
    process.exit(1)
  
  if neds[0].command == 'inplace'
    inplace = neds.shift();
    console.log {inplace} if output_debug
    for file in inplace.files
      do (file)->
        path.exists file, (exists)->
          if exists then fs.readFile file, 'utf8', (err, input)->
            throw err if err
            output = nedCommands(neds, input, output_debug)
            fs.writeFile file, output, 'utf8'
  else
    if process.input # this makes writing tests much easier...
      nedCommands(neds, process.input, output_debug)
    else
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      
      input = ''
      process.stdin.on 'data', (chunk)->
        input += chunk
      
      process.stdin.on 'end', ()->
        process.stdout.write nedCommands(neds, input, output_debug)
  

escapeRegex = (text) -> text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")


nedCommands = (neds, input, output_debug = false)->
  input = input.replace(/\r\n|\r/g, "\n")
  console.log {input} if output_debug
  ends_in_newline = input[input.length - 1] == "\n"
  input = input.substring(0, input.length - 1) if ends_in_newline
  console.log {input,ends_in_newline} if output_debug and ends_in_newline
  
  for ned in neds
    console.log {command: ned.command} if output_debug
    switch ned.command
      when 'replace'
        input = nedReplace(input, ned, output_debug)
      when 'suppress'
        input = nedSuppress(input, ned, output_debug)
      when 'grep'
        input = nedGrep(input, ned, output_debug)
      else
        throw new Error("Unknown command #{ned.command}")
  input += "\n" if ends_in_newline
  input


nedReplace = (input, ned, output_debug = false)->
  console.log {input,ned} if output_debug
  search = ned.search
  replace = ned.replace
  flags = ''
  if ned.multiline
    flags += 'm'
    lines = [input]
  else
    lines = input.split("\n")
  
  if ned.insensitive
    flags += 'i'
  
  offset = null
  limit = ned.limit
  if not limit
    # search for a '-1..n' match
    for opt,value of ned
      if value and opt.match /^[0-9]+$/
        limit = Number(opt)
        break;
  
  if not limit
    flags += 'g'
    limit = 1
  else if match = limit.toString().match /^([0-9]+)\.\.([0-9]+)$/
    offset = Number(match[1])
    limit = Number(match[2])
  
  if ned.literal
    search = new RegExp(escapeRegex(search), flags)
  else
    search = new RegExp(search, flags)
  
  input = ''
  for line, i in lines
    prefix = ''
    if offset?
      for s in [0...offset]
        match = line.match(search)
        if ! match then break
        prefix += line.substring(0, match.index + 1)
        line = line.substring(match.index + 1)
    
    for l in [1..limit]
      after = line.replace(search, replace)
      console.log {line, search, replace, flags,after} if output_debug
      line = after
    lines[i] = prefix + line
  lines.join("\n")


nedSuppress = (input, ned, output_debug = false)->
  flags = ''
  if ned.multiline
    flags += 'm'
    lines = [input]
  else
    lines = input.split("\n")
  
  if ned.insensitive
    flags += 'i'
  
  patterns = []
  console.log {patterns:ned.patterns} if output_debug
  for pattern in ned.patterns
    if ned.literal
      patterns.push new RegExp(escapeRegex(pattern), flags)
    else
      patterns.push new RegExp(pattern, flags)
  
  input = ''
  ret = []
  for line, i in lines
    console.log {line, patterns, flags} if output_debug
    ret.push line
    for pattern in patterns
      if line.match(pattern)
        ret.pop()
        break
  ret.join("\n")


nedGrep = (input, ned, output_debug = false)->
  flags = ''
  if ned.multiline
    flags += 'm'
    lines = [input]
  else
    lines = input.split("\n")
  
  if ned.insensitive
    flags += 'i'
  
  patterns = []
  console.log {patterns:ned.patterns} if output_debug
  for pattern in ned.patterns
    if ned.literal
      patterns.push new RegExp(escapeRegex(pattern), flags)
    else
      patterns.push new RegExp(pattern, flags)
  
  input = ''
  ret = []
  for line, i in lines
    console.log {line, patterns, flags} if output_debug
    for pattern in patterns
      if line.match(pattern)
        ret.push line
        break
  ret.join("\n")


usage = """Usage:

ned [-S] [options] {pattern} {replace} [...]
ned -N [options] {pattern} [...]
ned -I {file} [file...] -- [commands]
ned -X {file}
ned -h
"""

ned.showHelpAndExit = showHelpAndExit = (ret = 0)->
  console.log """
   ned
  -----
  
  A reimplementation of the parts of `sed` that I like.
  
  1. straight-forward stdin | ned | stdout regex replaces
      $ echo 'test' | ned -1 t 'is the b' -n 1..1 t '$&!' ^ 'ned '
      ned is the best!
  2. Suppressing lines of text
      $ echo -n 'test1
      > test2
      > test3' | ned -N 2$
      test1
      test3
  3. Inplace file rewriting. -S is required, otherwise it looks like a file
      $ ned -I fileA fileB -S .jpg .gif
  4. Scriptable (kinda).
  
  Commands:
    (default)     : perform a substitution
    -N,--suppress : suppress lines matching {pattern}
    -I,--inplace  : inplace file(s) replacement
  
  Search Options:
    -l,--literal    : do not compile search into a regular expression
    -i,--insensitive: case-insensitive search
    -m,--multiline  : search entire document, not line by line, and '.' matches newlines.
    --              : placeholder, if you want to match the string '-.*', use this is separate options from search
  Search/replace options:
    -n,--limit X    : replace X occurences
    -n Y..X         : replace X occurences, starting at the Yth match
    -1,...-9        : replace N occurences
  Suppress output options:
    -!,--invert     : invert matches
  Inplace rewrite options:
    -c,--confirm    : confirm changes
  """
  process.exit(ret)


module.exports = ned
