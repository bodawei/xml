/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';

import {
   declaration,
   envelope,
   instruction,

   cdata,
   charData,
   comment,
   docTypeEnd,
   docTypeStart,
   elementStart,
   elementEnd,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
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
      const startContext = parsed.open || parsed.text ||
         (this._startDocType ? this._startDocType.open : parsed.closeInternalSubset);
      let errorCollector = new ErrorCollector(startContext, WellFormedError);

      switch (parsed.type) {
         case declaration.TYPE:
            declaration.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case envelope.TYPE:
            envelope.checkWellFormed(parsed, true, errorCollector, this._metaData);
            break;
         case instruction.TYPE:
            instruction.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case EntityMetaData.TYPE:
            this._metaData = parsed;
            break;
         case cdata.TYPE:
            if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CDATA_INVALID_DOC_CONTEXT);
            }

            cdata.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case charData.TYPE:
            if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CHARDATA_INVALID_DOC_CONTEXT);
            }

            charData.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case comment.TYPE:
            if (this._state === STATE.START) {
               errorCollector.report(WellFormedError.ID.COMMENT_INVALID_CONTEXT);
            }
            comment.checkWellFormed(parsed, errorCollector, this._metaData);
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
         case elementStart.TYPE:
         case elementStart.EMPTY_TYPE:
            const nameText = parsed.name ? parsed.name.text : '';
            if (parsed.type === elementStart.TYPE) {
               this._elementNameStack.push(nameText);
            }

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
         case entityReference.PARAM_TYPE:
            if (this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.PEREF_INVALID_CONTEXT);
            }

            entityReference.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case notationDeclaration.TYPE:
            if (this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.NOTATIONDECL_INVALID_CONTEXT);
            }

            notationDeclaration.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case processingInstruction.TYPE:
            if (this._state === STATE.START) {
               errorCollector.report(WellFormedError.ID.PI_INVALID_CONTEXT);
            }
            processingInstruction.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
         case space.TYPE:
            if (this._state === STATE.START) {
               errorCollector.report(WellFormedError.ID.SPACE_INVALID_CONTEXT);
            }
            space.checkWellFormed(parsed, errorCollector, this._metaData);
            break;
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
