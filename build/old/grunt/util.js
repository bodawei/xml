/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const BROWSER_VERSION_OS_VERSION_SEPARATION_REGEXP = /^(.*) \((.*)\)$/;
const BROWSER_NAME_AND_VERSION_REGEXP = /([A-Za-z]+) [v]?([0-9\.]+)/;
const OS_NAME_AND_VERSON_REGEXP = /([^0-9\.]+) [v]?([0-9\.]+)/;

/*
 * Given a string as reported by the various test tools (e.g.
 * Chrome 57.0.2987 (Mac OS X 10.12.4)) extract the parts.
 */
function extractBrowserAndOsNames(browerId) {
   const browserAndOs = BROWSER_VERSION_OS_VERSION_SEPARATION_REGEXP.exec(browerId);
   const browserMatch = BROWSER_NAME_AND_VERSION_REGEXP.exec(browserAndOs[1]);
   const osMatch = OS_NAME_AND_VERSON_REGEXP.exec(browserAndOs[2]);

   return {
      browserName: browserMatch[1],
      browserVersion: browserMatch[2],
      osName: osMatch[1],
      osVersion: osMatch[2],
   };
}

module.exports = {
   extractBrowserAndOsNames,
};
