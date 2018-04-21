/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';

import {
   declaration,
   envelope,
   instruction,

   attListDeclaration,
   cdata,
   charData,
   comment,
   docTypeEnd,
   docTypeStart,
   elementStart,
   elementEnd,
   elementDeclaration,
   entityDeclaration,
   entityReference,
   notationDeclaration,
   processingInstruction,
   space,
   xmlDeclaration,
} from '../token';

const STATE = {
   START: 'START',
   PROLOG_PREDOCTYPE: 'PROLOG_PREDOCTYPE',
   PROLOG: 'PROLOG',
   IN_CONTENT: 'IN_CONTENT',
   IN_DTD: 'IN_DTD',
   AFTER_CONTENT: 'AFTER_CONTENT',
};

// This right now only validates the base document.
class CheckPTokenWellFormedStream extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
      this._metaData = new EntityMetaData();
      this._state = STATE.START;
      this._elementNameStack = [];
   }

   _transform(pToken, _, done) {
      this._checkForErrors(pToken);
      done();
   }

   _checkForErrors(pToken) {
      const startContext = pToken.open || pToken.text ||
         (this._startDocType ? this._startDocType.open : pToken.closeInternalSubset);
      let errorCollector = new ErrorCollector(startContext, WellFormedError);

      switch (pToken.type) {
         case declaration.PTYPE:
            declaration.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case envelope.PTYPE:
            envelope.checkWellFormed(pToken, true, errorCollector, this._metaData);
            break;
         case instruction.PTYPE:
            instruction.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case EntityMetaData.PTYPE:
            this._metaData = pToken;
            break;

         case attListDeclaration.PTYPE:
            if (this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ATTLISTDECL_INVALID_CONTEXT);
            }

            attListDeclaration.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case cdata.PTYPE:
            if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CDATA_INVALID_DOC_CONTEXT);
            }

            cdata.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case charData.PTYPE:
            if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CHARDATA_INVALID_DOC_CONTEXT);
            }

            charData.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case comment.PTYPE:
            if (this._state === STATE.START) {
               errorCollector.report(WellFormedError.ID.COMMENT_INVALID_CONTEXT);
            }
            comment.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case xmlDeclaration.PTYPE:
            if (this._state !== STATE.START) {
               errorCollector.report(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
            } else {
               this._state = STATE.PROLOG_PREDOCTYPE;
            }
            xmlDeclaration.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case docTypeStart.PTYPE:
            switch (this._state) {
               case STATE.PROLOG_PREDOCTYPE:
                  if (pToken.startInternalSubset) {
                     this._state = STATE.IN_DTD;
                  }
                  break;
               default:
                  this._state = STATE.PROLOG_PREDOCTYPE;
                  errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            }
            this._startDocType = pToken;
            docTypeStart.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case docTypeEnd.PTYPE:
            if (this._state !== STATE.PROLOG_PREDOCTYPE && this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            } else {
               this._state = STATE.PROLOG;
            }

            if (this._startDocType) {
               const specialErrorCollector = new ErrorCollector(this._startDocType.open, WellFormedError);
               docTypeEnd.checkWellFormed(pToken, this._startDocType, specialErrorCollector, this._metaData);
               delete this._startDocType;
               specialErrorCollector.getErrors().forEach(error => this.push(error));
            } else {
               docTypeEnd.checkWellFormed(pToken, undefined, errorCollector, this._metaData);
            }
            break;
         case elementStart.PTYPE:
         case elementStart.EMPTY_TYPE:
            const nameText = pToken.name ? pToken.name.str : '';
            if (pToken.type === elementStart.PTYPE) {
               this._elementNameStack.push(nameText);
            }

            if (this._state === STATE.PROLOG_PREDOCTYPE || this._state === STATE.PROLOG) {
               this._state = STATE.IN_CONTENT;
            } else if (this._state === STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ]);
            } else if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT, [ nameText ]);
            }

            elementStart.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case elementEnd.PTYPE:
            const endNameText = pToken.name ? pToken.name.str : '';
            const lastElement = this._elementNameStack[this._elementNameStack.length - 1];

            // 3.0: Well-Formedness Constraint: Element Type Match
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

            elementEnd.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case elementDeclaration.PTYPE:
            if (this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENTDECL_INVALID_CONTEXT);
            }

            elementDeclaration.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case entityDeclaration.PTYPE:
            if (this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ENTITYDECL_INVALID_CONTEXT);
            }

            entityDeclaration.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case entityReference.PTYPE:
            if (this._state !== STATE.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
            }

            entityReference.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case entityReference.PARAM_PTYPE:
            if (this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.PEREF_INVALID_CONTEXT);
            }

            entityReference.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case notationDeclaration.PTYPE:
            if (this._state !== STATE.IN_DTD) {
               errorCollector.report(WellFormedError.ID.NOTATIONDECL_INVALID_CONTEXT);
            }

            notationDeclaration.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case processingInstruction.PTYPE:
            if (this._state === STATE.START) {
               errorCollector.report(WellFormedError.ID.PI_INVALID_CONTEXT);
            }
            processingInstruction.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         case space.PTYPE:
            if (this._state === STATE.START) {
               errorCollector.report(WellFormedError.ID.SPACE_INVALID_CONTEXT);
            }
            space.checkWellFormed(pToken, errorCollector, this._metaData);
            break;
         default:
            errorCollector = undefined;
      }

      if (errorCollector) {
         errorCollector.getErrors().forEach(error => this.push(error));
      }
      this.push(pToken);
   }

}

export default CheckPTokenWellFormedStream;
