/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { doAsyncLoop } from '../doAsyncLoop';

type Callback = (result: string) => void;

describe('doAsyncLoop() (unit)', () => {
   beforeEach(() => {});

   it('calls the processor with all the results', (done) => {
      function processor(x: string, cb: Callback): void {
         setTimeout(() => cb(`${x}2`), 0);
      }

      doAsyncLoop(['a', 'b', 'c'], processor, (results) => {
         expect(results).toEqual(['a2', 'b2', 'c2']);
         done();
      });
   });

   it('calls the processor with a single result when given a single input', (done) => {
      function processor(x: string, cb: Callback): void {
         setTimeout(() => cb(`${x}2`), 0);
      }

      doAsyncLoop(['a'], processor, (results) => {
         expect(results).toEqual(['a2']);
         done();
      });
   });

   it('does not call the processor if input is empty', (done) => {
      const spy = jasmine.createSpy('processorSpy');

      doAsyncLoop([], spy, () => {});

      expect(spy).not.toHaveBeenCalled();
      done();
   });

   it('calls back synchronously when input array empty', (done) => {
      function processor(x: string, cb: Callback): void {
         setTimeout(() => cb('foo'), 1000);
      }
      let result: Array<string> = ['bogus'];

      doAsyncLoop<string, string>([], processor, (innerResult) => {
         result = innerResult;
      });

      expect(result).toEqual([]);
      done();
   });

   it('calls back synchronously when the processor is synchronous', (done) => {
      function processor(x: string, cb: Callback): void {
         cb(`${x}z`);
      }
      let result: Array<string> = ['bogus'];

      doAsyncLoop<string, string>(['1', '2', '3'], processor, (innerResult) => {
         result = innerResult;
      });

      expect(result).toEqual(['1z', '2z', '3z']);
      done();
   });
});
