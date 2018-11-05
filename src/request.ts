import { getDomain, getHostname } from 'tldts';
import { createFuzzySignature, fastHash, tokenize } from './utils';

// TODO - add unit tests (for initialization with existing domain, hostname, etc.)

export const enum RequestType {
  beacon,
  csp,
  document,
  dtd,
  fetch,
  font,
  image,
  media,
  object,
  objectSubrequest,
  other,
  ping,
  script,
  stylesheet,
  subdocument,
  websocket,
  xlst,
  xmlhttprequest,
}

interface Types {
  [s: string]: RequestType;
}

const CPT_TO_TYPE: Types = {
  // Webextension request types
  csp_report: RequestType.csp,
  font: RequestType.font,
  image: RequestType.image,
  main_frame: RequestType.document,
  media: RequestType.media,
  object: RequestType.object,
  other: RequestType.other,
  ping: RequestType.ping,
  script: RequestType.script,
  stylesheet: RequestType.stylesheet,
  sub_frame: RequestType.subdocument,
  websocket: RequestType.websocket,
  xmlhttprequest: RequestType.xmlhttprequest,

  // Firefox Bootstrap: https://developer.mozilla.org/en-US/docs/Archive/Mozilla/nsIContentPolicy
  1: RequestType.other,
  2: RequestType.script,
  3: RequestType.image,
  4: RequestType.stylesheet,
  5: RequestType.object,
  6: RequestType.document,
  7: RequestType.subdocument,
  10: RequestType.ping,
  11: RequestType.xmlhttprequest,
  12: RequestType.objectSubrequest,
  13: RequestType.dtd,
  14: RequestType.font,
  15: RequestType.media,
  16: RequestType.websocket,
  17: RequestType.csp,
  18: RequestType.xlst,
  19: RequestType.beacon,
  20: RequestType.fetch,
  21: RequestType.image,
};

export interface IRequestInitialization {
  url: string;
  hostname: string;
  domain: string;

  sourceUrl: string;
  sourceHostname: string;
  sourceDomain: string;

  type: string | number;
}

export default class Request {
  public type: RequestType;
  public isHttp: boolean;
  public isHttps: boolean;
  public isSupported: boolean;
  public isFirstParty: boolean;

  public url: string;
  public hostname: string;
  public domain: string;

  public sourceUrl: string;
  public sourceHostname: string;
  public sourceHostnameHash: number;
  public sourceDomain: string;
  public sourceDomainHash: number;

  // Lazy attributes
  private tokens?: number[];
  private fuzzySignature?: Uint32Array;

  constructor({
    type = 'document',
    url = '',
    hostname,
    domain,

    sourceUrl = '',
    sourceHostname,
    sourceDomain,
  }: Partial<IRequestInitialization> = {}) {
    this.type = CPT_TO_TYPE[type];

    this.url = url.toLowerCase();

    // Optionally extract hostname and domain of url
    this.hostname = hostname || getHostname(this.url) || '';
    this.domain = domain || getDomain(this.hostname) || '';

    this.sourceUrl = sourceUrl.toLowerCase();

    // Optionally extract hostname and domain of sourceUrl
    this.sourceHostname = sourceHostname || getHostname(this.sourceUrl) || '';
    this.sourceDomain = sourceDomain || getDomain(this.sourceHostname) || '';

    this.sourceHostnameHash = fastHash(this.sourceHostname);
    this.sourceDomainHash = fastHash(this.sourceDomain);

    this.isFirstParty = this.sourceDomain === this.domain;

    // Get protocol
    const endOfProtocol = this.url.indexOf(':');

    // If there is no protocol, we assume https
    if (endOfProtocol === -1) {
      this.isHttps = true;
      this.isHttp = false;
      this.isSupported = true;
    } else {
      const protocol = this.url.slice(0, endOfProtocol);
      this.isHttp = protocol === 'http';
      this.isHttps = this.isHttp === false && protocol === 'https';

      const isWebsocket =
        this.isHttp === false &&
        this.isHttps === false &&
        (protocol === 'ws' || protocol === 'wss');

      this.isSupported = this.isHttp || this.isHttps || isWebsocket;

      if (isWebsocket) {
        this.type = RequestType.websocket;
      }
    }
  }

  public getTokens(): number[] {
    if (this.tokens === undefined) {
      this.tokens = [];
      if (this.sourceDomain) {
        this.tokens.push(fastHash(this.sourceDomain));
      }
      if (this.sourceHostname) {
        this.tokens.push(fastHash(this.sourceHostname));
      }
      this.tokens.push(...tokenize(this.url));
    }
    return this.tokens;
  }

  public getFuzzySignature(): Uint32Array {
    if (this.fuzzySignature === undefined) {
      this.fuzzySignature = createFuzzySignature(this.url);
    }
    return this.fuzzySignature;
  }
}
