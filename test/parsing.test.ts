import CosmeticFilter, { DEFAULT_HIDDING_STYLE } from '../src/filters/cosmetic';
import NetworkFilter from '../src/filters/network';
import { List } from '../src/lists';
import { fastHash } from '../src/utils';

// TODO: collaps, popup, popunder, generichide, genericblock
function network(filter: string, expected: any) {
  const parsed = NetworkFilter.parse(filter);
  if (parsed !== null) {
    expect(parsed.isNetworkFilter()).toBeTruthy();
    expect(parsed.isCosmeticFilter()).toBeFalsy();
    const verbose = {
      // Attributes
      bug: parsed.bug,
      csp: parsed.csp,
      filter: parsed.getFilter(),
      hostname: parsed.getHostname(),
      optDomains: parsed.getOptDomains(),
      optNotDomains: parsed.getOptNotDomains(),
      redirect: parsed.getRedirect(),

      // Filter type
      isCSP: parsed.isCSP(),
      isException: parsed.isException(),
      isHostnameAnchor: parsed.isHostnameAnchor(),
      isLeftAnchor: parsed.isLeftAnchor(),
      isPlain: parsed.isPlain(),
      isRedirect: parsed.isRedirect(),
      isRegex: parsed.isRegex(),
      isRightAnchor: parsed.isRightAnchor(),

      // Options
      firstParty: parsed.firstParty(),
      fromAny: parsed.fromAny(),
      fromFont: parsed.fromFont(),
      fromImage: parsed.fromImage(),
      fromMedia: parsed.fromMedia(),
      fromObject: parsed.fromObject(),
      fromOther: parsed.fromOther(),
      fromPing: parsed.fromPing(),
      fromScript: parsed.fromScript(),
      fromStylesheet: parsed.fromStylesheet(),
      fromSubdocument: parsed.fromSubdocument(),
      fromWebsocket: parsed.fromWebsocket(),
      fromXmlHttpRequest: parsed.fromXmlHttpRequest(),
      hasOptDomains: parsed.hasOptDomains(),
      hasOptNotDomains: parsed.hasOptNotDomains(),
      isImportant: parsed.isImportant(),
      matchCase: parsed.matchCase(),
      thirdParty: parsed.thirdParty(),
    };
    expect(verbose).toMatchObject(expected);
  } else {
    expect(parsed).toEqual(expected);
  }
}

const DEFAULT_NETWORK_FILTER = {
  // Attributes
  csp: undefined,
  filter: '',
  hostname: '',
  optDomains: new Uint32Array([]),
  optNotDomains: new Uint32Array([]),
  redirect: '',

  // Filter type
  isCSP: false,
  isException: false,
  isHostnameAnchor: false,
  isLeftAnchor: false,
  isPlain: false,
  isRedirect: false,
  isRegex: false,
  isRightAnchor: false,

  // Options
  firstParty: true,
  fromAny: true,
  fromImage: true,
  fromMedia: true,
  fromObject: true,
  fromOther: true,
  fromPing: true,
  fromScript: true,
  fromStylesheet: true,
  fromSubdocument: true,
  fromWebsocket: true,
  fromXmlHttpRequest: true,
  isImportant: false,
  matchCase: false,
  thirdParty: true,
};

describe('Network filters', () => {
  describe('toString', () => {
    const checkToString = (line: string, expected: string, debug: boolean = false) => {
      const parsed = NetworkFilter.parse(line);
      expect(parsed).not.toBeNull();
      if (parsed !== null) {
        if (debug) {
          parsed.rawLine = line;
        }
        expect(parsed.toString()).toBe(expected);
      }
    };

    [
      // Negations
      'ads$~image',
      'ads$~media',
      'ads$~object',
      'ads$~other',
      'ads$~ping',
      'ads$~script',
      'ads$~font',
      'ads$~stylesheet',
      'ads$~xmlhttprequest',

      // Options
      'ads$fuzzy',
      'ads$image',
      'ads$media',
      'ads$object',
      'ads$other',
      'ads$ping',
      'ads$script',
      'ads$font',
      'ads$third-party',
      'ads$first-party',
      'ads$stylesheet',
      'ads$xmlhttprequest',

      'ads$important',
      'ads$fuzzy',
      'ads$redirect=noop',
      'ads$bug=42',
    ].forEach((line) => {
      it(`pprint ${line}`, () => {
        checkToString(line, line);
      });
    });

    it('pprint anchored hostnames', () => {
      checkToString('@@||foo.com', '@@||foo.com^');
      checkToString('@@||foo.com|', '@@||foo.com^|');
      checkToString('|foo.com|', '|foo.com|');
      checkToString('foo.com|', 'foo.com|');
    });

    it('pprint domain', () => {
      checkToString('ads$domain=foo.com|bar.co.uk|~baz.io', 'ads$domain=<hashed>');
    });

    it('pprint with debug=true', () => {
      checkToString(
        'ads$domain=foo.com|bar.co.uk|~baz.io',
        'ads$domain=foo.com|bar.co.uk|~baz.io',
        true,
      );
    });
  });

  it('parses pattern', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isPlain: true,
    };

    network('ads', {
      ...base,
      filter: 'ads',
    });
    network('/ads/foo-', {
      ...base,
      filter: '/ads/foo-',
    });
    network('/ads/foo-$important', {
      ...base,
      filter: '/ads/foo-',
      isImportant: true,
    });
    network('foo.com/ads$important', {
      ...base,
      filter: 'foo.com/ads',
      isImportant: true,
    });
  });

  it('parses ||pattern', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isHostnameAnchor: true,
      isPlain: true,
    };

    network('||foo.com', {
      ...base,
      filter: '',
      hostname: 'foo.com',
    });
    network('||foo.com$important', {
      ...base,
      filter: '',
      hostname: 'foo.com',
      isImportant: true,
    });
    network('||foo.com/bar/baz$important', {
      ...base,
      filter: '/bar/baz',
      hostname: 'foo.com',
      isImportant: true,
      isLeftAnchor: true,
    });
  });

  it('parses ||pattern|', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isHostnameAnchor: true,
      isRightAnchor: true,
    };

    network('||foo.com|', {
      ...base,
      filter: '',
      hostname: 'foo.com',
      isPlain: true,
    });
    network('||foo.com|$important', {
      ...base,
      filter: '',
      hostname: 'foo.com',
      isImportant: true,
      isPlain: true,
    });
    network('||foo.com/bar/baz|$important', {
      ...base,
      filter: '/bar/baz',
      hostname: 'foo.com',
      isImportant: true,
      isLeftAnchor: true,
      isPlain: true,
    });
    network('||foo.com^bar/*baz|$important', {
      ...base,
      filter: '^bar/*baz',
      hostname: 'foo.com',
      isImportant: true,
      isLeftAnchor: true,
      isRegex: true,
    });
  });

  it('parses |pattern', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isLeftAnchor: true,
    };

    network('|foo.com', {
      ...base,
      filter: 'foo.com',
      hostname: '',
      isPlain: true,
    });
    network('|foo.com/bar/baz', {
      ...base,
      filter: 'foo.com/bar/baz',
      hostname: '',
      isPlain: true,
    });
    network('|foo.com^bar/*baz*', {
      ...base,
      filter: 'foo.com^bar/*baz', // Trailing * is stripped
      hostname: '',
      isRegex: true,
    });
  });

  it('parses |pattern|', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isLeftAnchor: true,
      isRightAnchor: true,
    };

    network('|foo.com|', {
      ...base,
      filter: 'foo.com',
      hostname: '',
      isPlain: true,
    });
    network('|foo.com/bar|', {
      ...base,
      filter: 'foo.com/bar',
      hostname: '',
      isPlain: true,
    });
    network('|foo.com/*bar^|', {
      ...base,
      filter: 'foo.com/*bar^',
      hostname: '',
      isRegex: true,
    });
  });

  it('parses regexp', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isRegex: true,
    };

    network('*bar^', {
      ...base,
      filter: 'bar^',
      hostname: '',
    });
    network('foo.com/*bar^', {
      ...base,
      filter: 'foo.com/*bar^',
      hostname: '',
    });
  });

  it('parses ||regexp', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isHostnameAnchor: true,
      isRegex: true,
    };

    network('||foo.com*bar^', {
      ...base,
      filter: 'bar^',
      hostname: 'foo.com',
    });
    network('||foo.com^bar*/baz^', {
      ...base,
      filter: '^bar*/baz^',
      hostname: 'foo.com',
      isLeftAnchor: true,
    });
  });

  it('parses ||regexp|', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isHostnameAnchor: true,
      isRegex: true,
      isRightAnchor: true,
    };

    network('||foo.com*bar^|', {
      ...base,
      filter: 'bar^',
      hostname: 'foo.com',
    });
    network('||foo.com^bar*/baz^|', {
      ...base,
      filter: '^bar*/baz^',
      hostname: 'foo.com',
      isLeftAnchor: true,
    });
  });

  it('parses |regexp', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isLeftAnchor: true,
      isRegex: true,
    };

    network('|foo.com*bar^', {
      ...base,
      filter: 'foo.com*bar^',
      hostname: '',
    });
    network('|foo.com^bar*/baz^', {
      ...base,
      filter: 'foo.com^bar*/baz^',
      hostname: '',
    });
  });

  it('parses |regexp|', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isLeftAnchor: true,
      isRegex: true,
      isRightAnchor: true,
    };

    network('|foo.com*bar^|', {
      ...base,
      filter: 'foo.com*bar^',
      hostname: '',
    });
    network('|foo.com^bar*/baz^|', {
      ...base,
      filter: 'foo.com^bar*/baz^',
      hostname: '',
    });
  });

  it('parses exceptions', () => {
    const base = {
      ...DEFAULT_NETWORK_FILTER,
      isException: true,
    };

    network('@@ads', {
      ...base,
      filter: 'ads',
      isPlain: true,
    });
    network('@@||foo.com/ads', {
      ...base,
      filter: '/ads',
      hostname: 'foo.com',
      isHostnameAnchor: true,
      isLeftAnchor: true,
      isPlain: true,
    });
    network('@@|foo.com/ads', {
      ...base,
      filter: 'foo.com/ads',
      isLeftAnchor: true,
      isPlain: true,
    });
    network('@@|foo.com/ads|', {
      ...base,
      filter: 'foo.com/ads',
      isLeftAnchor: true,
      isPlain: true,
      isRightAnchor: true,
    });
    network('@@foo.com/ads|', {
      ...base,
      filter: 'foo.com/ads',
      isPlain: true,
      isRightAnchor: true,
    });
    network('@@||foo.com/ads|', {
      ...base,
      filter: '/ads',
      hostname: 'foo.com',
      isHostnameAnchor: true,
      isLeftAnchor: true,
      isPlain: true,
      isRightAnchor: true,
    });
  });

  describe('options', () => {
    it('accepts any content type', () => {
      network('||foo.com', { fromAny: true });
      network('||foo.com$first-party', { fromAny: true });
      network('||foo.com$third-party', { fromAny: true });
      network('||foo.com$domain=test.com', { fromAny: true });
      network('||foo.com$domain=test.com,match-case', { fromAny: true });
    });

    [
      'image',
      'media',
      'object',
      'object-subrequest',
      'other',
      'ping',
      'script',
      'font',
      'stylesheet',
      'xmlhttprequest',
    ].forEach((option) => {
      it(`does not accept any content type: ~${option}`, () => {
        network(`||foo.com$~${option}`, { fromAny: false });
        network(`||foo.com$${option}`, { fromAny: false });
      });
    });

    describe('important', () => {
      it('parses important', () => {
        network('||foo.com$important', { isImportant: true });
      });

      it('parses ~important', () => {
        // Not supported
        network('||foo.com$~important', null);
      });

      it('defaults to false', () => {
        network('||foo.com', { isImportant: false });
      });
    });

    describe('csp', () => {
      it('defaults to no csp', () => {
        network('||foo.com', {
          csp: undefined,
          isCSP: false,
        });
      });

      it('parses simple csp', () => {
        network('||foo.com$csp=self bar ""', {
          csp: 'self bar ""',
          isCSP: true,
        });
      });

      it('parses empty csp', () => {
        network('||foo.com$csp', {
          csp: undefined,
          isCSP: true,
        });
      });

      it('parses csp mixed with other options', () => {
        network('||foo.com$domain=foo|bar,csp=self bar "",image', {
          csp: 'self bar ""',
          fromImage: true,
          isCSP: true,
        });
      });
    });

    describe('domain', () => {
      it('parses domain', () => {
        network('||foo.com$domain=bar.com', {
          hasOptDomains: true,
          optDomains: new Uint32Array([fastHash('bar.com')]),

          hasOptNotDomains: false,
          optNotDomains: new Uint32Array([]),
        });

        network('||foo.com$domain=bar.com|baz.com', {
          hasOptDomains: true,
          optDomains: new Uint32Array([fastHash('bar.com'), fastHash('baz.com')]),

          hasOptNotDomains: false,
          optNotDomains: new Uint32Array([]),
        });
      });

      it('parses ~domain', () => {
        network('||foo.com$domain=~bar.com', {
          hasOptDomains: false,
          optDomains: new Uint32Array([]),

          hasOptNotDomains: true,
          optNotDomains: new Uint32Array([fastHash('bar.com')]),
        });

        network('||foo.com$domain=~bar.com|~baz.com', {
          hasOptDomains: false,
          optDomains: new Uint32Array([]),

          hasOptNotDomains: true,
          optNotDomains: new Uint32Array([fastHash('bar.com'), fastHash('baz.com')]),
        });
      });

      it('parses domain and ~domain', () => {
        network('||foo.com$domain=~bar.com|baz.com', {
          hasOptDomains: true,
          optDomains: new Uint32Array([fastHash('baz.com')]),

          hasOptNotDomains: true,
          optNotDomains: new Uint32Array([fastHash('bar.com')]),
        });

        network('||foo.com$domain=bar.com|~baz.com', {
          hasOptDomains: true,
          optDomains: new Uint32Array([fastHash('bar.com')]),

          hasOptNotDomains: true,
          optNotDomains: new Uint32Array([fastHash('baz.com')]),
        });

        network('||foo.com$domain=foo|~bar|baz', {
          hasOptDomains: true,
          optDomains: new Uint32Array([fastHash('foo'), fastHash('baz')]),

          hasOptNotDomains: true,
          optNotDomains: new Uint32Array([fastHash('bar')]),
        });
      });

      it('defaults to no constraint', () => {
        network('||foo.com', {
          hasOptDomains: false,
          optDomains: new Uint32Array([]),

          hasOptNotDomains: false,
          optNotDomains: new Uint32Array([]),
        });
      });
    });

    describe('redirect', () => {
      it('parses redirect', () => {
        network('||foo.com$redirect=bar.js', {
          isRedirect: true,
          redirect: 'bar.js',
        });
        network('$redirect=bar.js', {
          isRedirect: true,
          redirect: 'bar.js',
        });
      });

      it('parses ~redirect', () => {
        // ~redirect is not a valid option
        network('||foo.com$~redirect', null);
      });

      it('parses redirect without a value', () => {
        // Not valid
        network('||foo.com$redirect', null);
        network('||foo.com$redirect=', null);
      });

      it('defaults to false', () => {
        network('||foo.com', {
          isRedirect: false,
          redirect: '',
        });
      });
    });

    describe('match-case', () => {
      it('parses match-case', () => {
        network('||foo.com$match-case', {
          matchCase: true,
        });
        network('||foo.com$image,match-case', {
          matchCase: true,
        });
        network('||foo.com$media,match-case,image', {
          matchCase: true,
        });
      });

      it('parses ~match-case', () => {
        // ~match-case is not supported
        network('||foo.com$~match-case', null);
      });

      it('defaults to false', () => {
        network('||foo.com', {
          matchCase: false,
        });
      });
    });

    describe('first-party', () => {
      it('parses first-party', () => {
        network('||foo.com$first-party', { firstParty: true });
        network('@@||foo.com$first-party', { firstParty: true });
        network('@@||foo.com|$first-party', { firstParty: true });
      });

      it('parses ~first-party', () => {
        network('||foo.com$~first-party', { firstParty: false });
        network('||foo.com$first-party,~first-party', { firstParty: false });
      });

      it('defaults to true', () => {
        network('||foo.com', { firstParty: true });
      });
    });

    describe('third-party', () => {
      it('parses third-party', () => {
        network('||foo.com$third-party', { thirdParty: true });
        network('@@||foo.com$third-party', { thirdParty: true });
        network('@@||foo.com|$third-party', { thirdParty: true });
        network('||foo.com$~first-party', { thirdParty: true });
      });

      it('parses ~third-party', () => {
        network('||foo.com$~third-party', { thirdParty: false });
        network('||foo.com$first-party,~third-party', { thirdParty: false });
      });

      it('defaults to true', () => {
        network('||foo.com', { thirdParty: true });
      });
    });

    describe('bug', () => {
      it('parses bug', () => {
        network('||foo.com$bug=42', { bug: 42 });
        network('@@||foo.com$bug=1337', { isException: true, bug: 1337 });
        network('@@||foo.com|$bug=11111', { isException: true, bug: 11111 });
        network('@@$bug=11111', { isException: true, bug: 11111 });
      });

      it('defaults to undefined', () => {
        network('||foo.com', { bug: undefined });
      });
    });

    describe('un-supported options', () => {
      [
        'badfilter',
        'genericblock',
        'generichide',
        'inline-script',
        'popunder',
        'popup',
        'woot',
      ].forEach((unsupportedOption) => {
        it(unsupportedOption, () => {
          network(`||foo.com$${unsupportedOption}`, null);
        });
      });
    });

    const allOptions = (value: boolean) => ({
      fromFont: value,
      fromImage: value,
      fromMedia: value,
      fromObject: value,
      fromOther: value,
      fromPing: value,
      fromScript: value,
      fromStylesheet: value,
      fromSubdocument: value,
      fromWebsocket: value,
      fromXmlHttpRequest: value,
    });

    [
      ['font', 'fromFont'],
      ['image', 'fromImage'],
      ['media', 'fromMedia'],
      ['object', 'fromObject'],
      ['object-subrequest', 'fromObject'],
      ['other', 'fromOther'],
      ['ping', 'fromPing'],
      ['script', 'fromScript'],
      ['stylesheet', 'fromStylesheet'],
      ['subdocument', 'fromSubdocument'],
      ['websocket', 'fromWebsocket'],
      ['xmlhttprequest', 'fromXmlHttpRequest'],
      ['xhr', 'fromXmlHttpRequest'],
    ].forEach(([option, attribute]) => {
      // all other attributes should be false if `$attribute` or true if `$~attribute`
      describe(option, () => {
        it(`parses ${option}`, () => {
          network(`||foo.com$${option}`, {
            ...allOptions(false),
            [attribute]: true,
          });
          network(`||foo.com$object,${option}`, {
            ...allOptions(false),
            fromObject: true,
            [attribute]: true,
          });
          network(`||foo.com$domain=bar.com,${option}`, {
            ...allOptions(false),
            [attribute]: true,
          });
        });

        it(`parses ~${option}`, () => {
          network(`||foo.com$~${option}`, {
            ...allOptions(true),
            [attribute]: false,
          });
          network(`||foo.com$${option},~${option}`, {
            [attribute]: false,
          });
        });

        it('defaults to true', () => {
          network('||foo.com', {
            ...allOptions(true),
            [attribute]: true,
          });
        });
      });
    });
  });
});

function cosmetic(filter: string, expected: any) {
  const parsed = CosmeticFilter.parse(filter);
  if (parsed !== null) {
    expect(parsed.isNetworkFilter()).toBeFalsy();
    expect(parsed.isCosmeticFilter()).toBeTruthy();
    const verbose = {
      // Attributes
      hostnames: parsed.getHostnames(),
      selector: parsed.getSelector(),
      style: parsed.getStyle(),

      // Options
      isScriptBlock: parsed.isScriptBlock(),
      isScriptInject: parsed.isScriptInject(),
      isUnhide: parsed.isUnhide(),
    };
    expect(verbose).toMatchObject(expected);
  } else {
    expect(parsed).toEqual(expected);
  }
}

const DEFAULT_COSMETIC_FILTER = {
  // Attributes
  hostnames: [],
  selector: '',
  style: DEFAULT_HIDDING_STYLE,

  // Options
  isScriptBlock: false,
  isScriptInject: false,
  isUnhide: false,
};

describe('Cosmetic filters', () => {
  describe('toString', () => {
    const checkToString = (line: string, expected: string, debug: boolean = false) => {
      const parsed = CosmeticFilter.parse(line);
      expect(parsed).not.toBeNull();
      if (parsed !== null) {
        if (debug) {
          parsed.rawLine = line;
        }
        expect(parsed.toString()).toBe(expected);
      }
    };

    [
      '##.selector',
      'foo.com##.selector',
      'foo.com,*.baz##.selector',
      'foo.com#@#.selector',
      '##+js(foo.js)',
      '##script:contains(ads)',
    ].forEach((line) => {
      it(`pprint ${line}`, () => {
        checkToString(line, line);
      });
    });

    it('pprint with debug=true', () => {
      checkToString('foo.com##.selector', 'foo.com##.selector', true);
    });
  });

  describe('parses selector', () => {
    cosmetic('##iframe[src]', {
      ...DEFAULT_COSMETIC_FILTER,
      selector: 'iframe[src]',
    });
  });

  it('parses hostnames', () => {
    cosmetic('foo.com##.selector', {
      ...DEFAULT_COSMETIC_FILTER,
      hostnames: ['foo.com'],
      selector: '.selector',
    });
    cosmetic('foo.com,bar.io##.selector', {
      ...DEFAULT_COSMETIC_FILTER,
      hostnames: ['foo.com', 'bar.io'],
      selector: '.selector',
    });
    cosmetic('foo.com,bar.io,baz.*##.selector', {
      ...DEFAULT_COSMETIC_FILTER,
      hostnames: ['foo.com', 'bar.io', 'baz.*'],
      selector: '.selector',
    });
  });

  it('parses unhide', () => {
    cosmetic('#@#script:contains(foo)', null); // We need hostnames
    cosmetic('foo.com#@#script:contains(foo)', {
      ...DEFAULT_COSMETIC_FILTER,
      hostnames: ['foo.com'],
      isScriptBlock: true,
      isUnhide: true,
      selector: 'foo',
    });
    cosmetic('foo.com#@#.selector', {
      ...DEFAULT_COSMETIC_FILTER,
      hostnames: ['foo.com'],
      isUnhide: true,
      selector: '.selector',
    });
  });

  it('parses script block', () => {
    cosmetic('##script:contains(foo)', {
      ...DEFAULT_COSMETIC_FILTER,
      isScriptBlock: true,
      selector: 'foo',
    });
    cosmetic('##script:contains(/foo/)', {
      ...DEFAULT_COSMETIC_FILTER,
      isScriptBlock: true,
      selector: 'foo',
    });
  });

  it('parses script inject', () => {
    cosmetic('##script:inject(script.js, argument)', {
      ...DEFAULT_COSMETIC_FILTER,
      isScriptInject: true,
      selector: 'script.js, argument',
    });
    cosmetic('##script:inject(script.js, arg1, arg2, arg3)', {
      ...DEFAULT_COSMETIC_FILTER,
      isScriptInject: true,
      selector: 'script.js, arg1, arg2, arg3',
    });
    cosmetic('##+js(script.js, arg1, arg2, arg3)', {
      ...DEFAULT_COSMETIC_FILTER,
      isScriptInject: true,
      selector: 'script.js, arg1, arg2, arg3',
    });
  });

  it('parses :style', () => {
    cosmetic('###foo :style(display: none)', {
      ...DEFAULT_COSMETIC_FILTER,
      selector: '#foo ',
      style: 'display: none',
    });

    cosmetic('###foo > bar >baz:style(display: none)', {
      ...DEFAULT_COSMETIC_FILTER,
      selector: '#foo > bar >baz',
      style: 'display: none',
    });

    cosmetic('foo.com,bar.de###foo > bar >baz:style(display: none)', {
      ...DEFAULT_COSMETIC_FILTER,
      hostnames: ['foo.com', 'bar.de'],
      selector: '#foo > bar >baz',
      style: 'display: none',
    });

    cosmetic('foo.com,bar.de###foo > bar >baz:styleTYPO(display: none)', null);
  });

  // TODO
  // it('rejects invalid selectors', () => {
  //   // @ts-ignore
  //   global.document = {
  //     createElement: () => ({ matches: () => false }),
  //   };
  //   cosmetic('###.selector /invalid/', null);

  //   // @ts-ignore
  //   global.document = {
  //     createElement: () => ({
  //       matches: () => {
  //         throw new Error('Invalid');
  //       },
  //     }),
  //   };
  //   cosmetic('###.selector /invalid/', null);

  //   // @ts-ignore
  //   global.document = undefined;
  // });

  it('sorts hostnames by decreasing size', () => {
    cosmetic('ccc.com,a.com,bb.com,ccc.com##.selector', {
      ...DEFAULT_COSMETIC_FILTER,
      hostnames: ['ccc.com', 'ccc.com', 'bb.com', 'a.com'],
      selector: '.selector',
    });
  });

  it('#getScript', () => {
    const parsed = CosmeticFilter.parse('##+js(script.js, arg1, arg2, arg3)');
    expect(parsed).not.toBeNull();
    if (parsed !== null) {
      expect(parsed.getScript(new Map([['script.js', '{{1}},{{2}},{{3}}']]))).toEqual(
        'arg1,arg2,arg3',
      );

      expect(parsed.getScript(new Map())).toBeUndefined();
    }
  });
});

describe('Filters list', () => {
  it('ignores comments', () => {
    [
      '# ||foo.com',
      '# ',
      '#',
      '!',
      '!!',
      '! ',
      '! ||foo.com',
      '[Adblock] ||foo.com',
      '[Adblock Plus 2.0] ||foo.com',
    ].forEach((data) => {
      expect(List.parse(data)).toEqual(List.parse(''));
    });
  });
});
