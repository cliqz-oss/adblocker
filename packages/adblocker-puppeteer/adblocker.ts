/*!
 * Copyright (c) 2017-2019 Cliqz GmbH. All rights reserved.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Type definition
import * as puppeteer from 'puppeteer';
import { parse } from 'tldts-experimental';

import {
  FiltersEngine,
  Request,
} from '@cliqz/adblocker';

import {
  autoRemoveScript,
  extractFeaturesFromDOM,
} from '@cliqz/adblocker-content';

/**
 * Create an instance of `Request` from `puppeteer.Request`.
 */
export function fromPuppeteerDetails(details: puppeteer.Request): Request {
  const frame = details.frame();
  return Request.fromRawDetails({
    sourceUrl: frame !== null ? frame.url() : undefined,
    type: details.resourceType(),
    url: details.url(),
  });
}

/**
 * Wrap `FiltersEngine` into a Puppeteer-friendly helper class.
 */
export class PuppeteerBlocker extends FiltersEngine {
  public enableBlockingInPage(page: puppeteer.Page): Promise<void> {
    // Make sure request interception is enabled for `page` before proceeding
    return page.setRequestInterception(true).then(() => {
      // NOTE - page.setBypassCSP(enabled) might be needed to perform injections on some pages
      // NOTE - we currently do not perform CSP headers injection as there is
      // currently no way to modify responses in puppeteer. This feature could
      // easily be added if puppeteer implements the required capability.

      if (this.config.loadNetworkFilters === true) {
        // Register callback for network requets filtering
        page.on('request', this.onRequest);
      }

      if (this.config.loadCosmeticFilters === true) {
        // Register callback to cosmetics injection (CSS + scriptlets)
        page.on('framenavigated', async (frame) => {
          try {
            await this.onFrame(frame);
          } catch (ex) {
            // Ignore
          }
        });
      }
    });
  }

  private onFrame = async (frame: puppeteer.Frame): Promise<void> => {
    // DOM features
    const { ids, hrefs, classes } = await frame.$$eval(
      '[id],[class],[href]',
      extractFeaturesFromDOM,
    );

    // Source features
    const url = frame.url();
    const parsed = parse(url);
    const hostname = parsed.hostname || '';
    const domain = parsed.domain || '';

    // Get cosmetics to inject into the Frame
    const { active, scripts, styles } = this.getCosmeticsFilters({
      domain,
      hostname,
      url,

      // DOM information
      classes,
      hrefs,
      ids,
    });

    // Abort if cosmetics are disabled
    if (active === true) {
      // Inject scripts
      for (let i = 0; i < scripts.length; i += 1) {
        frame
          .addScriptTag({
            content: autoRemoveScript(scripts[i]),
          })
          .catch(() => {
            // Ignore
          });
      }

      // Inject CSS
      if (styles.length !== 0) {
        frame
          .addStyleTag({
            content: styles,
          })
          .catch(() => {
            // Ignore
          });
      }
    }
  }

  private onRequest = (details: puppeteer.Request): void => {
    const request = fromPuppeteerDetails(details)
    if (request.isMainFrame()) {
      details.continue();
      return;
    }

    const { redirect, match } = this.match(request);

    if (redirect !== undefined) {
      const { body, contentType } = redirect;
      details.respond({
        body,
        contentType,
      });
    } else if (match === true) {
      details.abort('blockedbyclient');
    } else {
      details.continue();
    }
  }
}

// Re-export symboles from @cliqz/adblocker for convenience
export * from '@cliqz/adblocker';
