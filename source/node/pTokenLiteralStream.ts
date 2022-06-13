/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { Readable } from 'stream';

import { PTokenLiteralParser} from 'pToken';

import { STokenSource } from 'basic';

type Options = {
   peRef?: boolean;
   geRef?: boolean;
};

/*
 * This is used to parse EntityValue and AttributeValue literals. As such, it only
 * recognizes Text, CharRef, and (optionally) ParameterEntityReferences.
 */
class PTokenLiteralStream extends Readable {
   private parser: PTokenLiteralParser;

   constructor(sTokenSource: STokenSource, options: Options = {}) {
      super({
         objectMode: true,
      });

      this.parser = new PTokenLiteralParser(sTokenSource, options);
   }

   _read() {
      this.parser.parse(result => {
         this.push(result || null);
      });
   }
}

export  {PTokenLiteralStream };
