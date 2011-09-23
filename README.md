 ned
-----

A reimplementation of the parts of `sed` that I like.

```sh
$ npm install -g ned
```

1. straight-forward `stdin | ned | stdout` regex replaces (default when there is more than one argument) (sed 's')

    ```sh
    $ echo 'test' | ned -1 t 'is the b' -n 1..1 t '$&!' ^ 'ned '
    ned is the best!
    ```


2. Only display matching lines (default when there is only one argument)
   AND and OR are supported in a neat way.  Each `--grep` command is an OR operation, multiple
   `--grep` commands are AND operations. (sed 'p')

    ```sh
    $ echo 'good1
    bad1
    good2
    bad2
    good3
    bad3' | ned -P good [13] # OR
    good1
    bad1
    good2
    good3
    bad3
    ```

    ```sh
    $ echo 'good1
    bad1
    good2
    bad2
    good3
    bad3' | ned -P good -P [13] # AND
    good1
    good3
    ```


3. Suppressing lines of text (sed 'd')

    ```sh
    $ echo -n 'test1
    test2
    test3' | ned -D 2\$'
    test1
    test3
    ```


4. Inplace file rewriting. `-S` is required, otherwise it looks like a file. (sed 'd')

    ```sh
    $ ned -I fileA fileB -S .jpg .gif
    ```


## Commands:

Don't complain about these commands - they are based on the sed command names.

*  `-S --replace    `: perform a substitution {search} {replace}
*  `-P --grep       `: only print lines matching {pattern}
*  `-D --suppress   `: suppress lines matching {pattern}
*  `-I --inplace    `: inplace file(s) replacement

## Search Options: (replace, grep, suppress)

*  `-l --literal    `: do not compile search into a regular expression
*  `-i --insensitive`: case-insensitive search
*  `-m --multiline  `: search entire document, not line by line, and '.' matches newlines.
*  `--              `: placeholder, if you want to match the string '-.*', use this is separate options from search

## Search/replace options:

*  `-n,--limit X    `: replace X occurences
*  `-n Y..X         `: replace X occurences, starting at the Yth match
*  `-1,...-9        `: replace N occurences

## Inplace rewrite options:

*  -c,--confirm    : confirm changes, NOT IMPLEMENTED as of 0.9.0

## TODO:

* support for -c — easy, but I don't feel like working with stdin/readline right now.
* I had originally had an idea for scripts; these would be coffeescript files that were passed globals like 'replace' and 'suppress', and would be stored in a global location, like ~/.ned/