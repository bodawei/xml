/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { convertPTokenToSTokens } from 'flat';
import { ParseToken } from 'pToken';

class FlattenPTokenStream extends Transform {
   constructor() {
      super({ objectMode: true });
   }

   _transform(token: ParseToken, encoding: string, done: () => void): void {
      const result = convertPTokenToSTokens(token);

      for (const element of result) {
         this.push(element);
      }

      done();
   }
}

export { FlattenPTokenStream };
