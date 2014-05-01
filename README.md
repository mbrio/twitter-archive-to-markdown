# Twitter Archive to Markdown

This is a tool that can be used to convert the JSON data within a Twitter
archive to Markdown. It currently supports converting entities to links.

You may download your Twitter archive by logging into
[Twitter](https://twitter.com); going to
[settings](https://twitter.com/settings/account); at the bottom of the
page you'll see a button for downloading your archive.

## Usage

You must run the application by specifying both an `--in` and `--out`
parameter.

```
> ./app.js --in /location/to/tweet/json/folder --out /save/to/me
```

The `--in` parameter must point to the folder where the JSON data resides,
within my Twitter archive it is found in `/data/js/tweets`; the `--out`
parameter is where you would like the markdown saved to.

## License

Copyright (c) 2014 Michael Diolosa <michael.diolosa@gmail.com>

The twitter-archive-to-markdown application is licensed under the MIT license.
