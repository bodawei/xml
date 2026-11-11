/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { Readable } from 'stream';
import { PTokenOptions, ParseType, PTokenParser } from 'pToken';
import { STokenSource } from 'basic';

class PTokenStream extends Readable {
   private parser: PTokenParser;

   constructor(
      sTokenSource: STokenSource,
      options: PTokenOptions = { parseType: ParseType.DOCUMENT },
   ) {
      super({ objectMode: true });

      this.parser = new PTokenParser(sTokenSource, options);
   }

   _read(): void {
      this.parser.parse((result) => {
         if (Array.isArray(result)) {
            result.forEach((item) => this.push(item));
         } else if (result) {
            this.push(result);
         } else {
            this.push(null);
         }
      });
   }
}

export { PTokenStream };
