# Adblocker

Very *fast* and *memory efficient*, pure-JavaScript content-blocking library made by Cliqz.

This library is the building block technology used to power the adblockers from Ghostery and Cliqz on both desktop and mobile platforms. Being a pure JavaScript library it does not make any assumption regarding the environment it will run in (apart from the availability of a JavaScript engine) and is trivial to include in any new project. It can also be used as a building block for tooling. It is already running in production for millions of users and has been used successfully to satisfy the following use-cases:

* Mobile-friendly adblocker for Android in multiple setups: react-native, WebExtension, etc. ([ghostery](https://github.com/ghostery/browser-android) and [cliqz](https://github.com/cliqz-oss/browser-android))
* Ads and trackers blocker in Electron applications, Puppeteer headless browsers, Cliqz browser, WebExtensions ([cliqz](https://github.com/cliqz-oss/browser-core), [ghostery](https://github.com/ghostery/ghostery-extension/) and [standalone](https://github.com/remusao/blockrz))
* Backend requests processing job

The library provides all necessary building blocks to create a powerful and efficient content-blocker and gives full flexibility as to which lists should be used and how they should be fetched or updated.

* [Installation](#installation)
* [Performance](#performance)
* [Supported Filters](#rules)
* [Releasing](#release)

<a id="installation"></a>
## Installation

Multiple specialized packages are available to satisfy different needs:

* `@cliqz/adblocker` (core logic of content blocking)
* `@cliqz/adblocker-webextension`
* `@cliqz/adblocker-puppeteer`
* `@cliqz/adblocker-electron`

Checkout detailed documentation for each of these packages in the `packages`
directory.

<a id="performance"></a>
## Performance

To make sure content blocking can run at full-speed on a variety of devices (including low-end mobile phones), we built the library with performance in mind from the ground-up. From our [recent performance study](https://whotracks.me/blog/adblockers_performance_study.html), we perform consistently better than popular alternatives in terms of: *memory consumption*, *start from cache time*, *matching speed* and *size of cache*.

Matching speed corresponds to the time it takes to decide if a network request should be blocked or allowed. It needs to be as fast as possible to not induce any significant over-head in the browser:
![](https://github.com/cliqz-oss/adblocker/blob/d63d545095a1d47626c9fd29e14a813a2ff4f012/bench/comparison/plots/ghostery-ublock-origin-brave-duckduckgo-adblock-plus-all.svg)

Memory usage is another very important dimension. Here is the memory used after initialization:
![](https://github.com/cliqz-oss/adblocker/blob/d63d545095a1d47626c9fd29e14a813a2ff4f012/bench/comparison/plots/memory-usage-at-startup.svg)

Cache size corresponds to the size in bytes of the Uint8Array returned by `engine.serialize()`:
![](https://github.com/cliqz-oss/adblocker/blob/d63d545095a1d47626c9fd29e14a813a2ff4f012/bench/comparison/plots/cache-size.svg)

Another interesting metric is the time it takes to initialize the `FiltersEngine` instance from its serialized form. It is especially beneficial for mobile phones, because this serialized engine can be created backend-side and distributed through a CDN; which means clients do not have any cost to pay except downloading the file.
![](https://github.com/cliqz-oss/adblocker/blob/d63d545095a1d47626c9fd29e14a813a2ff4f012/bench/comparison/plots/deserializationtimings.svg)

<a id="rules"></a>
## Supported Filters

The majority of the common filters are supported out of the box but some rare ones are not. To know more, check [the compatibility matrix](https://github.com/cliqz-oss/adblocker/wiki/Compatibility-Matrix) on the wiki.

<a id="release"></a>
## Release Checklist

To publish a new version:

0. Bump `ENGINE_VERSION` in `engine.ts` (to invalidate serialized versions)
1. Create a new branch (e.g.: `release-x.y.z`)
2. Update `version` in [package.json](./package.json)
3. Update [CHANGELOG.md](./CHANGELOG.md)
4. Create a release commit (e.g.: "Release vx.y.z")
5. Create a PR for the release
6. Merge and create a new Release on GitHub
7. Travis takes care of the rest!

## License

[Mozilla Public License 2.0](./LICENSE)
