/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { AttFixer } from 'attFixer';
import { PToken } from 'token';

class AttFixerStream extends Transform {
   private fixer: AttFixer;

   constructor() {
      super({
         objectMode: true,
      });

      this.fixer = new AttFixer();
   }

   _transform(token: PToken, encoding: string, done: () => void): void {
      const result = this.fixer.processPToken(token);

      this.push(result);
      done();
   }
}

export { AttFixerStream };
