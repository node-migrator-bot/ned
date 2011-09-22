 ned
-----

A reimplementation of the parts of `sed` that I like.

```sh
$ npm install -g ned
```

1. straight-forward `stdin | ned | stdout` regex replaces (default when there is more than one argument)

    ```sh
    $ echo 'test' | ned -1 t 'is the b' -n 1..1 t '$&!' ^ 'ned '
    ned is the best!
    ```


2. Only display matching lines (default when there is only one argument)
   AND and OR are supported in a neat way.  Each `--grep` command is an OR operation, multiple
   `--grep` commands are AND operations.

    ```sh
    $ echo 'test1
    bad1
    test2
    bad2
    test3
    bad3' | ned -S test [13] # OR
    test1
    test2
    ```

    ```sh
    $ echo 'test1
    bad1
    test2
    bad2
    test3
    bad3' | ned -S test -S [13] # AND
    test1
    test3
    ```


3. Suppressing lines of text

    ```sh
    $ echo -n 'test1
    test2
    test3' | ned -N 2\$'
    test1
    test3
    ```


4. Inplace file rewriting. `-R` is required, otherwise it looks like a file

    ```sh
    $ ned -I fileA fileB -R .jpg .gif
    ```


## Commands:

*  -R,--replace  : perform a substitution {search} {replace}
*  -S,--grep     : only print lines matching {pattern}
*  -N,--suppress : suppress lines matching {pattern}
*  -I,--inplace  : inplace file(s) replacement

## Search Options: (replace, grep, suppress)

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

* support for -c — easy, but I don't feel like working with stdin/readline right now.
* I had originally had an idea for scripts; these would be coffeescript files that were passed globals like 'replace' and 'suppress', and would be stored in a global location, like ~/.ned/