/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { doAsyncWhileLoop } from '../doAsyncWhileLoop';

describe('doAsyncWhileLoop() (unit)', () => {
   it('calls the processor until it returns undefined', (done) => {
      let index = 0;
      function processor(cb: (value: number | undefined) => void): void {
         index++;

         if (index > 3) {
            cb(undefined);
            return;
         }
         setTimeout(() => cb(index * 2));
      }

      doAsyncWhileLoop<number>(processor, (results) => {
         expect(results).toEqual([2, 4, 6]);
         done();
      });
   });

   it('returns an empty array if the first call to the processor returns undefined', (done) => {
      function processor(cb: (value: number | undefined) => void): void {
         cb(undefined);
      }

      doAsyncWhileLoop<number>(processor, (results) => {
         expect(results).toEqual([]);
         done();
      });
   });

   it('delivers expected values, even when those values are generated out of order', (done) => {
      let index = 0;
      function processor(cb: (value: number | undefined) => void): void {
         index++;

         if (index > 3) {
            cb(undefined);
            return;
         }

         if (index === 1) {
            setTimeout(() => cb(index * 2), 2);
         } else {
            setTimeout(() => cb(index * 2), 0);
         }
      }

      doAsyncWhileLoop<number>(processor, (results) => {
         expect(results).toEqual([2, 4, 6]);
         done();
      });
   });

   it('calls back synchronously when the processor is synchronous', () => {
      let index = 0;
      let syncResult: Array<number> = [];

      function processor(cb: (value: number | undefined) => void): void {
         index++;

         if (index > 3) {
            cb(undefined);
            return;
         }
         cb(index * 2);
      }

      doAsyncWhileLoop<number>(processor, (results) => {
         syncResult = results;
      });

      expect(syncResult).toEqual([2, 4, 6]);
   });
});
