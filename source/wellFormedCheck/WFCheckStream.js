/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { ErrorCollector } from '../basic';
import { WellFormedError } from '../error';

import { xmlDeclaration, docTypeStart, docTypeEnd } from '../token';

const STATE = {
   START: 'START',
   PROLOG_PREDOCTYPE: 'PROLOG_PREDOCTYPE',
   PROLOG: 'PROLOG',
   IN_CONTENT: 'IN_CONTENT',
   IN_DTD: 'IN_DTD',
   AFTER_CONTENT: 'AFTER_CONTENT',
};

// This right now only validates the base document.
class WFChecker extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
      this._state = STATE.START;
   }

   _transform(parsed, ignored, callback) {
      const errorCollector = new ErrorCollector(parsed.openLToken, WellFormedError);

      switch (parsed.type) {
         case 'XML_DECLARATION':
            if (this._state !== STATE.START) {
               errorCollector.report(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
            } else {
               this._state = STATE.PROLOG_PREDOCTYPE;
            }
            xmlDeclaration.checkWellFormed(parsed, errorCollector, true, 1.0);
            errorCollector.getErrors().forEach(error => this.push(error));
            break;
         case 'DOCTYPE_START':
            switch (this._state) {
               case STATE.PROLOG_PREDOCTYPE:
                  this._state = STATE.PROLOG_PREDOCTYPE;
                  if (parsed.hasInternalSubset) {
                     this._state = STATE.IN_DTD;
                  }
                  break;
               default:
                  this._state = STATE.PROLOG_PREDOCTYPE;
                  errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            }
            this._startDocType = parsed;
            docTypeStart.checkWellFormed(parsed, errorCollector, true, 1.0, 5);
            errorCollector.getErrors().forEach(error => this.push(error));
            break;
         case 'DOCTYPE_END':
            if (this._state !== STATE.PROLOG_PREDOCTYPE && this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            } else {
               this._state = STATE.PROLOG;
            }

            if (this._startDocType) {
               const specialErrorCollector = new ErrorCollector(this._startDocType.openLToken, WellFormedError);
               docTypeEnd.checkWellFormed(parsed, this._startDocType, specialErrorCollector, true, 1.0, 5);
               delete this._startDocType;
               specialErrorCollector.getErrors().forEach(error => this.push(error));
            } else {
               // already caught by the state check, above.
            }

            errorCollector.getErrors().forEach(error => this.push(error));
            break;
      }

      this.push(parsed);
      callback();
   }

}

export default WFChecker;
