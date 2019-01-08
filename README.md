# Adblocker

A fast, pure-JavaScript content-blocking library made by Cliqz.

This library is the building block technology used to power Cliqz and Ghostery's Adblocking. Being a pure JavaScript library, it can be used for various purposes such as:

* Building a content-blocking extension (see [this example](./example) for a minimal content-blocking webextension)
* Building tooling around popular block-lists such as [EasyList](https://github.com/easylist/easylist)
* Converting between various formats of filters (EasyList, Safari Block Lists, etc.)
* Detecting duplicates in lists
* Detecting dead domains
* etc.

The library provides the low-level implementation to fetch, parse and match filters; which makes it possible to manipulate the lists at a high level.

## Development

Install dependencies:
```sh
$ npm install
```

Build:
```sh
$ npm pack
```

Test:
```sh
$ npm run test
```

You can use the following bundle: `adblocker.umd.js`.

## Releasing Checklist

To publish a new version:

1. Update `version` in [package.json](./package.json)
2. Update [CHANGELOG.md](./CHANGELOG.md)
3. New commit on local `master` branch (e.g.: `Release vx.y.z`)
5. Make release PR with your commit
6. Merge and create new Release on GitHub
6. Travis takes care of the rest!

## License

[Mozilla Public License 2.0](./LICENSE)
