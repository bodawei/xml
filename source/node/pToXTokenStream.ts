/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';
import { ParseToken } from 'pToken';
import { convertPTokenToXToken } from 'xToken';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PTokenStreamOptions {}

class PToXTokenStream extends Transform {
   private options: PTokenStreamOptions;

   constructor(options: PTokenStreamOptions = {}) {
      super({ objectMode: true });

      this.options = options;
   }

   _transform(token: ParseToken, encoding: string, done: () => void): void {
      const result = convertPTokenToXToken(token, this.options);
      
      this.push(result);

      done();
   }
}

export { PToXTokenStream };
