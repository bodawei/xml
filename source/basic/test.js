/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

/**********************************************************************\
  Miscellaneous utilities for use in testing things in this namespace
\**********************************************************************/

class MockErrorCollector {
   constructor() {
      this.errors = [];
      this.setPos = this.setPos.bind(this);
      this.report = this.report.bind(this);
      this.checkName = this.checkName.bind(this);

      this.setPos = jasmine.createSpy('setPosSpy').and.callFake(this.setPos);
      this.getErrors = jasmine.createSpy('getErrorsSpy');
      this.checkName = jasmine.createSpy('checkNameSpy').and.callFake(this.checkName);
      this.report = jasmine.createSpy('reportSpy').and.callFake(this.report);
   }

   setPos(chunk) {
      if (chunk) {
         this._lastNotNull = chunk;
      }

      this._lastPos = chunk;
   }

   report(id, params) {
      const info = {
         position: this._lastPos,
         id,
         params,
      };
      if (!this._lastPos) {
         info.lastPosition = this._lastNotNull;
      }

      this.errors.push(info);
   }

   checkName(name, id, version, revision) {
      this.errors.push({
         lastPosition: this._lastNotNull,
         position: this._lastPos,
         name,
         id,
         version,
         revision,
      });
   }

   check(condition, id, params) {
      if (condition) {
         if (params) {
            this.report(id, params);
         } else {
            this.report(id);
         }
      }
   }
}

function toReportError(util) {
   return {
      compare: (mockErrorCollector, expectedError) => {
         if (!mockErrorCollector) {
            throw new Error('Did not get a mock error collector as expected');
         }

         const errors = mockErrorCollector.errors;
         let pass = false;
         let message = `No error with the id ${expectedError.id} reported.`;

         for (let index = 0; index < errors.length; index++) {
            const errEntry = errors[index];

            if (expectedError.id === errEntry.id) {
               if (!util.equals(expectedError.params, errEntry.params)) {
                  message = `Parameters for ${expectedError.id} do not match:\n` +
                     `  Actual: ${errEntry.params}\n  Expected: ${expectedError.params}`;
               } else if (!util.equals(expectedError.position, errEntry.position)) {
                  message = `Positions for ${expectedError.id} do not match:\n` +
                     `  Actual: ${JSON.stringify(errEntry.position)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.position)}`;
               } else if (expectedError.lastPosition &&
                  !util.equals(expectedError.lastPosition, errEntry.lastPosition)) {
                  message = `Last positions for ${expectedError.id} do not match:\n` +
                     `  Actual: ${JSON.stringify(errEntry.lastPosition)}\n` +
                     `  Expected: ${JSON.stringify(expectedError.lastPosition)}`;
               } else {
                  pass = true;
                  message = `Error matching ${expectedError.id} was found, but should not have been.`;
               }
            }
         }

         return {
            pass,
            message,
         };
      },
   };
}

beforeEach(() => {
   jasmine.addMatchers({
      toReportError,
   });

});

module.exports = {
   MockErrorCollector,
   toReportError,
};
