/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { ErrorCollector } from 'error';
import { getFirstSToken, PToken } from 'token';
import { ValidityError, ValidityChecker } from 'valid';

/*
 * Blah blah blah
 */
class CheckValidityStream extends Transform {
   private checker = new ValidityChecker();

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(pToken: PToken, encoding: string, done: () => void) {
      const errorCollector = new ErrorCollector(getFirstSToken(pToken), ValidityError);
      this.checker.checkPToken(pToken, errorCollector);

      const errors = errorCollector.getErrors();

      for (const error of errors) {
         this.push(error);
      }

      this.push(pToken);
      done();
   }

   _final(done: () => void) {
      done();
   }
}

export default CheckValidityStream;

