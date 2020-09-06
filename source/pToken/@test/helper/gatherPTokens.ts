/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ParseValue } from 'pToken';
import { Readable } from 'stream';

function gatherPTokens(stream: Readable, expect: (results: Array<ParseValue>) => void): void {
   const cache: Array<ParseValue> = [];

   stream.on('data', (item: ParseValue) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);
   });
}

export { gatherPTokens };
