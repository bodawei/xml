/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import { ENTITY_META_DATA, EntityMetaData, EntityKind } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { SToken, strOrBlank } from 'sToken';

import {
   declaration,

   attListDeclaration,
   elementDeclaration,

   GENERAL_ENTITY_START_PTOKEN,

   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   CHARREF_PTOKEN,
   COMMENT_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   SPACE_PTOKEN,
   TEXTDECL_PTOKEN,
   XMLDECL_PTOKEN,

   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   ParameterEntityReferencePToken,

   NotationDeclarationPToken,
   ProcessingInstructionPToken,
   SpacePToken,
   PARAMETER_ENTITY_START_PTOKEN,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ElementEmptyPToken,
   ElementStartPToken,
} from '../token';
import { DocTypeStartPToken } from '../token/docTypeStart';
import { AttributePToken } from 'source/token/common/attribute';

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
   closeSubset?: SToken;
};

type GeneralEntitiesInfo = {
   [name: string]: GeneralEntityDeclarationPToken;
}

type ParameterEntitiesInfo = {
   [name: string]: ParameterEntityDeclarationPToken;
}

const PROTECTED_ENTITIES = [ 'amp', 'lt', 'gt', 'apos', 'quot' ];

// This right now only validates the base document.
class CheckPTokenWellFormedStream extends stream.Transform {
   private emd: EntityMetaData;
   private _state: CheckWellFormedState;
   private _elementNameStack: Array<string>;
   private _startDocType?: DocTypeStartPToken;
   private generalEntityDecl: GeneralEntitiesInfo = {};
   private paramEntityDecl: ParameterEntitiesInfo = {};

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
      let startContext = pToken.open || pToken.text;

      if (pToken.type === DOCTYPE_END_PTOKEN) {
         startContext = pToken.closeSubset; // eh?  And what if there is no close?
      } else if (pToken.type === PARAMETER_ENTITY_START_PTOKEN) {
         startContext = (pToken as any).referencePToken.open; // typeHack
      }

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
         case DOCTYPE_START_PTOKEN:
            switch (this._state) {
               case CheckWellFormedState.PROLOG_PREDOCTYPE:
                  if ((pToken as DocTypeStartPToken).openSubset) {
                     this._state = CheckWellFormedState.IN_DTD;
                  }
                  break;
               default:
                  this._state = CheckWellFormedState.PROLOG_PREDOCTYPE;
                  errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            }
            this._startDocType = pToken as DocTypeStartPToken; // typeHack
            this._startDocType.checkWellFormed(errorCollector, this.emd);
            break;
         case DOCTYPE_END_PTOKEN:
            if (this._state !== CheckWellFormedState.PROLOG_PREDOCTYPE && this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            } else {
               this._state = CheckWellFormedState.PROLOG;
            }

            if (this._startDocType) {
               const specialErrorCollector = new ErrorCollector(this._startDocType.open, WellFormedError);
               (pToken as any).checkWellFormed(specialErrorCollector, this.emd);
               delete this._startDocType;
               specialErrorCollector.getErrors().forEach(error => this.push(error));
            } else {
               (pToken as any).checkWellFormed(errorCollector, this.emd);
            }
            break;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            const nameText = strOrBlank(pToken.name);

            if (pToken.type === ELEMENT_START_PTOKEN) {
               // Make sure you eventually validate that the first one matches the doctyp

               this._elementNameStack.push(nameText);
            }

            switch (this._state) {
               case CheckWellFormedState.START:
                  errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DOC_CONTEXT, [ nameText ]);
                  break;
               case CheckWellFormedState.PROLOG_PREDOCTYPE:
               case CheckWellFormedState.PROLOG:
                  this._state = CheckWellFormedState.IN_CONTENT;
                  break;
               case CheckWellFormedState.IN_DTD:
                  errorCollector.report(WellFormedError.ID.ELEMENT_INVALID_DTD_CONTEXT, [ nameText ]);
                  break;
               case CheckWellFormedState.IN_CONTENT:
                  // All good
                  break;
               case CheckWellFormedState.AFTER_CONTENT:
                  // §2.1 Production [1] says that there may only be one element at the top-level
                  //      of the document
                  errorCollector.report(WellFormedError.ID.ELEMENT_NO_MULTIPLE, [ nameText ]);
                  break;
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

            (pToken as any).checkWellFormed(errorCollector, this.emd); //typehack
            this.scanAttributeValues(pToken as any, errorCollector);
            break;
         case ELEMENT_END_PTOKEN:
            const endNameText = strOrBlank(pToken.name);
            const lastElement = this._elementNameStack[this._elementNameStack.length - 1];

            // §3.0.0: Well-Formedness Constraint: Element Type Match
            //    The Name in an element's end-tag must match the element type in the start-tag.
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

            (pToken as any).checkWellFormed(errorCollector, this.emd);
            break;
         case elementDeclaration.PTYPE:
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ELEMENTDECL_INVALID_CONTEXT);
            }

            elementDeclaration.checkWellFormed(pToken as any, errorCollector, this.emd); //typehack
            break;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            const name = strOrBlank(pToken.name);
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ENTITYDECL_INVALID_CONTEXT);
            }

            if (pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN) {
               const genEntityDecl = pToken as GeneralEntityDeclarationPToken;

               genEntityDecl.checkWellFormed(errorCollector, this.emd);
               this.generalEntityDecl[name] = genEntityDecl;
            } else {
               const paramEntityDecl = pToken as ParameterEntityDeclarationPToken;

               paramEntityDecl.checkWellFormed(errorCollector, this.emd);
               this.paramEntityDecl[name] = paramEntityDecl;
            }
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            const genEntityRef: GeneralEntityReferencePToken = pToken as GeneralEntityReferencePToken;
            const genEntityName = strOrBlank(genEntityRef.name);
            const genEntityDecl = this.generalEntityDecl[genEntityName];

            if (this._state !== CheckWellFormedState.IN_CONTENT) {
               errorCollector.report(WellFormedError.ID.REFERENCE_INVALID_DOC_CONTEXT);
            }

            /*
             * §4.1.0: Well-Formedness Constraint: Parsed Entity
             *     An entity reference must not contain the name of an unparsed entity.
             *     Unparsed entities may be referred to only in attribute values
             *     declared to be of type ENTITY or ENTITIES.
             */
            if (genEntityDecl && genEntityDecl.nDataName) {
               errorCollector.report(WellFormedError.ID.REFERENCE_UNPARSED_NO_USE);
            }

            this.checkDecl(pToken, this.generalEntityDecl);
            genEntityRef.checkWellFormed(errorCollector, this.emd); // typeHack
            break;
         case PARAMETER_ENTITY_START_PTOKEN:
            /*
             * §4.1.0: Well-Formedness Constraint: In DTD
             *     Parameter-entity references may only appear in the DTD.
             */
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.PEREF_INVALID_CONTEXT);
            }
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            /*
             * §4.1.0: Well-Formedness Constraint: In DTD
             *     Parameter-entity references may only appear in the DTD.
             */
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

   private checkDecl(pToken: Token, info: ParameterEntitiesInfo | GeneralEntitiesInfo) {
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

   /*
    * Do any well formed checks on the contents of an attribute value.
    */
   private scanAttributeValues(pToken: ElementStartPToken | ElementEmptyPToken, ec: ErrorCollector) {
      const attributes: Array<AttributePToken> = pToken.attributes;

      for (const att of attributes) {
         for (const val of att.value) {
            let name: SToken | void;

            if (val.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
               name = val.name;
            } else if (val.type === GENERAL_ENTITY_START_PTOKEN) {
               name = val.referencePToken.name;
            }

            const declaration = this.generalEntityDecl[strOrBlank(name)];

            /*
             * §4.1.0: Well-Formedness Constraint: Parsed Entity
             *     An entity reference must not contain the name of an unparsed entity.
             *     Unparsed entities may be referred to only in attribute values
             *     declared to be of type ENTITY or ENTITIES.
             */
            if (declaration && declaration.nDataName) {
               ec.report(WellFormedError.ID.REFERENCE_UNPARSED_NO_USE);
            }
         }
      }
   }
}

export default CheckPTokenWellFormedStream;
export {
   CheckWellFormedState,
};