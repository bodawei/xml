/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { ErrorCollector } from '../basic';
import { WellFormedError } from '../error';

import { xmlDeclaration, docTypeStart, docTypeEnd } from '../token';

class WFChecker extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(parsed, ignored, callback) {
      const errorCollector = new ErrorCollector(parsed.openChunk, WellFormedError);

      switch (parsed.type) {
         case 'xmldecl':
            xmlDeclaration.checkWellFormed(parsed, errorCollector, true, 1.0);
            errorCollector.getErrors().forEach(error => this.push(error));
            break;
         case 'DOCTYPE_START':
            this._startDocType = parsed;
            docTypeStart.checkWellFormed(parsed, errorCollector, true, 1.0, 5);
            errorCollector.getErrors().forEach(error => this.push(error));
            break;
         case 'DOCTYPE_END':
            // if  ! this._startDocType then we have an error of another kind.
            const specialErrorCollector = new ErrorCollector(this._startDocType.openChunk, WellFormedError);
            docTypeEnd.checkWellFormed(parsed, this._startDocType, specialErrorCollector, true, 1.0, 5);
            delete this._startDocType;
            specialErrorCollector.getErrors().forEach(error => this.push(error));
            break;
      }

      this.push(parsed);
      callback();
   }

}

module.exports = WFChecker;
