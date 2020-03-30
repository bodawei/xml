/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { Token, ENTITY_META_DATA, EntityKind, EntityLocation } from 'basic';
import {
   CHARREF_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_START_PTOKEN,
   XMLDECL_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,

   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   XmlDeclarationPToken,

   attListDeclaration,
   unassigned,
   PToken,
   InternalSubsetStartToken,
   InternalSubsetEndToken,
   ExternalSubsetEndToken,
   ExternalSubsetStartToken,
   CharDataPToken,
   CHARDATA_PTOKEN,
} from 'token';
import { AttributePToken } from 'source/token/common/attribute';
import { EntityValuePToken } from 'source/token/entityDeclaration';
import * as charRef from 'source/token/charRef';
import { STokenSource, SToken, strOrBlank } from 'sToken';
import { defaultExtractors } from 'extractor';
import { EntityMetaData } from 'basic';
import { TEXT_PTOKEN, TextPToken } from 'source/token/text';
import { LiteralValuePToken } from 'source/token/common/literal';
import { ExternalId } from 'source/token/common/externalId';
import { AttListPToken } from 'source/token/attListDeclaration';
import { ElementStartPToken, ElementEmptyPToken, ELEMENT_EMPTY_PTOKEN } from 'source/token/elementStart';
import { UnassignedArray, UnassignedEndEntity, UnassignedType } from 'source/token/common/unassigned';
import { ElementDeclarationPToken, ELEMENT_DECLARATION_PTOKEN, assignUnassigned } from 'source/token/elementDeclaration';
import { DocTypeStartPToken } from 'source/token/docTypeStart';
import { DocTypeEndPToken } from 'source/token/docTypeEnd';
import { XmlWarning, WellFormedError, ValidityError } from 'error';
// import { expandUnassigned } from './expandUnassined.ts.x';

type GeneralEntityInfo = {
   token: GeneralEntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
   cache?: EntityValuePToken
};

type ParameterEntityInfo = {
   token: ParameterEntityDeclarationPToken;
   isInternal: boolean;
   cache?: EntityValuePToken
   unssignedCache?: UnassignedArray,
};

type GeneralEntityMap = {
   [entityName: string]: GeneralEntityInfo;
};

type ParameterEntityMap = {
   [entityName: string]: ParameterEntityInfo;
};

enum ValidationMode {
   VALIDATING,
   NON_VALIDATING,
   STANDALONE,
}

type Done = () => void;
type ExpandToken = (token: PToken, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;
type ProcessBody = (sTokenSource: STokenSource, inContent: boolean, expandToken: ExpandToken, done: STokenSourceProcessed) => void;
type ProcessForEntityValue = (sTokenSource: STokenSource, done: (results: EntityValuePToken) => void) => void;
type STokenSourceProcessed = () => void;
type DeliverAToken = (token: Token) => boolean;
type Processors = {
   processBody: ProcessBody,
   processForEntityValue: ProcessForEntityValue,
   retrieveExternalEntity: (externalId: ExternalId, entityMetaData: EntityMetaData) => STokenSource,
};

// §4.6: This is our set of data to populate our "info" objects for the predefined entities.
const PREDEFINED_ENTITIES = [{
   name: 'lt',
   value: [
      new charRef.CharRefPToken({
         open: SToken.fromString('&#'),
         digits: SToken.fromString('38'),
      }),
      new TextPToken({ text: SToken.fromString('#60;') }),
   ],
}, {
   name: 'amp',
   value: [
      new charRef.CharRefPToken({
         open: SToken.fromString('&#'),
         digits: SToken.fromString('38'),
      }),
      new TextPToken({ text: SToken.fromString('#38;') }),
   ],
}, {
   name: 'gt',
   value: [
      new charRef.CharRefPToken({
         open: SToken.fromString('&#'),
         digits: SToken.fromString('62'),
      }),
   ],
}, {
   name: 'apos',
   value: [
      new charRef.CharRefPToken({
         open: SToken.fromString('&#'),
         digits: SToken.fromString('39'),
      }),
   ],
}, {
   name: 'quot',
   value: [
      new charRef.CharRefPToken({
         open: SToken.fromString('&#'),
         digits: SToken.fromString('34'),
      }),
   ],
}];

type PredefinedMatches = {
   [name: string]: { charCode: number } | { charCode: number, str: string },
}

const PREDEFINED_MATCHES: PredefinedMatches = {
   /*
    * It is worth noting that amp and lt can not be declared as "<" or "&#60; (for example).
    * The reasons are not super clear. The problem is that the latter will be expanded before
    * is used, so is essentially the same as "<". That, in turn, is bad because of §4.3.2
    * which points out that you can not start a tag in one entity and finish it in another,
    * yet this construction means the tag is starting in this entity.  Declaring the entity
    * as &#38;#60; means that what is in the entity is ultimately &#60;, which means it is not
    * yet the start of anything.
    */
   amp: {
      charCode: 38,
   },
   lt: {
      charCode: 60,
   },
   gt: {
      charCode: 62,
      str: '>',
   },
   apos: {
      charCode: 39,
      str: '\'',
   },
   quot: {
      charCode: 34,
      str: '"',
   },
};

function isPredefined(pToken: GeneralEntityReferencePToken): boolean {
   const name = strOrBlank(pToken.name);

   return ['amp', 'lt', 'gt', 'apos', 'quot'].indexOf(name) !== -1;
}

class ExpanderTraker {
   private names: Array<string> = [];

   public canExpand(name: string): boolean {
      return this.names.indexOf(name) === -1;
   }

   public startExpanding(name: string): void {
      this.names.push(name);
   }

   public stopExpanding() {
      // We right now can't end up in a sitaution where this isn't the right one.
      this.names.pop();
   }
}

/**********************************************************************\
 An EntityExpander transforms a series of PTokens by expanding any
 general or parameter entity reference tokens encountered directly,
 in attribute values, or in entity values.

 Expand here means that the entity reference is replaced by an entity
 start PToken, followed by the PTokens that are derived from the
 entity value, followed by an entity end PToken.

 This behavior is specified across several sections of the standard,
 including §2.8, §2.9, §4.1 and §5.1.

 This does minimal checking on the overall well-formedness or validity
 of the series of PTokens. Indeed, this will readily expand things
 that are not well-formed or not valid (e.g. this will expand
 parameter entity references in markup declarations in the internal
 subset), relying on other proceses to dect and flag these violations.

 This does enforce a few constraints:
 1) From §5.1: When in non-validating mode, this will not load any
    external entities, including the external subset.
 2) From §5.1: In non-validating/standalone=no mode, this will stop
    "reading" any entity or attlist declarations encountered after
    a parameter entity reference in the DTD.
 3) From §3.1: This does not expand references to external entities
    in attribute values.
 4) From §2.9: This will not expand any parameter entities in the
    internal DTD in non-validating or standalone mode.

 Note: It is important to note that within-markup declarations may
 not be fully expanded, especially when the validation mode is
 NON-VALIDATING. Of course, any other entity reference (in the DTD,
 in content, in an attribute or entity value) may not have been
 expanded for one reason or another (e.g. there is no declaration,
 or this is non-validating), but those are probably less surprising.
\**********************************************************************/

class EntityExpander {
   private paramEntitiesByName: ParameterEntityMap = {};
   private generalEntitiesByName: GeneralEntityMap = {};
   private predefinedEntitiesByName: GeneralEntityMap = {};
   private validationMode: ValidationMode;
   private seenParamEntityRef: boolean = false;
   private deliverAToken: DeliverAToken;
   private processors: Processors;
   private docTypeStart?: DocTypeStartPToken;
   private bodyExpansionTracker: ExpanderTraker = new ExpanderTraker();
   private emd: EntityMetaData;

   constructor(validating: boolean, handoffToken: DeliverAToken, processors: Processors) {
      this.validationMode = validating ? ValidationMode.VALIDATING : ValidationMode.NON_VALIDATING;
      this.deliverAToken = handoffToken;
      this.processors = processors;
      this.emd = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5, new EntityLocation('no location in EntityExpander'));

      for (let details of PREDEFINED_ENTITIES) {
         this.predefinedEntitiesByName[details.name] = {
            token: new GeneralEntityDeclarationPToken({
               open: SToken.fromString('<!'),
               value: details.value,
            }),
            isInternal: true,
            isUnparsed: false,
         };
      }
   }

   public expandToken(pToken: Token, expanded: TokenHandled) {
      //  Need documentation to explain the process of this expansion.  In particular, as we process entities, we create TextPTokens, and do we actually validate that their characters are correct?

      switch (pToken.type) {
         case XMLDECL_PTOKEN:
            this.handleXmlDeclaration(pToken as XmlDeclarationPToken, expanded);
            break;
         case DOCTYPE_START_PTOKEN:
            this.handleDocTypeStart(pToken as DocTypeStartPToken, expanded);
            break;
         case DOCTYPE_END_PTOKEN:
            this.handleDocTypeEnd(pToken as DocTypeEndPToken, expanded);
            break;
         case attListDeclaration.PTYPE:
            this.handleAttListDeclaration(pToken as AttListPToken, expanded);
            break;
         case ELEMENT_DECLARATION_PTOKEN:
            this.handleElementDeclaration(pToken as ElementDeclarationPToken, expanded);
            break;
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
            this.handleEntityDeclaration(pToken as GeneralEntityDeclarationPToken, expanded);
            break;
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            this.handleEntityDeclaration(pToken as ParameterEntityDeclarationPToken, expanded);
            break;
         case NOTATION_DECLARATION_PTOKEN:
            this.handleNotationDeclaration(pToken as NotationDeclarationPToken, expanded);
            break;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            this.handleElementStart(pToken as ElementStartPToken, expanded);
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            this.handleGeneralEntityReference(pToken as GeneralEntityReferencePToken, expanded);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            this.handleParameterEntityReference(pToken as ParameterEntityReferencePToken, expanded);
            break;
         case ENTITY_META_DATA:
            this.emd = pToken as any; // EMD hack;
            this.deliverAToken(pToken);
            expanded();
            break;
         default:
            this.deliverAToken(pToken);
            expanded();
      }
   }

   private warn(code: string, params: Array<string>, start: SToken) {
      const warning = new XmlWarning(code, params, start, start);

      this.deliverAToken(warning);
   }

   private error(code: string, params: Array<string>, start: SToken) {
      const errorObj = new WellFormedError(code, params, start, start);

      this.deliverAToken(errorObj);
   }

   matchReplacementText(pToken: GeneralEntityReferencePToken, token: charRef.CharRefPToken | CharDataPToken) {
      const name = strOrBlank(pToken.name);
      const allowed = PREDEFINED_MATCHES[name];
      let matches = false;

      if (token.type === charRef.CHARREF_PTOKEN) {
         matches = (token as charRef.CharRefPToken).charCode === allowed.charCode;
      } else if (token.type === CHARDATA_PTOKEN) {
         matches = (token as CharDataPToken).text.str === (allowed as any).str; // typeHack
      }

      return matches;
   }

   /*
    * Determine whether this is a standalone document or not.
    */
   private handleXmlDeclaration(pToken: XmlDeclarationPToken, handled: TokenHandled) {
      for (const param of pToken.params) {
         const name = param.name.str.toLowerCase();
         const value = strOrBlank(param.value).toLowerCase();

         if (name === 'standalone' && value === 'yes' && this.validationMode === ValidationMode.NON_VALIDATING) {
            this.validationMode = ValidationMode.STANDALONE;
         }
      }

      this.deliverAToken(pToken);
      handled();
   }

   private handleDocTypeStart(pToken: DocTypeStartPToken, handled: TokenHandled) {
      this.deliverAToken(pToken);

      this.docTypeStart = pToken;

      if (pToken.openSubset) {
         this.deliverAToken(new InternalSubsetStartToken());
      }

      handled();
   }

   private handleDocTypeEnd(pToken: DocTypeEndPToken, handled: TokenHandled) {
      if (this.docTypeStart && this.docTypeStart.openSubset) {
         this.deliverAToken(new InternalSubsetEndToken());
      }

      if (this.docTypeStart && this.docTypeStart.externalId) {
         const sTokenSource = this.processors.retrieveExternalEntity(this.docTypeStart.externalId!, this.emd);

         this.deliverAToken(new ExternalSubsetStartToken());
         this.processors.processBody(sTokenSource, false, (token: Token, done: TokenHandled) => {
            if (token.type !== ENTITY_META_DATA) {
               this.expandToken(token, done);
            } else {
               done();
            }
         }, () => {
            this.deliverAToken(new ExternalSubsetEndToken());
            this.deliverAToken(pToken);
            handled();
         });
      } else {
         this.deliverAToken(pToken);
         handled();
      }
   }

   /*
    * Expand any within-markup parameter entity references within the ATTLIST declaration itself,
    *    (§2.8 Indicates that parameter entity references are allowed within markup declarations, though
    *     this ignores that constraint)
    * Expand any general entities in the attribute defaults. This follows from [10] in §2.3 and
    * [60] in §3.3.2.  While not explicit, §3.1 pretty much indicates that no external entity
    * references may be used here.
    */
   private handleAttListDeclaration(pToken: AttListPToken, handled: TokenHandled) {
      this.expandUnassigned(pToken.unassigned, true, (newUnassigned) => {
         pToken.unassigned = newUnassigned as any; // typeHack
         attListDeclaration.assignUnassigned(pToken);

         this.expandAttributedValue(pToken.attDefs, () => {
            this.deliverAToken(pToken);
            handled();
         });
      });
   }

   /*
    * Expand any within-markup parameter entity references within the ELEMENT declaration itself,
    *    (§2.8 Indicates that parameter entity references are allowed within markup declarations, though
    *     this ignores that constraint)
    */
   private handleElementDeclaration(pToken: ElementDeclarationPToken, handled: TokenHandled) {
      this.expandUnassigned(pToken.unassigned, true, (newUnassigned) => {
            pToken.unassigned = newUnassigned as any; // typeHack
            assignUnassigned(pToken);      // if (pToken.unassigned) {
      //    expandUnassigned(pToken.unassigned, {
      //       isElementDecl: true,
      //       paramEntitiesByName: this.paramEntitiesByName,
      //       retrieveExternalEntity: this.processors.retrieveExternalEntity,
      //       emd: this.emd,
      //    }, (newUnassigned) => {
      //       pToken.unassigned = newUnassigned as any; // typeHack
      //       assignUnassigned(pToken);
      //       this.deliverAToken(pToken);
      //       handled();
      //    });
      // } else {
         this.deliverAToken(pToken);
         handled();
      // }
      });
   }

   /*
    * Expand any within-markup parameter entity references within the ELEMENT declaration itself,
    *    (§2.8 Indicates that parameter entity references are allowed within markup declarations, though
    *     this ignores that constraint)
    */
   private handleEntityDeclaration(pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken, handled: TokenHandled) {
      this.expandUnassigned(pToken.unassigned, true, (newUnassigned) => {
         (pToken as any).unassigned = newUnassigned; // typeHack
         pToken.assignUnassigned();

         // §2.8, §4.4.5 and §4.5 all discuss parameter entities in an EntityValue.
         this.expandEntityValue((pToken as any).value, (newValue) => { // typeHack
            (pToken as any).value = newValue;

            // If the declaration has no name, we won't be able to look it up
            if (pToken.name) {
               let info: GeneralEntityInfo | ParameterEntityInfo;
               let entityGroup: GeneralEntityMap | ParameterEntityMap;
               const name = pToken.name.str;

               // §4.2.1 defines internal-ness
               if (pToken.parameter) {
                  info = {
                     token: pToken as any,
                     isInternal: !pToken.externalId,
                  };
                  entityGroup = this.paramEntitiesByName;
               } else {
                  info = {
                     token: pToken as any,
                     isUnparsed: !!(pToken as GeneralEntityDeclarationPToken).nDataName,
                     isInternal: !pToken.externalId,
                  };
                  entityGroup = this.generalEntitiesByName;
               }

               // This is a bit hard to reason about.  The specification does say something
               // definitive, but doesn't do it in a place you would expect, so you must
               // examine several places:
               // §2.9 An external markup declaration is defined as a markup declaration
               // occurring in the external subset or in a parameter entity (external
               // or internal, the latter being included because non-validating
               // processors are not required to read them).]
               // SUMMARY: A non-validating processor it nos obligated to read any parameter
               // entity ("read" is never defined precisely).
               // §4.1
               // Note that non-validating processors are not obligated to read and process
               // entity declarations occurring in parameter entities or in the external subset;
               // SUMMARY: This section only speaks of nor reading entity declarations in
               // PE declarations. But this whole section is only about entities, so this
               // doesn't seem to contradict 2.9
               // §5.1 Non-validating processors are required to check only the
               // document entity, including the entire internal DTD subset,
               // for well-formedness. While they are not required to check the
               // document for validity, they are required to process all the declarations
               // they read in the internal DTD subset and in any parameter entity that
               // they read, up to the first reference to a parameter entity that they
               // do not read; that is to say, they must use the information in those
               // declarations to normalize attribute values, include the replacement
               // text of internal entities, and supply default attribute values
               // §5.2 [non-validating processors] need not read any part of the
               // document other than the document entity.
               // SUMMARY: In conjunction with 2.9, this does say that a processor
               // need not read any parameter entities. And of course this also
               // says a non-validating processor need not read any external entities.



               // §5.1: Except when standalone="yes", [non-validating processors] must not process entity declarations or
               // attribute-list declarations encountered after a reference to a parameter entity that is not read, since
               // the entity may have contained overriding declarations
               // Thus: only store information about this entity declaration if we haven't already seen one with
               // the same name, and we havne't already seen a parameter entity reference in a non-validating mode
               // Note, if not validating, we don't really need to store param entity decls, but we do anyway.
               if ((!this.seenParamEntityRef || this.validationMode !== ValidationMode.NON_VALIDATING) &&
                  !entityGroup[name]) {
                  entityGroup[name] = info;
               }
            }

            this.deliverAToken(pToken);
            handled();
         });
      });
   }

   /*
    * Expand any within-markup parameter entity references within the NOTATION declaration itself,
    *    (§2.8 Indicates that parameter entity references are allowed within markup declarations, though
    *     this ignores that constraint)
    */
   private handleNotationDeclaration(pToken: NotationDeclarationPToken, handled: TokenHandled) {
      this.expandUnassigned(pToken.unassigned, false, (newUnassigned) => {
         (pToken as any).unassigned = newUnassigned; // typeHack
         pToken.assignUnassigned();
         this.deliverAToken(pToken);
         handled();
      });
   }

   /*
    * Expand any general entity references in attribute values.
    */
   private handleElementStart(pToken: ElementStartPToken | ElementEmptyPToken, handled: TokenHandled) {
      this.expandAttributedValue(pToken.attributes, () => {
         this.deliverAToken(pToken);
         handled();
      });
   }

   // private iterate<T, R>(input: Array<T>, index: number, transform: (input: T, output: (result: R) => void) => void, output: Array<R>, done: () => void): void {
   //    if (index > input.length) {
   //       done();
   //    }
   //    const element = input[index];

   //    transform(element, (results: any) => {
   //       if (Array.isArray(results)) {
   //          output.push(...results);
   //       } else {
   //          output.push(results);
   //       }
   //       this.iterate(input, index + 1, transform, output, done);
   //    });
   // }

   private expandAttributedValue(attributes: Array<AttributePToken>, done: () => void) {
      // const output: Array<AttributePToken> = [];

      // this.iterate<AttributePToken, AttributePToken>(attributes, 0, (element) => {
      //    this.expandAttValue(element.value, (newvalue) => {
      //       element.value = newvalue;
      //    }), output, done);


      // Caller could provide the array to consume. so we don't need to and then this expand can expand itself.
      const newAttrs: Array<AttributePToken> = attributes.slice(0);
      const hack = this;

      function doValue() {
         const nextAttribute = newAttrs.shift();

         if (!nextAttribute) {
            done();
         } else {
            hack.expandAttValue(nextAttribute.value, (newValue) => {
               nextAttribute.value = newValue;
               doValue();
            });
         }
      }

      doValue();
      // Replace any general entity references in attribute defaults with their referenced values
      // for (let attribute of attributes) {
      //    attribute.value = this.expandAttValue(attribute.value);
      // }

      // done();
   }
   /*
    * Expand a general entity reference, unless it is unparsed, or it references an external parameter entity and
    * this is doing non-validation
    */
   private handleGeneralEntityReference(pToken: GeneralEntityReferencePToken, handled: TokenHandled) {
      const info = this.getGeneralEntityInfo(pToken);
      const isPredefinedRef = isPredefined(pToken);
      const entityName = strOrBlank(pToken.name);
      const canExpand = this.bodyExpansionTracker.canExpand(entityName);
      let count = 0;

      /*
       * §4.1.0: Well-Formedness Constraint: No Recursion
       *     A parsed entity must not contain a recursive reference
       *     to itself, either directly or indirectly.
       */
      if (!canExpand) {
         this.error(WellFormedError.ID.REFERENCE_INVALID_RECURSION, [entityName], pToken.open);
      }

      // Can not expand a reference that has no name
      // Can not expand a reference that we have no declaration for
      // §4.4 unparsed entities may not be referenced in content
      // §4.4 and §5.1 Do not include/expand if is external and we are not validating
      if (!info || info.isUnparsed || !canExpand ||
         (!info.isInternal && this.validationMode !== ValidationMode.VALIDATING)) {
         this.deliverAToken(pToken);
         handled();
         return;
      }

      this.deliverAToken(new GeneralEntityStartPToken(pToken));
      this.bodyExpansionTracker.startExpanding(entityName)

      const entityProcessed = () => {
         this.bodyExpansionTracker.stopExpanding();
         this.expandToken(new GeneralEntityEndPToken(pToken), handled);
      };

      const processToken = (subToken: PToken, tokenProcessed: TokenHandled) => {
         if (subToken.type === 'ENTITY_META_DATA') {
            tokenProcessed();
            return;
         }

         /*
          * §4.6 Stipulates several details about checking predefined entities, which
          * we do here. Note that expansion of those entities happens elsewhere in
          * this codebase.
          * 1) If the entities `lt` or `amp` are declared, they must be declared as
          *    internal entities whose replacement text is a character reference to
          *    the respective character
          * 2) If the entities `gt`, `apos`, or `quot` are declared, they must be
          *    declared as internal entities whose replacement text is the single
          *    character being escaped (or a character reference ...)
          * This validates that the entities are declared as a character or a
          * character reference.
          */
         if (isPredefinedRef) {
            const matches = this.matchReplacementText(pToken, subToken as any); // typeHack

            if (!matches || count > 0) {
               this.error(WellFormedError.ID.PREDEFINED_INVALD, [entityName], pToken.open);
            }

            count++;
         }

         this.expandToken(subToken, tokenProcessed);
      }

      this.processEntity(info.token, processToken, entityProcessed);
   }

   private getGeneralEntityInfo(pToken: GeneralEntityReferencePToken) {
      const name = strOrBlank(pToken.name);
      const isPredefinedRef = isPredefined(pToken);
      let info = this.generalEntitiesByName[name];

      /*
       * §4.6 Stipulates several details about checking predefined entities, which
       * we do here. Note that expansion of those entities happens elsewhere in
       * this codebase.
       * 1) For interoperability, valid XML documents should declare these entities,
       *    like any others, before using them.
       * 2) If the entities `lt` or `amp` are declared, they must be declared as
       *    internal entities whose replacement text is a character reference to
       *    the respective character
       * 3) If the entities `gt`, `apos`, or `quot` are declared, they must be
       *    declared as internal entities whose replacement text is the single
       *    character being escaped (or a character reference ...)
       * This treats the interoperability as a warning. If the entity is not
       * declared we substitute in a valid substitute.  If it is declared, we
       * check that it is indeed internal.
       *
       * Point 1 is repeated in §4.1 Validity Constraint: Entity Declared
       */
      if (!info && isPredefinedRef) {
         this.warn(XmlWarning.ID.PREDEFINED_UNDECLARED, [name], pToken.open);
         info = this.predefinedEntitiesByName[name];
      } else if (isPredefinedRef && info && info.token.externalId) {
         this.error(WellFormedError.ID.PREDEFINED_EXTERNAL, [name], pToken.open);
      }

      return info;
   }

   /*
    * Expand a parameter entity reference, unless it is unparsed, or it references an external parameter entity and
    * this is doing non-validation
    */
   private handleParameterEntityReference(pToken: ParameterEntityReferencePToken, handled: TokenHandled) {
      // §4.1.0 note: It is not possible to get recursively referenced PE Refs
      const entityName = strOrBlank(pToken.name);
      const info = this.paramEntitiesByName[entityName];

      // Always set this.  But only relevant for standalone.
      this.seenParamEntityRef = true;

      // Can not expand a reference that has no name
      // Can not expand a reference that we have no declaration for
      // §2.9 don't expand parameter entity references when not validating
      if (!info || this.validationMode !== ValidationMode.VALIDATING) {
         this.deliverAToken(pToken);
         handled();
         return;
      }

      this.deliverAToken(new ParameterEntityStartPToken(pToken));

      const entityProcessed = () => {
         this.expandToken(new ParameterEntityEndPToken(pToken), handled);
      };

      this.processEntity(info.token, (subToken: PToken, subHandled: TokenHandled) => {
         if (subToken.type === 'ENTITY_META_DATA') {
            subHandled();
            return;
         }

         this.expandToken(subToken, subHandled);
      }, entityProcessed);
   }

   /*
    * Expand general entity references in an attribute value (either on an element start or
    * attlist declaration)
    * §3.1: Well-formedness constraint: No External Entity References: Attribute values must
    * not contain direct or indirect entity references to external entities.
    * §4.4/§4.4.4: Forbidden: a reference to an external entity in an attribute value.
    */
   private expandAttValue(value: LiteralValuePToken, done: (newValue: LiteralValuePToken) => void) {
      let newValue: LiteralValuePToken = [];

      const hack = this;

      function doElements(toConsume: LiteralValuePToken) {
         const element = Array.isArray(toConsume) ? toConsume.shift() : toConsume as any;

         if (!element) {
            done(newValue);
         } else {
            if (!(element instanceof GeneralEntityReferencePToken)) {
               newValue.push(element);
               doElements(toConsume);
               return;
            }

            // For attlist, does the geref need to be internal?  See §4.1  And do we expand the 5 predefined ones?
            // Also need to do 4.6 (see above for handling this in the body)
            // §4.1 need to prevent recursion here.
            hack.duplicate(element, (result) => {
               newValue.push(result);
            }, doElements, () => {
               doElements(toConsume);
            });


            // const info = hack.getGeneralEntityInfo(element);

            // // Can not expand a reference that has no name, or an external entity
            // if (!info || !info.isInternal) {   // For attlist, does the geref need to be internal?  See §4.1  And do we expand the 5 predefined ones?
            //    newValue.push(element);
            //    doElements(toConsume);
            //    return;
            // }

            // newValue.push(new GeneralEntityStartPToken(element));
            // // @@@
            // // @@ this is not right.  Don't we actually need to parse this in case of char refs?
            // // Also need to do 4.6 (see above for handling this in the body)
            // // §4.1 need to prevent recursion here.
            // newValue = newValue.concat(info.token.value);
            // newValue.push(new GeneralEntityEndPToken(element));
            // doElements(toConsume);
            // return;
         }
      }

      doElements(value);


      // for (let element of value) {
      //    if (!(element instanceof GeneralEntityReferencePToken)) {
      //       newValue.push(element);
      //       continue;
      //    }

      //    const info = this.getGeneralEntityInfo(element);

      //    // Can not expand a reference that has no name, or an external entity
      //    if (!info || !info.isInternal) {   // For attlist, does the geref need to be internal?  See §4.1  And do we expand the 5 predefined ones?
      //       newValue.push(element);
      //       continue;
      //    }

      //    newValue.push(new GeneralEntityStartPToken(element));
      //    // @@@
      //    // @@ this is not right.  Don't we actually need to parse this in case of char refs?
      //    // Also need to do 4.6 (see above for handling this in the body)
      //    // §4.1 need to prevent recursion here.
      //    newValue = newValue.concat(info.token.value);
      //    newValue.push(new GeneralEntityEndPToken(element));
      // }
      // done(newValue);
   }


   private duplicate(pToken: GeneralEntityReferencePToken, oneDone: (one: TextPToken | GeneralEntityReferencePToken | ParameterEntityReferencePToken | GeneralEntityStartPToken | GeneralEntityEndPToken) => void, doAnother: (thing: any, done: () => void) => void, handled: TokenHandled) {
      const info = this.getGeneralEntityInfo(pToken);
      const isPredefinedRef = isPredefined(pToken);
      const entityName = strOrBlank(pToken.name);
      const canExpand = this.bodyExpansionTracker.canExpand(entityName);
      let count = 0;

      /*
       * §4.1.0: Well-Formedness Constraint: No Recursion
       *     A parsed entity must not contain a recursive reference
       *     to itself, either directly or indirectly.
       */
      if (!canExpand) {
         this.error(WellFormedError.ID.REFERENCE_INVALID_RECURSION, [entityName], pToken.open);
      }

      // Can not expand a reference that has no name
      // Can not expand a reference that we have no declaration for
      // §4.4 unparsed entities may not be referenced in content
      // §4.4 and §5.1 Do not include/expand if is external and we are not validating
      if (!info || info.isUnparsed || !canExpand ||
         (!info.isInternal && this.validationMode !== ValidationMode.VALIDATING)) {
         oneDone(pToken);
         handled();
         return;
      }

      oneDone(new GeneralEntityStartPToken(pToken));
      this.bodyExpansionTracker.startExpanding(entityName)

      const entityProcessed = () => {
         this.bodyExpansionTracker.stopExpanding();
         oneDone(new GeneralEntityEndPToken(pToken));
         handled();
      };

      const processToken = (subToken: PToken, tokenProcessed: TokenHandled) => {
         if (subToken.type === 'ENTITY_META_DATA') {
            tokenProcessed();
            return;
         }

         /*
          * §4.6 Stipulates several details about checking predefined entities, which
          * we do here. Note that expansion of those entities happens elsewhere in
          * this codebase.
          * 1) If the entities `lt` or `amp` are declared, they must be declared as
          *    internal entities whose replacement text is a character reference to
          *    the respective character
          * 2) If the entities `gt`, `apos`, or `quot` are declared, they must be
          *    declared as internal entities whose replacement text is the single
          *    character being escaped (or a character reference ...)
          * This validates that the entities are declared as a character or a
          * character reference.
          */
         if (isPredefinedRef) {
            const matches = this.matchReplacementText(pToken, subToken as any); // typeHack

            if (!matches || count > 0) {
               this.error(WellFormedError.ID.PREDEFINED_INVALD, [entityName], pToken.open);
            }

            count++;
         }

         this.expandAttValue([subToken as any], (results) => {
            for (let res of results) {
               oneDone(res as any);
            }
            tokenProcessed();
         });
      }

      this.processEntity(info.token, processToken, entityProcessed);
   }

   private expandEntityValue(value: EntityValuePToken, valueProcessed: (newValue: EntityValuePToken) => void) {
      this.retrieveExternalParameterEntities(value, () => {
         let newValue: EntityValuePToken = [];

         for (let element of value) {
            if (element.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
               const peRef = element as ParameterEntityReferencePToken;
               const peInfo = peRef.name ? this.paramEntitiesByName[peRef.name.str] : undefined;

               if (peInfo) {
                  newValue.push(new ParameterEntityStartPToken(peRef));
                  newValue = newValue.concat(peInfo.cache || (peInfo.token as any).value);
                  newValue.push(new ParameterEntityEndPToken(peRef));
                  continue;
               }
            }

            newValue.push(element);
         };

         valueProcessed(newValue);
      });
   }

   private retrieveExternalParameterEntities(value: EntityValuePToken, done: Done) {
      const missingParameterEntities: Array<ParameterEntityInfo> = [];

      for (let element of value) {
         if (element.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
            const peRef = element as ParameterEntityReferencePToken;
            const peInfo = peRef.name ? this.paramEntitiesByName[peRef.name.str] : undefined;

            if (peInfo && !peInfo.isInternal && !peInfo.cache) {
               missingParameterEntities.push(peInfo);
            }
         }
      };

      if (missingParameterEntities.length === 0) {
         done();
      } else {
         const seeking: { [name: string]: boolean } = {};
         let seekingCount = 0;

         for (var info of missingParameterEntities) {
            const loopInfo = info;
            if (seeking[loopInfo.token.name!.str]) { // typeHack
               continue;
            }

            seeking[loopInfo.token.name!.str] = true; // typeHack
            seekingCount++;

            // typeHack
            const sTokenSource = this.processors.retrieveExternalEntity(loopInfo.token.externalId!, this.emd);

            this.processors.processForEntityValue(sTokenSource, (results: EntityValuePToken) => {
               // Note: Could be getting a TextDecl here
               this.expandEntityValue(results, (newResult) => {
                  loopInfo.cache = newResult;
                  seekingCount--;

                  if (seekingCount === 0) {
                     done();
                  }
               });
            });
         }
      }
   }

   /*
    * Given an unassignedArray, look for all the PE References in it that we don't have values for,
    */
   private retrieveExternalParameterEntitiesForUnassigned(value: UnassignedArray, isElementDecl: boolean, done: Done) {
      const missingParameterEntities: Array<ParameterEntityInfo> = [];

      for (let element of value) {
         if (element.type === UnassignedType.REFERENCE) {
            const peRef = element.token;
            const peInfo = this.paramEntitiesByName[strOrBlank(peRef.name)];

            if (peInfo && !peInfo.unssignedCache) {
               missingParameterEntities.push(peInfo);
            }
         }
      };

      if (missingParameterEntities.length === 0) {
         done();
      } else {
         const seeking: { [name: string]: boolean } = {};
         const sources = [];
         let seekingCount = 0;

         for (let index = 0; index < missingParameterEntities.length; index++) {
            const loopInfo = missingParameterEntities[index];
            if (seeking[loopInfo.token.name!.str]) { // typeHack
               // if (seekingCount === 0) {
               //    done();
               // }
               continue;
            }

            seekingCount++;
            seeking[loopInfo.token.name!.str] = true; // typeHack

            let sTokenSource: STokenSource;
            if (loopInfo.isInternal) {
               sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
               // Should add ranges
               loopInfo.token.value.forEach((element) => {
                  switch (element.type) {
                     case TEXT_PTOKEN:
                        const textEl = element as TextPToken;
                        sTokenSource.addText(textEl.text.str);
                        break;
                     case CHARREF_PTOKEN:
                        const charRefEl = element as charRef.CharRefPToken;
                        const charRefXToken = charRefEl.toXToken();

                        if (charRefEl.digits) {
                           sTokenSource.addText(charRefXToken.char);
                        }
                        break;
                     // ignore expanded entity refs
                  }
               });
               sTokenSource.endText();
            } else {
               sTokenSource = this.processors.retrieveExternalEntity(loopInfo.token.externalId!, this.emd);
            }

            sources.push({
               source: sTokenSource,
               info: loopInfo,
            });
         }

         sources.forEach(stuff => {
            // That could be gettting a textdecl, too
            unassigned.parseAllValues(stuff.source, isElementDecl, (results?: UnassignedArray) => {
               stuff.info.unssignedCache = results;
               seekingCount--; // this doesn't work if the sToken souce is processed snchronously

               if (seekingCount === 0) {
                  done();
               }
            });
         });
      }
   }

   private expandUnassigned(value: UnassignedArray | void, isElementDecl: boolean, deliverExpandedUnassigned: (val: UnassignedArray | void) => void) {
      if (!value) {
         deliverExpandedUnassigned(value);
         return;
      }

      this.retrieveExternalParameterEntitiesForUnassigned(value, isElementDecl, () => {
         let newUnassigned: UnassignedArray = [];

         for (let element of value) {
            if (element.type === UnassignedType.REFERENCE) {
               const peRef = element.token;
               const peInfo = this.paramEntitiesByName[strOrBlank(peRef.name)];

               if (peInfo && peInfo.unssignedCache) {
                  // This still has a problem.  If a parameter entity has a parameter entity in its declaration, taht gets lost before it gets here... but it isn't clear if that is OK or not.
                  const start: UnassignedArray = [{
                     type: UnassignedType.ENTITY_START,
                     token: peRef,
                  }];
                  const end: UnassignedArray = [{
                     type: UnassignedType.ENTITY_END,
                     token: peRef,
                  }];
   
                  newUnassigned = newUnassigned.concat(start, peInfo.unssignedCache, end);
               } else {
                  newUnassigned.push(element);
               }
            } else {
               newUnassigned.push(element);
            }
         };

         deliverExpandedUnassigned(newUnassigned);
      });
   }

   // Now expand everything.  If it is internal, then we need to first expand the char references
   // feed the internal entity value through a processor which expands char refs
   // then feed whatever into a STokenSource, a PTokenStream, and then into this, or another instance of this.
   private processEntity(entityDecl: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken, expandToken: ExpandToken, entityProcessed: TokenHandled): void {
      const inContent = entityDecl.type === 'GENERAL_ENTITY_DECLARATION_PTOKEN';

      if (entityDecl.externalId) {
         const externalEntity = new EntityMetaData(EntityKind.EXTERNAL, this.emd.version, this.emd.revision, this.emd.location);
         const sTokenSource = this.processors.retrieveExternalEntity(entityDecl.externalId, externalEntity);
         this.processors.processBody(sTokenSource, inContent, expandToken, entityProcessed);
         return;
      }

      // if this is external, then this will need to look it up and turn it into these.
      // Can PE Refs turn up in external general entities?  how about external parameter entities?
      const sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
      for (let element of entityDecl.value) {
         // console.log(element);
         if (element.type === TEXT_PTOKEN) {
            const text = element as TextPToken;
            sTokenSource.addText(text.text.str, text.text.firstRange);
         } else if (element.type === CHARREF_PTOKEN) {
            // §4.5 For an internal entity, the replacement text is the content of the entity,
            // after replacement of character references and parameter-entity references.
            // In our case here, we receive internal entities with character references already
            // parsed out.  So, we treat these as ordinary text and append them just like we do
            // text tokens.
            const charRef = element as charRef.CharRefPToken;

            if (charRef.digits) {
               const charRefXToken = charRef.toXToken();
               sTokenSource.addText(charRefXToken.char, charRef.digits.firstRange);
            }
         }
         // do nothing else  We should only be finding parameter entity start/end and text (plus charrefs maybe)in these.
      };
      sTokenSource.endText();

      this.processors.processBody(sTokenSource, inContent, expandToken, entityProcessed);
   }

}

export {
   EntityExpander,
   ExpandToken,
   STokenSourceProcessed,
   TokenHandled as TokenProcessed,
};