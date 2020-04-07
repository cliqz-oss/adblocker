/*!
 * Copyright (c) 2017-present Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { expect } from 'chai';
import 'mocha';

import Request from '../src/request';

describe('#Request', () => {
  describe('#fromRawDetails', () => {
    it('sets default type', () => {
      expect(Request.fromRawDetails({})).to.deep.include({ type: 'main_frame' });
    });

    it('gets type from arguments', () => {
      expect(Request.fromRawDetails({ type: 'script' })).to.deep.include({ type: 'script' });
    });

    it('sets default url to empty', () => {
      expect(Request.fromRawDetails({})).to.deep.include({
        domain: '',
        hostname: '',
        url: '',
      });
    });

    it('converts url to lower case', () => {
      expect(Request.fromRawDetails({ url: 'https://sub.FOO.cOm/bar' })).to.deep.include({
        domain: 'foo.com',
        hostname: 'sub.foo.com',
        url: 'https://sub.foo.com/bar',
      });
    });

    it('parses url', () => {
      expect(Request.fromRawDetails({ url: 'https://sub.foo.com/bar' })).to.deep.include({
        domain: 'foo.com',
        hostname: 'sub.foo.com',
        url: 'https://sub.foo.com/bar',
      });
    });

    it('does not parse url if hostname and domain provided', () => {
      expect(
        Request.fromRawDetails({
          domain: 'PROVIDED DOMAIN',
          hostname: 'PROVIDED HOSTNAME',
          url: 'https://sub.foo.com/bar',
        }),
      ).to.deep.include({
        domain: 'PROVIDED DOMAIN',
        hostname: 'PROVIDED HOSTNAME',
        url: 'https://sub.foo.com/bar',
      });
    });

    it('parses url if only hostname is provided', () => {
      expect(
        Request.fromRawDetails({
          hostname: 'PROVIDED HOSTNAME',
          url: 'https://sub.foo.com/bar',
        }),
      ).to.deep.include({
        domain: 'foo.com',
        hostname: 'PROVIDED HOSTNAME',
        url: 'https://sub.foo.com/bar',
      });
    });

    it('parses url if only domain is provided', () => {
      expect(
        Request.fromRawDetails({
          domain: 'PROVIDED DOMAIN',
          url: 'https://sub.foo.com/bar',
        }),
      ).to.deep.include({
        domain: 'PROVIDED DOMAIN',
        hostname: 'sub.foo.com',
        url: 'https://sub.foo.com/bar',
      });
    });

    it('sets default sourceUrl to empty', () => {
      expect(Request.fromRawDetails({})).to.deep.include({
        sourceDomain: '',
        sourceHostname: '',
      });
    });

    it('converts sourceUrl to lower case', () => {
      expect(Request.fromRawDetails({ sourceUrl: 'https://sub.FOO.cOm/bar' })).to.deep.include({
        sourceDomain: 'foo.com',
        sourceHostname: 'sub.foo.com',
      });
    });

    it('parses sourceUrl', () => {
      expect(Request.fromRawDetails({ sourceUrl: 'https://sub.foo.com/bar' })).to.deep.include({
        sourceDomain: 'foo.com',
        sourceHostname: 'sub.foo.com',
      });
    });

    it('does not parse sourceUrl if hostname and domain provided', () => {
      expect(
        Request.fromRawDetails({
          sourceDomain: 'PROVIDED DOMAIN',
          sourceHostname: 'PROVIDED HOSTNAME',
          sourceUrl: 'https://sub.foo.com/bar',
        }),
      ).to.deep.include({
        sourceDomain: 'PROVIDED DOMAIN',
        sourceHostname: 'PROVIDED HOSTNAME',
      });
    });

    it('parses sourceUrl if only hostname is provided', () => {
      expect(
        Request.fromRawDetails({
          sourceHostname: 'PROVIDED HOSTNAME',
          sourceUrl: 'https://sub.foo.com/bar',
        }),
      ).to.deep.include({
        sourceDomain: 'foo.com',
        sourceHostname: 'PROVIDED HOSTNAME',
      });
    });

    it('parses sourceUrl if only domain is provided', () => {
      expect(
        Request.fromRawDetails({
          sourceDomain: 'PROVIDED DOMAIN',
          sourceUrl: 'https://sub.foo.com/bar',
        }),
      ).to.deep.include({
        sourceDomain: 'PROVIDED DOMAIN',
        sourceHostname: 'sub.foo.com',
      });
    });

    it('overrides type for websocket requests', () => {
      expect(Request.fromRawDetails({ url: 'ws://foo.com' }).type).to.equal('websocket');
      expect(Request.fromRawDetails({ url: 'wss://foo.com' }).type).to.equal('websocket');
    });

    it('supports http protocol', () => {
      const expected = {
        isHttp: true,
        isHttps: false,
        isSupported: true,
      };

      expect(Request.fromRawDetails({ url: 'http:///foo.com' })).to.deep.include(expected);
      expect(Request.fromRawDetails({ url: 'http://foo.com' })).to.deep.include(expected);
      expect(Request.fromRawDetails({ url: 'http:/foo.com' })).to.deep.include(expected);
    });

    it('supports https protocol', () => {
      const expected = {
        isHttp: false,
        isHttps: true,
        isSupported: true,
      };

      expect(Request.fromRawDetails({ url: 'https:///foo.com' })).to.deep.include(expected);
      expect(Request.fromRawDetails({ url: 'https://foo.com' })).to.deep.include(expected);
      expect(Request.fromRawDetails({ url: 'https:/foo.com' })).to.deep.include(expected);
    });

    it('supports ws protocol', () => {
      const expected = {
        isHttp: false,
        isHttps: false,
        isSupported: true,
      };

      expect(Request.fromRawDetails({ url: 'ws:///foo.com' })).to.deep.include(expected);
      expect(Request.fromRawDetails({ url: 'ws://foo.com' })).to.deep.include(expected);
      expect(Request.fromRawDetails({ url: 'ws:/foo.com' })).to.deep.include(expected);
    });

    it('supports wss protocol', () => {
      const expected = {
        isHttp: false,
        isHttps: false,
        isSupported: true,
      };

      expect(Request.fromRawDetails({ url: 'wss:///foo.com' })).to.deep.include(expected);
      expect(Request.fromRawDetails({ url: 'wss://foo.com' })).to.deep.include(expected);
      expect(Request.fromRawDetails({ url: 'wss:/foo.com' })).to.deep.include(expected);
    });

    it('handles data urls', () => {
      for (const url of [
        'data:,Hello%2C%20World!',
        'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D',
        'data:text/html,%3Ch1%3EHello%2C%20World!%3C%2Fh1%3E',
        'data:text/html,<script>alert("hi");</script>',
      ]) {
        const cleanUrl = url.slice(0, url.indexOf(','));
        expect(Request.fromRawDetails({ url })).to.deep.include({
          isHttp: false,
          isHttps: false,
          isSupported: true,
          url: cleanUrl,
        });
      }
    });

    it('detects unsupported protocols', () => {
      const expected = {
        isHttp: false,
        isHttps: false,
        isSupported: false,
      };

      for (const protocol of [
        'foobar',
        'ip',
        'ftp',
        'git',
        'ssh',
        'smtp',
        'pop3',
        'imap',
      ]) {
        expect(Request.fromRawDetails({ url: `${protocol}:///foo.com` })).to.deep.include(expected);
        expect(Request.fromRawDetails({ url: `${protocol}://foo.com` })).to.deep.include(expected);
        expect(Request.fromRawDetails({ url: `${protocol}:/foo.com` })).to.deep.include(expected);
      }
    });

    describe('finds partyness', () => {
      it('correctly uses domains when available', () => {
        expect(
          Request.fromRawDetails({ url: 'https://foo.com', sourceUrl: 'https://foo.com' }),
        ).to.deep.include({
          isFirstParty: true,
          isThirdParty: false,
        });

        expect(
          Request.fromRawDetails({
            sourceUrl: 'https://sub1.sub2.foo.com',
            url: 'https://foo.com',
          }),
        ).to.deep.include({
          isFirstParty: true,
          isThirdParty: false,
        });

        expect(
          Request.fromRawDetails({
            sourceUrl: 'https://sub1.sub2.bar.com',
            url: 'https://foo.com',
          }),
        ).to.deep.include({
          isFirstParty: false,
          isThirdParty: true,
        });
      });

      it('falls-back to first-party if no sourceUrl', () => {
        expect(
          Request.fromRawDetails({
            url: 'https://foo.com',
          }),
        ).to.deep.include({
          isFirstParty: true,
          isThirdParty: false,
        });
      });

      it('falls-back to first-party if sourceUrl is invalid', () => {
        expect(
          Request.fromRawDetails({
            sourceUrl: 'null',
            url: 'https://foo.com',
          }),
        ).to.deep.include({
          isFirstParty: true,
          isThirdParty: false,
        });
      });

      it('falls-back to first-party if no url', () => {
        expect(
          Request.fromRawDetails({
            sourceUrl: 'null',
          }),
        ).to.deep.include({
          isFirstParty: true,
          isThirdParty: false,
        });
      });

      it('falls-back to first-party if url is invalid', () => {
        expect(
          Request.fromRawDetails({
            sourceUrl: 'null',
            url: 'null',
          }),
        ).to.deep.include({
          isFirstParty: true,
          isThirdParty: false,
        });
      });
    });
  });
});
