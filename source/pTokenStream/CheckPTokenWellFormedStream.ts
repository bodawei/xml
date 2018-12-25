/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { EntityMetaData, EntityKind } from 'basic';
import { ErrorCollector, WellFormedError } from '../error';
import { SToken } from '../sToken';

import {
   declaration,

   attListDeclaration,
   charRef,
   charData,
   comment,
   docTypeEnd,
   docTypeStart,
   elementDeclaration,
   elementStart,
   elementEnd,
   space,

   CDATA_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,
   ProcessingInstructionPToken,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
   NOTATION_DECLARATION_PTOKEN,
   NotationDeclarationPToken,
} from '../token';
import { DocTypeStartPToken } from '../token/docTypeStart';

enum CheckWellFormedState {
   START = 'START',
   PROLOG_PREDOCTYPE = 'PROLOG_PREDOCTYPE',
   PROLOG = 'PROLOG',
   IN_CONTENT = 'IN_CONTENT',
   IN_DTD = 'IN_DTD',
   AFTER_CONTENT = 'AFTER_CONTENT',
};

type Token = {
   type: string,
   open?: SToken,
   text?: SToken,
   name?: SToken,
   closeInternalSubset?: SToken;
};

// This right now only validates the base document.
class CheckPTokenWellFormedStream extends stream.Transform {
   private emd: EntityMetaData;
   private _state: CheckWellFormedState;
   private _elementNameStack: Array<string>;
   private _startDocType?: DocTypeStartPToken;

   constructor() {
      super({
         objectMode: true,
      });
      this.emd = new EntityMetaData();
      this._state = CheckWellFormedState.START;
      this._elementNameStack = [];
   }

   _transform(pToken: Token, _: string, done: () => void) {
      this._checkForErrors(pToken);
      done();
   }

   _checkForErrors(pToken: Token) {
      const startContext = pToken.open || pToken.text ||
         (this._startDocType ? this._startDocType.open : pToken.closeInternalSubset);
      let errorCollector = new ErrorCollector(startContext as SToken, WellFormedError); //typehack

      switch (pToken.type) {
         case declaration.PTYPE:
            declaration.checkWellFormed(pToken as any, errorCollector, this.emd); // typehack
            break;
         case EntityMetaData.TYPE:
            this.emd = pToken as EntityMetaData; // typehack
            break;

         case attListDeclaration.PTYPE:
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ATTLISTDECL_INVALID_CONTEXT);
            }

            attListDeclaration.checkWellFormed(pToken as any, errorCollector, this.emd); //typehack
            break;
         case CDATA_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CDATA_INVALID_DOC_CONTEXT);
            }

            (pToken as any).checkWellFormed(errorCollector, this.emd); // typeHack
            break;
         case charData.PTYPE:
            if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CHARDATA_INVALID_DOC_CONTEXT);
            }

            charData.checkWellFormed(pToken as any, errorCollector, this.emd);
            break;
         case charRef.PTYPE:
            if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CHARREF_INVALID_DOC_CONTEXT);
            }

            charRef.checkWellFormed(pToken as any, errorCollector, this.emd); //typehack
            break;
         case comment.PTYPE:
            if (this._state === CheckWellFormedState.START) {
               errorCollector.report(WellFormedError.ID.COMMENT_INVALID_CONTEXT);
            }
            comment.checkWellFormed(pToken as any, errorCollector, this.emd); //typehack
            break;
         case XMLDECL_PTOKEN:
            // §2.8
            if (this._state !== CheckWellFormedState.START || this.emd.kind !== EntityKind.DOCUMENT) {
               errorCollector.report(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
            } else {
               this._state = CheckWellFormedState.PROLOG_PREDOCTYPE;
            }
            (pToken as any).checkWellFormed(errorCollector, this.emd);
            break;
         case TEXTDECL_PTOKEN:
            // §4.3.1
            if (this._state !== CheckWellFormedState.START || this.emd.kind === EntityKind.DOCUMENT) {
               errorCollector.report(WellFormedError.ID.TEXTDECL_INVALID_CONTEXT);
            } else {
               this._state = CheckWellFormedState.PROLOG_PREDOCTYPE;
            }
            (pToken as any).checkWellFormed(errorCollector, this.emd);
            break;
         case docTypeStart.PTYPE:
            switch (this._state) {
               case CheckWellFormedState.PROLOG_PREDOCTYPE:
                  if ((pToken as DocTypeStartPToken).startInternalSubset) {
                     this._state = CheckWellFormedState.IN_DTD;
                  }
                  break;
               default:
                  this._state = CheckWellFormedState.PROLOG_PREDOCTYPE;
                  errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            }
            this._startDocType = pToken as DocTypeStartPToken; // typeHack
            docTypeStart.checkWellFormed(pToken as any, errorCollector, this.emd);
            break;
         case docTypeEnd.PTYPE:
            if (this._state !== CheckWellFormedState.PROLOG_PREDOCTYPE && this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            } else {
               this._state = CheckWellFormedState.PROLOG;
            }

            if (this._startDocType) {
               const specialErrorCollector = new ErrorCollector(this._startDocType.open, WellFormedError);
               docTypeEnd.checkWellFormed(pToken as any, this._startDocType, specialErrorCollector, this.emd);
               delete this._startDocType;
               specialErrorCollector.getErrors().forEach(error => this.push(error));
            } else {
               docTypeEnd.checkWellFormed(pToken as any, undefined as any, errorCollector, this.emd);
            }
            break;
         case elementStart.PTYPE:
         case elementStart.EMPTY_TYPE:
            const nameText = pToken.name ? pToken.name.str : '';
            if (pToken.type === elementStart.PTYPE) {
               this._elementNameStack.push(nameText);
            }

            if (this._state === CheckWellFormedState.PROLOG_PREDOCTYPE || this._state === CheckWellFormedState.PROLOG) {
               this._state = CheckWellFormedState.IN_CONTENT;
            } else if (this._state === CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ]);
            } else if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT, [ nameText ]);
            }

            elementStart.checkWellFormed(pToken as any, errorCollector, this.emd); //typehack
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

            if (this._state === CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT, [ endNameText ]);
            } else if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT, [ endNameText ]);
            }

            elementEnd.checkWellFormed(pToken as any, errorCollector, this.emd);
            break;
         case elementDeclaration.PTYPE:
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENTDECL_INVALID_CONTEXT);
            }

            elementDeclaration.checkWellFormed(pToken as any, errorCollector, this.emd); //typehack
            break;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ENTITYDECL_INVALID_CONTEXT);
            }

            (pToken as any).checkWellFormed(errorCollector, this.emd); // typeHack
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
            }

            (pToken as GeneralEntityReferencePToken).checkWellFormed(errorCollector, this.emd); // typeHack
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.PEREF_INVALID_CONTEXT);
            }

            (pToken as ParameterEntityReferencePToken).checkWellFormed(errorCollector, this.emd); // typeHack
            break;
         case NOTATION_DECLARATION_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.NOTATIONDECL_INVALID_CONTEXT);
            }

            (pToken as NotationDeclarationPToken).checkWellFormed(errorCollector, this.emd); // typeHack
            break;
         case PROCESSING_INSTRUCTION_PTOKEN:
            if (this._state === CheckWellFormedState.START) {
               errorCollector.report(WellFormedError.ID.PI_INVALID_CONTEXT);
            }
            (pToken as ProcessingInstructionPToken).checkWellFormed(errorCollector, this.emd);
            break;
         case space.PTYPE:
            if (this._state === CheckWellFormedState.START) {
               errorCollector.report(WellFormedError.ID.SPACE_INVALID_CONTEXT);
            }
            space.checkWellFormed(pToken as any, errorCollector, this.emd);
            break;
      }

      errorCollector.getErrors().forEach(error => this.push(error));

      this.push(pToken);
   }

}

export default CheckPTokenWellFormedStream;
export {
   CheckWellFormedState,
};