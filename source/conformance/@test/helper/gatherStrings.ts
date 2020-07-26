/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

function gatherStrings(stream: Transform, expect: (results: Array<string>) => void): void {
   const cache: Array<string> = [];

   stream.on('data', (item: string) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);
   });
}

export { gatherStrings };
