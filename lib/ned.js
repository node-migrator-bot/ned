(function() {
  var escapeRegex, fs, ned, nedCommands, nedGrep, nedReplace, nedSuppress, optimist, path, showHelpAndExit, usage;
  var __slice = Array.prototype.slice, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  fs = require('fs');
  path = require('path');
  optimist = function(command, argv) {
    var opt;
    opt = require('../optimist.js')(argv).usage(usage).string('_').boolean([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    if (command === 'replace' || command === 'suppress' || command === 'grep') {
      opt.boolean('l').alias('l', 'literal').boolean('i').alias('i', 'insensitive').alias('m', 'multiline').boolean('m');
    }
    if (command === 'replace') {
      opt.alias('n', 'limit').check(function(argv) {
        return !(argv.n != null) || typeof argv.n === 'number' || !!argv.n.match(/^[0-9]+\.\.[0-9]+$/);
      });
    }
    if (command === 'inplace') {
      opt.alias('c', 'confirm').boolean('c');
    }
    return opt.argv;
  };
  ned = function(process) {
    var arg, argv, at, cmd, command, commands, file, inplace, input, neds, next, node, options, output_debug, _i, _len, _ref, _ref2, _ref3, _results;
    _ref = process.argv, node = _ref[0], cmd = _ref[1], argv = 3 <= _ref.length ? __slice.call(_ref, 2) : [];
    output_debug = argv[argv.length - 1] === '--debug' ? argv.pop() : false;
    neds = [];
    options = null;
    command = null;
    next = 'command';
    commands = ['-R', '-S', '-N', '-I'];
    at = 0;
    while (at < argv.length || next === 'ned') {
      arg = argv[at];
      if (output_debug) {
        console.log({
          next: next,
          arg: arg,
          options: options
        });
      }
      if (next === 'command') {
        command = null;
        switch (arg) {
          case '-R':
          case '--replace':
            command = 'replace';
            break;
          case '-S':
          case '--grep':
            command = 'grep';
            break;
          case '-N':
          case '--suppress':
            command = 'suppress';
            break;
          case '-I':
          case '--inplace':
            command = 'inplace';
        }
        if (command === 'inplace' && neds.length) {
          throw new Error("inplace command must be the first ned command");
        }
        if (command) {
          at++;
        } else if (at === argv.length - 1) {
          command = 'grep';
        } else {
          command = 'replace';
        }
        if (output_debug) {
          console.log({
            command: command
          });
        }
        options = [];
        next = 'options';
      } else if (next === 'search') {
        if (output_debug) {
          console.log({
            search: arg
          });
        }
        options.push(arg);
        at++;
        if (at === argv.length || (_ref2 = argv[at], __indexOf.call(commands, _ref2) >= 0)) {
          next = 'ned';
          command = 'grep';
          if (output_debug) {
            console.log({
              command: command
            });
          }
        } else {
          next = 'replace';
        }
      } else if (next === 'replace') {
        if (output_debug) {
          console.log({
            replace: arg
          });
        }
        options.push(arg);
        next = 'ned';
        at++;
      } else if (next === command) {
        if (__indexOf.call(commands, arg) >= 0) {
          next = 'ned';
        } else if (command === 'inplace' && arg === '-c') {
          options.push(arg);
          at++;
        } else {
          if (output_debug) {
            console.log({
              "command+=": arg
            });
          }
          options.push(arg);
          at++;
          if (at === argv.length) {
            next = 'ned';
          }
        }
      } else if (next === 'skip_options') {
        if (command === 'replace') {
          next = 'search';
        } else {
          next = command;
        }
      } else if (arg === '--') {
        options.push('--');
        at++;
        next = 'skip_options';
      } else if (next === 'options' && arg.substring(0, 1) !== '-') {
        next = 'skip_options';
      } else if (next === 'options') {
        options.push(arg);
        at++;
      } else if (next === 'ned') {
        if (output_debug) {
          console.log({
            command: command,
            options: options
          });
        }
        ned = optimist(command, options);
        ned.command = command;
        if (command === 'replace' && ned._.length < 2) {
          next = 'replace';
        } else {
          if (command === 'inplace') {
            ned.files = ned._;
          } else if (command === 'grep' || command === 'suppress') {
            ned.patterns = ned._;
          } else if (command === 'replace') {
            ned.search = ned._[0];
            ned.replace = ned._[1];
          }
          delete ned._;
          if (output_debug) {
            console.log({
              ned: ned
            });
          }
          neds.push(ned);
          next = 'command';
        }
      } else {
        throw new Error("I should not be @ " + next);
      }
    }
    if (next !== 'command') {
      if (output_debug) {
        throw new Error("Expected 'command', got " + next);
      }
    }
    if (neds[0].command === 'inplace') {
      inplace = neds.shift();
      if (output_debug) {
        console.log({
          inplace: inplace
        });
      }
      _ref3 = inplace.files;
      _results = [];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        file = _ref3[_i];
        _results.push((function(file) {
          return path.exists(file, function(exists) {
            if (exists) {
              return fs.readFile(file, 'utf8', function(err, input) {
                var output;
                if (err) {
                  throw err;
                }
                output = nedCommands(neds, input, output_debug);
                return fs.writeFile(file, output, 'utf8');
              });
            }
          });
        })(file));
      }
      return _results;
    } else {
      if (process.input) {
        return nedCommands(neds, process.input, output_debug);
      } else {
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        input = '';
        process.stdin.on('data', function(chunk) {
          return input += chunk;
        });
        return process.stdin.on('end', function() {
          try {
            return process.stdout.write(nedCommands(neds, input, output_debug));
          } catch (e) {
            return console.error(e.message);
          }
        });
      }
    }
  };
  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };
  nedCommands = function(neds, input, output_debug) {
    var ends_in_newline, ned, _i, _len;
    if (output_debug == null) {
      output_debug = false;
    }
    input = input.replace(/\r\n|\r/g, "\n");
    if (output_debug) {
      console.log({
        input: input
      });
    }
    ends_in_newline = input[input.length - 1] === "\n";
    if (ends_in_newline) {
      input = input.substring(0, input.length - 1);
    }
    if (output_debug && ends_in_newline) {
      console.log({
        input: input,
        ends_in_newline: ends_in_newline
      });
    }
    for (_i = 0, _len = neds.length; _i < _len; _i++) {
      ned = neds[_i];
      if (output_debug) {
        console.log({
          command: ned.command
        });
      }
      switch (ned.command) {
        case 'replace':
          input = nedReplace(input, ned, output_debug);
          break;
        case 'suppress':
          input = nedSuppress(input, ned, output_debug);
          break;
        case 'grep':
          input = nedGrep(input, ned, output_debug);
          break;
        default:
          throw new Error("Unknown command " + ned.command);
      }
    }
    if (ends_in_newline) {
      input += "\n";
    }
    return input;
  };
  nedReplace = function(input, ned, output_debug) {
    var after, flags, i, l, limit, line, lines, match, offset, opt, prefix, replace, s, search, value, _len;
    if (output_debug == null) {
      output_debug = false;
    }
    if (output_debug) {
      console.log({
        input: input,
        ned: ned
      });
    }
    search = ned.search;
    replace = ned.replace;
    flags = '';
    if (ned.multiline) {
      flags += 'm';
      lines = [input];
    } else {
      lines = input.split("\n");
    }
    if (ned.insensitive) {
      flags += 'i';
    }
    offset = null;
    limit = ned.limit;
    if (!limit) {
      for (opt in ned) {
        value = ned[opt];
        if (value && opt.match(/^[0-9]+$/)) {
          limit = Number(opt);
          break;
        }
      }
    }
    if (!limit) {
      flags += 'g';
      limit = 1;
    } else if (match = limit.toString().match(/^([0-9]+)\.\.([0-9]+)$/)) {
      offset = Number(match[1]);
      limit = Number(match[2]);
    }
    if (ned.literal) {
      search = new RegExp(escapeRegex(search), flags);
    } else {
      search = new RegExp(search, flags);
    }
    input = '';
    for (i = 0, _len = lines.length; i < _len; i++) {
      line = lines[i];
      prefix = '';
      if (offset != null) {
        for (s = 0; 0 <= offset ? s < offset : s > offset; 0 <= offset ? s++ : s--) {
          match = line.match(search);
          if (!match) {
            break;
          }
          prefix += line.substring(0, match.index + 1);
          line = line.substring(match.index + 1);
        }
      }
      for (l = 1; 1 <= limit ? l <= limit : l >= limit; 1 <= limit ? l++ : l--) {
        after = line.replace(search, replace);
        if (output_debug) {
          console.log({
            line: line,
            search: search,
            replace: replace,
            flags: flags,
            after: after
          });
        }
        line = after;
      }
      lines[i] = prefix + line;
    }
    return lines.join("\n");
  };
  nedSuppress = function(input, ned, output_debug) {
    var flags, i, line, lines, pattern, patterns, ret, _i, _j, _len, _len2, _len3, _ref;
    if (output_debug == null) {
      output_debug = false;
    }
    if (!ned.patterns.length) {
      throw new Error("No patterns in `suppress` command");
    }
    flags = '';
    if (ned.multiline) {
      flags += 'm';
      lines = [input];
    } else {
      lines = input.split("\n");
    }
    if (ned.insensitive) {
      flags += 'i';
    }
    patterns = [];
    if (output_debug) {
      console.log({
        patterns: ned.patterns
      });
    }
    _ref = ned.patterns;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      pattern = _ref[_i];
      if (ned.literal) {
        patterns.push(new RegExp(escapeRegex(pattern), flags));
      } else {
        patterns.push(new RegExp(pattern, flags));
      }
    }
    input = '';
    ret = [];
    for (i = 0, _len2 = lines.length; i < _len2; i++) {
      line = lines[i];
      if (output_debug) {
        console.log({
          line: line,
          patterns: patterns,
          flags: flags
        });
      }
      ret.push(line);
      for (_j = 0, _len3 = patterns.length; _j < _len3; _j++) {
        pattern = patterns[_j];
        if (line.match(pattern)) {
          ret.pop();
          break;
        }
      }
    }
    return ret.join("\n");
  };
  nedGrep = function(input, ned, output_debug) {
    var flags, i, line, lines, pattern, patterns, ret, _i, _j, _len, _len2, _len3, _ref;
    if (output_debug == null) {
      output_debug = false;
    }
    if (!ned.patterns.length) {
      throw new Error("No patterns in `grep` command");
    }
    flags = '';
    if (ned.multiline) {
      flags += 'm';
      lines = [input];
    } else {
      lines = input.split("\n");
    }
    if (ned.insensitive) {
      flags += 'i';
    }
    patterns = [];
    if (output_debug) {
      console.log({
        patterns: ned.patterns
      });
    }
    _ref = ned.patterns;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      pattern = _ref[_i];
      if (ned.literal) {
        patterns.push(new RegExp(escapeRegex(pattern), flags));
      } else {
        patterns.push(new RegExp(pattern, flags));
      }
    }
    input = '';
    ret = [];
    for (i = 0, _len2 = lines.length; i < _len2; i++) {
      line = lines[i];
      if (output_debug) {
        console.log({
          line: line,
          patterns: patterns,
          flags: flags
        });
      }
      for (_j = 0, _len3 = patterns.length; _j < _len3; _j++) {
        pattern = patterns[_j];
        if (line.match(pattern)) {
          ret.push(line);
          break;
        }
      }
    }
    return ret.join("\n");
  };
  usage = "Usage:\n\nned [-S] [options] {pattern} {replace} [...]\nned -N [options] {pattern} [...]\nned -I {file} [file...] -- [commands]\nned -X {file}\nned -h";
  ned.showHelpAndExit = showHelpAndExit = function(ret) {
    if (ret == null) {
      ret = 0;
    }
    console.log(" ned\n-----\n\nA reimplementation of the parts of `sed` that I like.\n\n1. straight-forward stdin | ned | stdout regex replaces\n    $ echo 'test' | ned -1 t 'is the b' -n 1..1 t '$&!' ^ 'ned '\n    ned is the best!\n2. Suppressing lines of text\n    $ echo -n 'test1\n    > test2\n    > test3' | ned -N 2$\n    test1\n    test3\n3. Inplace file rewriting. -S is required, otherwise it looks like a file\n    $ ned -I fileA fileB -S .jpg .gif\n4. Scriptable (kinda).\n\nCommands:\n  (default)     : perform a substitution\n  -N,--suppress : suppress lines matching {pattern}\n  -I,--inplace  : inplace file(s) replacement\n\nSearch Options:\n  -l,--literal    : do not compile search into a regular expression\n  -i,--insensitive: case-insensitive search\n  -m,--multiline  : search entire document, not line by line, and '.' matches newlines.\n  --              : placeholder, if you want to match the string '-.*', use this is separate options from search\nSearch/replace options:\n  -n,--limit X    : replace X occurences\n  -n Y..X         : replace X occurences, starting at the Yth match\n  -1,...-9        : replace N occurences\nSuppress output options:\n  -!,--invert     : invert matches\nInplace rewrite options:\n  -c,--confirm    : confirm changes");
    return process.exit(ret);
  };
  module.exports = ned;
}).call(this);
