/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

/**********************************************************************\
  Miscellaneous utilities for use in testing things in this namespace
\**********************************************************************/

function MockErrorCollector() {
   return {
      setPos: jasmine.createSpy('setPosSpy'),
      getErrors: jasmine.createSpy('getErrorsSpy'),
      check: function mockCheck(condition, id, params) {
         if (condition) {
            if (params) {
               this.report(id, params);
            } else {
               this.report(id);
            }
         }
      },
      checkName: jasmine.createSpy('checkNameSpy'),
      report: jasmine.createSpy('reportSpy'),
   };
}

module.exports = {
   MockErrorCollector,
};
