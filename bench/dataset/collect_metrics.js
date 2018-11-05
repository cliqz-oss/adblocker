const fs = require('fs');
const path = require('path');
const readline = require('readline');

const adblocker = require(path.resolve(__dirname, '../../dist/adblocker.umd.js'));

function loadLists() {
  return {
    // lists: [
    //   fs.readFileSync('./offers_filters.txt', { encoding: 'utf-8' }),
    // ],
    // lists: [
    //   fs.readFileSync('./mobile_filters.txt', { encoding: 'utf-8' }),
    // ],
    lists: [
      // 'raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt',
      // 'raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
      // 'raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/unbreak.txt',
      // 'raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt',
      // 'easylist-downloads.adblockplus.org/antiadblockfilters.txt',
      // 'easylist.to/easylistgermany/easylistgermany.txt',
      'easylist.to/easylist/easylist.txt',
      // 'pgl.yoyo.org/adservers/serverlist.txt',
    ].map(asset => fs
      .readFileSync(path.resolve(__dirname, '../../assets/', asset), { encoding: 'utf-8' })
      .replace(/[+]js[(]/g, 'script:inject(')),
    resources: fs.readFileSync(
      path.resolve(
        __dirname,
        '../../assets/',
        'raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resources.txt',
      ),
      { encoding: 'utf-8' },
    ),
  };
}

function createEngine() {
  const { lists, resources } = loadLists();
  const engine = new adblocker.FiltersEngine({
    enableOptimizations: true,
    loadCosmeticFilters: false,
    loadNetworkFilters: true,
    optimizeAOT: true,
    version: 1,
  });

  engine.onUpdateResource([{ filters: resources, checksum: '' }]);
  engine.onUpdateFilters(
    lists.map((filters, i) => ({
      asset: `${i}`,
      checksum: '',
      filters,
    })),
    new Set(),
    true,
  );

  return engine;
}

async function main() {
  const engine = createEngine();

  // const lines = fs
  //   .readFileSync(process.argv[process.argv.length - 1], { encoding: 'utf-8' })
  //   .split(/\n/g);
  const lines = readline.createInterface({
    input: fs.createReadStream(process.argv[process.argv.length - 1]),
    crlfDelay: Infinity,
  });

  // Collect network filters
  let index = 0;

  let minMatch = 100;
  let maxMatch = 0;
  let timeNoMatch = 0;
  let totalNoMatch = 0;

  let minNoMatch = 100;
  let maxNoMatch = 0;
  let timeMatch = 0;
  let totalMatch = 0;

  const reqMinFilterMatch = 1000000;
  const reqMaxFilterMatch = 0;
  const reqSumFilterMatch = 0;

  const reqMinFilterNoMatch = 1000000;
  const reqMaxFilterNoMatch = 0;
  const reqSumFilterNoMatch = 0;

  // const slowRequests = [];
  // const requests = [];

  lines.on('line', (line) => {
  // for (let i = 0; i < lines.length; i += 1) {
  //   const line = lines[i];
    if (index !== 0 && index % 10000 === 0) {
      console.log(`Processed ${index} requests`);
    }
    index += 1;

    let request = null;
    try {
      request = JSON.parse(line);
    } catch (ex) {
      return;
      // continue;
    }

    const { cpt, sourceUrl, url } = request;

    const start = process.hrtime();
    const result = engine.match({
      cpt: cpt.toLowerCase(),
      sourceUrl,
      url,
    });
    const diff = process.hrtime(start);
    const totalHighResolution = (diff[0] * 1000000000 + diff[1]) / 1000000;

    // if (totalHighResolution > 1) {
    //   const filter = result.filter !== undefined ? result.filter.rawLine : null;
    //   const exception = result.exception !== undefined ? result.exception.rawLine : null;
    //   slowRequests.push({
    //     cumulTime: totalHighResolution,
    //     match: !!filter,
    //     filter,
    //     exception,
    //     cpt,
    //     url,
    //     sourceUrl,
    //   });
    // }

    // if (result.req.isSupported && result.req.filtersHit.length >= 10) {
    //   const tokens = result.req.getTokens();
    //   requests.push({
    //     url,
    //     tokensDup: tokens.length - [...new Set(tokens)].length,
    //     filtersDup: result.req.filtersHit.length - [...new Set(result.req.filtersHit)].length,
    //     tokens,
    //     filters: result.req.filtersHit,
    //     match: result.filter !== undefined,
    //   });
    // }

    if (result.filter !== undefined) {
      totalMatch += 1;
      timeMatch += totalHighResolution;
      minMatch = Math.min(minMatch, totalHighResolution);
      maxMatch = Math.max(maxMatch, totalHighResolution);

      // reqMaxFilterMatch = Math.max(reqMaxFilterMatch, result.req.filtersHit.length);
      // reqMinFilterMatch = Math.min(reqMinFilterMatch, result.req.filtersHit.length);
      // reqSumFilterMatch += result.req.filtersHit.length;
    } else {
      totalNoMatch += 1;
      timeNoMatch += totalHighResolution;
      minNoMatch = Math.min(minNoMatch, totalHighResolution);
      maxNoMatch = Math.max(maxNoMatch, totalHighResolution);

      // reqMaxFilterNoMatch = Math.max(reqMaxFilterNoMatch, result.req.filtersHit.length);
      // reqMinFilterNoMatch = Math.min(reqMinFilterNoMatch, result.req.filtersHit.length);
      // reqSumFilterNoMatch += result.req.filtersHit.length;
    }
  });

  await new Promise((resolve) => {
    lines.on('close', resolve);
  });

  console.log(`Total requests: ${totalNoMatch + totalMatch}`);
  console.log(`Total match: ${totalMatch}`);
  console.log(`Total no match: ${totalNoMatch}`);
  console.log();
  console.log(`Req Min filter match: ${reqMinFilterMatch}`);
  console.log(`Req Max filter match: ${reqMaxFilterMatch}`);
  console.log(`Req Avg filter match: ${reqSumFilterMatch / totalMatch}`);
  console.log();
  console.log(`Req Min filter no match: ${reqMinFilterNoMatch}`);
  console.log(`Req Max filter no match: ${reqMaxFilterNoMatch}`);
  console.log(`Req Avg filter no match: ${reqSumFilterNoMatch / totalNoMatch}`);
  console.log();
  console.log(`Min match: ${minMatch}`);
  console.log(`Max match: ${maxMatch}`);
  console.log(`Avg match: ${timeMatch / totalMatch}`);
  console.log();
  console.log(`Min no match: ${minNoMatch}`);
  console.log(`Max no match: ${maxNoMatch}`);
  console.log(`Avg no match: ${timeNoMatch / totalNoMatch}`);

  // Collect stats
  const filterData = [];
  const bucketData = [];
  ['filters'].forEach((type) => {
    engine[type].index.index.forEach((bucket, token) => {
      let originalToken = null;
      bucket.filters.forEach((filter) => {
        // Collect filter data
        filterData.push({
          filter: filter.rawLine,
          id: filter.getId(),
          hit: filter.hit,
          match: filter.match,
          cumulTime: filter.cumulTime,
          hasHostname: filter.hasHostname(),
          hasFilter: filter.hasFilter(),
          filterSize:
            (filter.hasFilter() ? filter.getFilter().length : 0)
            + (filter.hasHostname() ? filter.getHostname().length : 0),
          optDomains: filter.getOptDomains().size,
          optNotDomains: filter.getOptNotDomains().size,
          isHostnameAnchor: filter.isHostnameAnchor(),
          isRightAnchor: filter.isRightAnchor(),
          isLeftAnchor: filter.isLeftAnchor(),
          isRegex: filter.isRegex(),
          isPlain: filter.isPlain(),
          fromAny: filter.fromAny(),
          thirdParty: filter.thirdParty(),
          firstParty: filter.firstParty(),
          fromHttp: filter.fromHttp(),
          fromHttps: filter.fromHttps(),
          fromImage: filter.fromImage(),
          fromMedia: filter.fromMedia(),
          fromObject: filter.fromObject(),
          fromObjectSubrequest: filter.fromObjectSubrequest(),
          fromOther: filter.fromOther(),
          fromPing: filter.fromPing(),
          fromScript: filter.fromScript(),
          fromStylesheet: filter.fromStylesheet(),
          fromSubdocument: filter.fromSubdocument(),
          fromWebsocket: filter.fromWebsocket(),
          fromXmlHttpRequest: filter.fromXmlHttpRequest(),
          fromFont: filter.fromFont(),
        });

        // Find original token for bucket
        filter.rawLine.split(/[^\w]+/g).forEach((t) => {
          if (adblocker.fastHash(t) === token) {
            originalToken = t;
          }
        });
      });

      bucketData.push({
        token: originalToken,
        hit: bucket.hit,
        match: bucket.match,
        cumulTime: bucket.cumulTime,
        length: bucket.filters.length,
        tokensHit: bucket.tokensHit,
        filters: bucket.filters.map(f => f.rawLine).sort(),
        filterIds: bucket.filters.map(f => f.getId()),
      });
    });
  });

  const sortByTokens = arr => arr.sort((r1, r2) => {
    if (r1.tokens.length < r2.tokens.length) {
      return 1;
    }
    if (r1.tokens.length > r2.tokens.length) {
      return -1;
    }
    return 0;
  });


  const sortByCumulTime = arr => arr.sort((r1, r2) => {
    if (r1.cumulTime < r2.cumulTime) {
      return 1;
    }
    if (r1.cumulTime > r2.cumulTime) {
      return -1;
    }
    return 0;
  });

  // fs.writeFileSync('requestData.json', JSON.stringify(sortByTokens(requests)), {
  //   encoding: 'utf-8',
  // });

  fs.writeFileSync('bucketData.json', JSON.stringify(sortByCumulTime(bucketData)), {
    encoding: 'utf-8',
  });

  fs.writeFileSync('filterData.json', JSON.stringify(sortByCumulTime(filterData)), {
    encoding: 'utf-8',
  });

  // fs.writeFileSync(
  //   'slowRequests.json',
  //   JSON.stringify(sortByCumulTime(slowRequests), undefined, 2),
  //   {
  //     encoding: 'utf-8',
  //   },
  // );
}

main();
