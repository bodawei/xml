/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { ENTITY_META_DATA, EntityMetaData, EntityKind } from 'basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../error';
import { SToken, strOrBlank } from '../sToken';

import {
   declaration,

   attListDeclaration,
   docTypeEnd,
   docTypeStart,
   elementDeclaration,
   elementStart,
   elementEnd,

   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   CHARREF_PTOKEN,
   COMMENT_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   SPACE_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,

   GeneralEntityReferencePToken,
   NotationDeclarationPToken,
   ParameterEntityReferencePToken,
   ProcessingInstructionPToken,
   SpacePToken,

   GENERAL_ENTITY_START_PTOKEN,
   GeneralEntityStartPToken,
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

type EntitiesInfo = {
   [name: string]: EntityInfo;
}

type EntityInfo = {
   token: Token;
   isInternal: boolean;
}

const PROTECTED_ENTITIES = [ 'amp', 'lt', 'gt', 'apos', 'quot' ];

// This right now only validates the base document.
class CheckPTokenWellFormedStream extends stream.Transform {
   private emd: EntityMetaData;
   private _state: CheckWellFormedState;
   private _elementNameStack: Array<string>;
   private _startDocType?: DocTypeStartPToken;
   private generalEntityDecl: EntitiesInfo = {};
   private paramEntityDecl: EntitiesInfo = {};

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
         case ENTITY_META_DATA:
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
         case CHARDATA_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CHARDATA_INVALID_DOC_CONTEXT);
            }

            (pToken as any).checkWellFormed(errorCollector, this.emd);
            break;
         case CHARREF_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.CHARREF_INVALID_DOC_CONTEXT);
            }

            (pToken as any).checkWellFormed(errorCollector, this.emd); //typehack
            break;
         case COMMENT_PTOKEN:
            if (this._state === CheckWellFormedState.START) {
               errorCollector.report(WellFormedError.ID.COMMENT_INVALID_CONTEXT);
            }
            (pToken as any).checkWellFormed(errorCollector, this.emd); //typehack
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
               // Make sure you eventually validate that the first one matches the doctyp

               this._elementNameStack.push(nameText);
            }

            if (this._state === CheckWellFormedState.PROLOG_PREDOCTYPE || this._state === CheckWellFormedState.PROLOG) {
               this._state = CheckWellFormedState.IN_CONTENT;
            } else if (this._state === CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ]);
            } else if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT, [ nameText ]);
            }

            // Well-formedness Constraint: §3.1: No External Entity References
            //    Attribute values must not contain direct or indirect entity
            //    references to external entities.
            // if (!entityInfo.isInternal) {
            //    const sToken = entityRef.pToken && entityRef.pToken.open;
            //    const error = new WellFormedError(WellFormedError.ID.ATTRIBUTE_INVALID_REFERENCE,
            //       [ entityRef.name ], sToken, sToken);
            //    this.push(error);
            // }

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
            } else {
               if (this._elementNameStack.length === 0) {
                  this._state = CheckWellFormedState.AFTER_CONTENT;
               }
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

            const info = pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN ? this.generalEntityDecl : this.paramEntityDecl;
            const name = strOrBlank(pToken.name);

            if (!info[name]) {
               info[name] = {
                  token: pToken,
                  isInternal: true,
               };
            }
            break;
         case GENERAL_ENTITY_START_PTOKEN:
            // if (this._state !== CheckWellFormedState.IN_CONTENT) {
            //    errorCollector.report(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
            // }
            const genEntityRef = (pToken as GeneralEntityStartPToken).referencePToken;

            this.checkGeneralEntityDeclaration(genEntityRef);
            // genEntityRef.checkWellFormed(errorCollector, this.emd);
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
            }

            this.checkGeneralEntityDeclaration(pToken as GeneralEntityReferencePToken);
            (pToken as GeneralEntityReferencePToken).checkWellFormed(errorCollector, this.emd); // typeHack
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.PEREF_INVALID_CONTEXT);
            }

            this.checkDecl(pToken, this.paramEntityDecl);
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
         case SPACE_PTOKEN:
            if (this._state === CheckWellFormedState.START) {
               errorCollector.report(WellFormedError.ID.SPACE_INVALID_CONTEXT);
            }
            (pToken as SpacePToken).checkWellFormed(errorCollector, this.emd);
            break;
      }

      errorCollector.getErrors().forEach(error => this.push(error));

      this.push(pToken);
   }

   private checkGeneralEntityDeclaration(pToken: GeneralEntityReferencePToken) {
      this.checkDecl(pToken, this.generalEntityDecl);
   }

   private checkDecl(pToken: Token, info: EntitiesInfo) {
      const name = strOrBlank(pToken.name);

      if (!info[name] && PROTECTED_ENTITIES.indexOf(name) === -1) {
         // @@ this is not fully correct. Further, we keep doing this checking about validation mode
         // and so on in various places. Might be good to wrap that all up in a state object.

         // From 4.1 well formedness constraint: entity declared
         // For a document without any DTD, an entity reference must be to one of amp, lt, gt, apos or quote
         // For a document with only an internal DTD subset with no param entity references
         //    (presumably even those in entity values, though that is irrelevant here) the name must must reference a declaration.
         // For a document that is standalone = yes, name must again match a declaration
         // This means one with a DTD, or an external DTD, or param references, it need not match a declaration (though validity will catch those)
         // This has nothing to do with validating or not, interestingly.
         // however,  parameter entity reference will stop all further processing if this is non-validating

         const error = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION,
            [ name ], pToken.open, pToken.open);
         this.push(error);
      }
   }
}

export default CheckPTokenWellFormedStream;
export {
   CheckWellFormedState,
};