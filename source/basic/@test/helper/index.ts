/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Readable } from 'stream';

import { MockErrorCollector, ErrorInfo } from './helper';
import { makeErrorMatcher } from './makeErrorMatcher';
import { makeJasmineErrorMatcher } from './makeJasmineErrorMatcher';

function gatherStreamResults<ElemenType>(
   stream: Readable,
   expect: (results: Array<ElemenType>) => void,
): void {
   const cache: Array<ElemenType> = [];

   stream.on('data', (item: ElemenType) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);
   });
}

export {
   gatherStreamResults,
   makeErrorMatcher,
   makeJasmineErrorMatcher,
   MockErrorCollector,
   ErrorInfo,
};
