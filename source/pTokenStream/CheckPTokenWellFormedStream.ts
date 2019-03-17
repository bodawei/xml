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
   XmlDeclarationPToken,
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

/*
 * IMPORTANT detail: This processes a stream of PTokens.  Those may or may not have gone through an
 * entity expanding process, and if they have, it may or may not have been a validating process.
 * Thus, this will get data in one of three forms:
 *  - raw parsing of the document entity
 *  - parsing of the document entity with non-validating (that is, from the internal subset) entity expansion
 *  - parsing of the document entity with fully expanded ("validating") entity expansion.
 */

// This right now only validates the base document.
class CheckPTokenWellFormedStream extends stream.Transform {
   private emd: EntityMetaData;
   private _state: CheckWellFormedState;
   private _elementNameStack: Array<string>;
   private _startDocType?: DocTypeStartPToken;
   private generalEntityDecl: GeneralEntitiesInfo = {};
   private paramEntityDecl: ParameterEntitiesInfo = {};
   private isStandalone: boolean = false;
   private hasNoDTD: boolean = true;
   private hasExternalDTD: boolean = false;
   private paramEntiyRefCount: number = 0;

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

         case XMLDECL_PTOKEN:
            const xmlDecl = pToken as XmlDeclarationPToken;

            // §2.8
            if (this._state !== CheckWellFormedState.START || this.emd.kind !== EntityKind.DOCUMENT) {
               errorCollector.report(WellFormedError.ID.XMLDECL_INVALID_CONTEXT);
            } else {
               this._state = CheckWellFormedState.PROLOG_PREDOCTYPE;
            }

            this.isStandalone = xmlDecl.isStandalone();  // Related to §4.1.0 Entiy Declared
            xmlDecl.checkWellFormed(errorCollector, this.emd);
            break;
         case DOCTYPE_START_PTOKEN:
            const startDocType: DocTypeStartPToken = pToken as DocTypeStartPToken;

            switch (this._state) {
               case CheckWellFormedState.PROLOG_PREDOCTYPE:
                  if (startDocType.openSubset) {
                     this._state = CheckWellFormedState.IN_DTD;
                     this.hasNoDTD = false;  // Related to §4.1.0 Entity Declared
                  } else {
                     this.hasNoDTD = !startDocType.externalId;  // Related to §4.1.0 Entity Declared
                  }
                  this.hasExternalDTD = !!startDocType.externalId;
                  break;
               default:
                  this._state = CheckWellFormedState.PROLOG_PREDOCTYPE;
                  errorCollector.report(WellFormedError.ID.DOCTYPE_INVALID_DOC_CONTEXT);
            }

            this._startDocType = startDocType;
            startDocType.checkWellFormed(errorCollector, this.emd);
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
         case attListDeclaration.PTYPE:
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.ATTLISTDECL_INVALID_CONTEXT);
            }

            this.scanAttributeValues((pToken as any).attDefs, errorCollector);   // §4.1.0 Well-formedness constraint: Entity Declared
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
         case TEXTDECL_PTOKEN:
            // §4.3.1
            if (this._state !== CheckWellFormedState.START || this.emd.kind === EntityKind.DOCUMENT) {
               errorCollector.report(WellFormedError.ID.TEXTDECL_INVALID_CONTEXT);
            } else {
               this._state = CheckWellFormedState.PROLOG_PREDOCTYPE;
            }
            (pToken as any).checkWellFormed(errorCollector, this.emd);
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
            this.scanAttributeValues((pToken as any).attributes, errorCollector);
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

            this.checkGeneralEntityDeclared(pToken, this.generalEntityDecl, errorCollector);
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

            // §4.1.0: We do no well formedness checks on whether the entity was declared.

            this.paramEntiyRefCount ++; // Related to §4.1.0 Entity declared
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            const paramEntityRef: ParameterEntityReferencePToken = pToken as ParameterEntityReferencePToken;
            /*
             * §4.1.0: Well-Formedness Constraint: In DTD
             *     Parameter-entity references may only appear in the DTD.
             */
            if (this._state !== CheckWellFormedState.IN_DTD) {
               errorCollector.report(WellFormedError.ID.PEREF_INVALID_CONTEXT);
            }

            this.paramEntiyRefCount ++; // Related to §4.1.0 Entity declared

            // §4.1.0: We do no well-formedness checks on whether the entity was declared.

            paramEntityRef.checkWellFormed(errorCollector, this.emd);
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

   private checkGeneralEntityDeclared(pToken: Token, info: GeneralEntitiesInfo, ec: ErrorCollector) {
      const name = strOrBlank(pToken.name);
      const declarationExists = !!info[name];
      const isPredefinedEntity = PROTECTED_ENTITIES.indexOf(name) !== -1;

      /*
       * §4.1.0: Well-formedness constraint: Entity Declared
       *    In a document without any DTD, a document with only an internal DTD subset which
       *    contains no parameter entity references, or a document with " standalone='yes' ",
       *    for an entity reference that does not occur within the external subset or a
       *    parameter entity, the Name given in the entity reference must match that in
       *    an entity declaration that does not occur within the external subset or
       *    a parameter entity, except that well-formed documents need not declare any of
       *    the following entities: amp, lt, gt, apos, quot.  The declaration of a general
       *    entity must precede any reference to it which appears in a default value in
       *    an attribute-list declaration.
       *    Note that non-validating processors are not obligated to read and process
       *    entity declarations occurring in parameter entities or in the external subset;
       *    for such documents, the rule that an entity must be declared is a well-formedness
       *    constraint only if standalone='yes'.
       *
       * Translation:
       *    If all entity declarations are visibile to a non-validating processor (that is,
       *    there is no dtd, an internal dtd with nothing hidden in parameter entities,
       *    or standalone=yes (which might have an external subset or parm entities, but
       *    we are told they have nothing of significance)), then we can be confident
       *    that we know all the possible entity declarations. As such, if we find an
       *    entity reference, and there is no declaration for it, it is an error.
       *
       *    Or, closer to what this actually does: If we have any reason to believe we
       *    don't have access to all the possible declarations, then don't report an error.
       *
       *    Let's look at the cases this can't address:
       *    - If there is a DTD, and some of it is external, we may or may not have
       *      a declaration in that external DTD subset. So, if we find a reference,
       *      and we are not doing a full validation pass, we won't have read in the
       *      external subset, and so won't know if the reference is correct.
       *    - If there is a DTD, but only internal, and there are parameter entity
       *      references in that internal subset (outside of markup!), those parameter
       *      entity values may contain other entity declarations. Similarly, then,
       *      if we are not doing a full validation process, then we won't expand
       *      those entities and so won't discover the declarations. Thus, when we
       *      find a general entity reference, and find no declaration, we don't
       *      know if it is because the declaration doesn't exist or we didn't read it.
       *    - As far as I can tell, with standalone=yes, we may in fact have external
       *      entities and subsets, but we're assured that things in there do not
       *      affect most of how the document is presented. So, there may be external
       *      entities that have general entity references in them, but we have no
       *      way (or need) to determine if they have corresponding declarations if
       *      we are not doing a validation process.
       *    If we ARE doing a full validation process, of course, then we can
       *    always determine whether any reference has a declaration, but when there
       *    is no declaration, then it is a validation error, and not a well-formedness
       *    error.
       */
      if (!declarationExists && !isPredefinedEntity &&
         (this.hasNoDTD || this.isStandalone || (!this.hasExternalDTD && this.paramEntiyRefCount === 0))) {
         ec.report(WellFormedError.ID.REFERENCE_NO_DECLARATION, [ name ]);
      }
   }

   /*
    * Do any well formed checks on the contents of an attribute value.
    */
   private scanAttributeValues(attributes: Array<AttributePToken> , ec: ErrorCollector) {
      for (const att of attributes) {
         for (const val of att.value) {
            let name: SToken | void;

            if (val.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
               name = val.name;
               this.checkGeneralEntityDeclared(val, this.generalEntityDecl, ec); // §4.1.0
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