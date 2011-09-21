 ned
-----

A reimplementation of the parts of `sed` that I like.

`$ npm install -g ned`

1. straight-forward stdin | ned | stdout regex replaces

    $ echo 'test' | ned -1 t 'is the b' -n 1..1 t '$&!' ^ 'ned '
    ned is the best!

2. Suppressing lines of text

    $ echo -n 'test1
    test2
    test3' | ned -N 2\$'
    test1
    test3

3. Inplace file rewriting. -S is required, otherwise it looks like a file

    $ ned -I fileA fileB -S .jpg .gif

## Commands:

*  -S (default)  : perform a substitution
*  -N,--suppress : suppress lines matching {pattern}
*  -I,--inplace  : inplace file(s) replacement

## Search Options:

*  -l,--literal    : do not compile search into a regular expression
*  -i,--insensitive: case-insensitive search
*  -m,--multiline  : search entire document, not line by line, and '.' matches newlines.
*  --              : placeholder, if you want to match the string '-.*', use this is separate options from search

## Search/replace options:

*  -n,--limit X    : replace X occurences
*  -n Y..X         : replace X occurences, starting at the Yth match
*  -1,...-9        : replace N occurences

## Suppress output options:

*  -!,--invert     : invert matches

## Inplace rewrite options:

*  -c,--confirm    : confirm changes, NOT IMPLEMENTED as of 0.9.0

## TODO:

* support for -c -- easy, but I don't feel like working with stdin/readline right now.
* I had originally had an idea for scripts; these would be coffeescript files that were passed globals like 'replace' and 'suppress', and would be stored in a global location, like ~/.ned/