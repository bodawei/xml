/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { ErrorCollector, EntityMetaData } from '../basic';
import { WellFormedError } from '../error';

import {
   charData,
   declaration,
   docTypeEnd,
   docTypeStart,
   elementStart,
   elementEnd,
   entityDeclaration,
   entityReference,
   xmlDeclaration,
} from '../xToken';

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
      this._metaData = new EntityMetaData();
      this._state = STATE.START;
      this._elementNameStack = [];
   }

   _transform(parsed, _, done) {
      this._checkForErrors(parsed);
      done();
   }

   _checkForErrors(parsed) {
      let errorCollector = new ErrorCollector(parsed.open || parsed.text, WellFormedError);

      switch (parsed.type) {
         case EntityMetaData.TYPE:
            this._metaData = parsed;
            break;
         case charData.TYPE:
            if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CHARDATA_INVALID_DOC_CONTEXT);
            }

            charData.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case xmlDeclaration.TYPE:
            if (this._state !== STATE.START) {
               errorCollector.report(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
            } else {
               this._state = STATE.PROLOG_PREDOCTYPE;
            }
            xmlDeclaration.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case docTypeStart.TYPE:
            switch (this._state) {
               case STATE.PROLOG_PREDOCTYPE:
                  this._state = STATE.PROLOG_PREDOCTYPE;
                  if (parsed.startInternalSubset) {
                     this._state = STATE.IN_DTD;
                  }
                  break;
               default:
                  this._state = STATE.PROLOG_PREDOCTYPE;
                  errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            }
            this._startDocType = parsed;
            docTypeStart.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case docTypeEnd.TYPE:
            if (this._state !== STATE.PROLOG_PREDOCTYPE && this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            } else {
               this._state = STATE.PROLOG;
            }

            if (this._startDocType) {
               const specialErrorCollector = new ErrorCollector(this._startDocType.open, WellFormedError);
               docTypeEnd.checkWellFormed(parsed, this._startDocType, specialErrorCollector, this._metaData);
               delete this._startDocType;
               specialErrorCollector.getErrors().forEach(error => this.push(error));
            } else {
               docTypeEnd.checkWellFormed(parsed, undefined, errorCollector, this._metaData);
            }
            break;
         case declaration.TYPE:
            declaration.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case elementStart.TYPE:
            const nameText = parsed.name ? parsed.name.text : '';
            this._elementNameStack.push(nameText);

            if (this._state === STATE.PROLOG_PREDOCTYPE || this._state === STATE.PROLOG) {
               this._state = STATE.IN_CONTENT;
            } else if (this._state === STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ]);
            } else if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT, [ nameText ]);
            }

            elementStart.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case elementEnd.TYPE:
            const endNameText = parsed.name ? parsed.name.text : '';
            const lastElement = this._elementNameStack[this._elementNameStack.length - 1];

            if (lastElement === endNameText) {
               this._elementNameStack.pop();
            } else {
               errorCollector.report(WellFormedError.ID.ELEMENT_UNBALANCED, [ lastElement || '', endNameText ]);
            }

            if (this._state === STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT, [ endNameText ]);
            } else if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT, [ endNameText ]);
            }

            elementEnd.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case entityDeclaration.TYPE:
            if (this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ENTITYDECL_INVALID_CONTEXT);
            }

            entityDeclaration.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case entityReference.TYPE:
            if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
            }

            entityReference.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         // notation decl needs to be in dtd
         default:
            errorCollector = undefined;
      }

      if (errorCollector) {
         errorCollector.getErrors().forEach(error => this.push(error));
      }
      this.push(parsed);
   }

}

export default WFChecker;
