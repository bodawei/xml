/* Copyright ® 2017-2018 by David John Burrowes. All rights reserved. */

import { Token } from 'basic';
import token, {
   XMLDECL_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,

   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   XmlDeclarationPToken,

   attListDeclaration,
   notationDeclaration,
   unassigned,
   text,
   PToken,
} from 'token';
import { ExpandedLiteralValuePToken } from 'source/token/entityDeclaration';
import * as charRef from 'source/token/charRef';
import { STokenSource } from 'sToken';
import { defaultExtractors } from 'extractor';
import { EntityMetaData } from 'basic';
import { TEXT_PTOKEN, TextPToken } from 'source/token/text';
import { LiteralValuePToken } from 'source/token/common/literal';
import { ExternalId } from 'source/token/common/externalId';
import { AttListPToken } from 'source/token/attListDeclaration';
import { ElementStartPToken, ElementEmptyPToken } from 'source/token/elementStart';
import { UnassignedArray, UnassignedType } from 'source/token/common/unassigned';
import { NotationDeclarationPToken, NotationDeclaration } from 'source/token/notationDeclaration';
import { ElementDeclarationPToken, ELEMENT_DECLARATION_PTOKEN, assignUnassigned } from 'source/token/elementDeclaration';

type GeneralEntityInfo = {
   token: GeneralEntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
   cache?: ExpandedLiteralValuePToken
};

type ParameterEntityInfo = {
   token: ParameterEntityDeclarationPToken;
   isInternal: boolean;
   cache?: ExpandedLiteralValuePToken
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
type ExpandToken = (token: Token, tokenProcessed: TokenHandled) => void;
type TokenHandled = () => void;
type ProcessBody = (sTokenSource: STokenSource, expandToken: ExpandToken, done: STokenSourceProcessed) => void;
type ProcessForEntityValue = (sTokenSource: STokenSource, done: (results: ExpandedLiteralValuePToken) => void) => void;
type STokenSourceProcessed = () => void;
type DeliverAToken = (token: Token) => boolean;
type Processors = {
   processBody: ProcessBody,
   processForEntityValue: ProcessForEntityValue,
   retrieveExternalEntity: (externalId: ExternalId, entityMetaData: EntityMetaData) => STokenSource,
};

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
   private validationMode: ValidationMode;
   private seenParamEntityRef: boolean = false;
   private deliverAToken: DeliverAToken;
   private processors: Processors;

   constructor(validating: boolean, handoffToken: DeliverAToken,  processors: Processors) {
      this.validationMode = validating ? ValidationMode.VALIDATING : ValidationMode.NON_VALIDATING;
      this.deliverAToken = handoffToken;
      this.processors = processors;
   }

   public expandToken(pToken: Token, expanded: TokenHandled) {
      switch (pToken.type) {
         case XMLDECL_PTOKEN:
            this.handleXmlDeclaration(pToken as XmlDeclarationPToken, expanded);
            break;
         case token.attListDeclaration.PTYPE:
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
         case notationDeclaration.PTYPE:
            this.handleNotationDeclaration(pToken as notationDeclaration.PToken, expanded);
            break;
         case token.elementStart.PTYPE:
         case token.elementStart.EMPTY_TYPE:
            this.handleElementStart(pToken as ElementStartPToken, expanded);
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            this.handleGeneralEntityReference(pToken as GeneralEntityReferencePToken, expanded);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            this.handleParameterEntityReference(pToken as ParameterEntityReferencePToken, expanded);
            break;
         default:
            this.deliverAToken(pToken);
            expanded();
      }
   }

   /*
    * Determine whether this is a standalone document or not.
    */
   private handleXmlDeclaration(pToken: XmlDeclarationPToken, handled: TokenHandled) {
      for (const param of pToken.params) {
         const name = param.name.str.toLowerCase();
         const value = param.value ? param.value.str.toLowerCase() : '';

         if (name === 'standalone' && value === 'yes' && this.validationMode === ValidationMode.NON_VALIDATING) {
            this.validationMode = ValidationMode.STANDALONE;
         }
      }

      this.deliverAToken(pToken);
      handled();
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

         // Replace any general entity references in attribute defaults with their referenced values
         for (let attDef of pToken.attDefs) {
            attDef.value = this.expandAttValue(attDef.value);
         }

         this.deliverAToken(pToken);
         handled();
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
         assignUnassigned(pToken);
         this.deliverAToken(pToken);
         handled();
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

               if (pToken.parameter) {
                  info = {
                     token: pToken,
                     isInternal: !pToken.externalId,
                  };
                  entityGroup = this.paramEntitiesByName;
               } else {
                  info = {
                     token: pToken,
                     isUnparsed: !!(pToken as GeneralEntityDeclarationPToken).nDataName,
                     isInternal: !pToken.externalId,
                  };
                  entityGroup = this.generalEntitiesByName;
               }

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
         pToken.unassigned = newUnassigned;

         if (pToken.externalId && pToken.unassigned) {
            pToken.externalId.unassigned = pToken.unassigned;
         }

         notationDeclaration.assignUnassigned(pToken);
         this.deliverAToken(pToken);
         handled();
      });
   }

   /*
    * Expand any general entity references in attribute values.
    */
   private handleElementStart(pToken: ElementStartPToken | ElementEmptyPToken, handled: TokenHandled) {
      for (let attribute of pToken.attributes) {
         attribute.value = this.expandAttValue(attribute.value);
      }

      this.deliverAToken(pToken);
      handled();
   }

   /*
    * Expand a general entity reference, unless it is unparsed, or it references an external parameter entity and
    * this is doing non-validation
    */
   private handleGeneralEntityReference(pToken: GeneralEntityReferencePToken, handled: TokenHandled) {
      const info = pToken.name ? this.generalEntitiesByName[pToken.name.str] : undefined;

      // Can not expand a reference that has no name
      // Can not expand a reference that we have no declaration for
      // §4.4 unparsed entities may not be referenced in content
      // §4.4 and §5.1 Do not include/expand if is external and we are not validating
      if (!info || info.isUnparsed ||
         (!info.isInternal && this.validationMode !== ValidationMode.VALIDATING)) {
            this.deliverAToken(pToken);
            handled();
            return;
      }

      this.deliverAToken(new GeneralEntityStartPToken(pToken));

      const entityProcessed = () => this.expandToken(new GeneralEntityEndPToken(pToken), handled);

      this.processEntity(info.token, (subToken: PToken, subHandled: TokenHandled) => {
         if (subToken.type === 'ENTITY_META_DATA') {
            subHandled();
            return;
         }

         this.expandToken(subToken, subHandled);
      }, entityProcessed);
   }

   /*
    * Expand a parameter entity reference, unless it is unparsed, or it references an external parameter entity and
    * this is doing non-validation
    */
   private handleParameterEntityReference(pToken: ParameterEntityReferencePToken, handled: TokenHandled) {
      const info = pToken.name ? this.paramEntitiesByName[pToken.name.str] : undefined;

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

      const entityProcessed = () => this.expandToken(new ParameterEntityEndPToken(pToken), handled);

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
   private expandAttValue(value: LiteralValuePToken) {
      let newValue: LiteralValuePToken = [];

      for (let element of value) {
         if (!(element instanceof GeneralEntityReferencePToken)) {
            newValue.push(element);
            continue;
         }

         const info = element.name ? this.generalEntitiesByName[element.name.str] : undefined;

         // Can not expand a reference that has no name, or an external entity
         if (!info || !info.isInternal ) {
            newValue.push(element);
            continue;
         }

         newValue.push(new GeneralEntityStartPToken(element));
         // @@ this is not right.  Don't we actually need to parse this in case of char refs?
         newValue = newValue.concat(info.token.value);
         newValue.push(new GeneralEntityEndPToken(element));
      }

      return newValue;
   }

   private expandEntityValue(value: ExpandedLiteralValuePToken, valueProcessed: (newValue: ExpandedLiteralValuePToken) => void) {
      this.retrieveExternalParameterEntities(value, () => {
         let newValue: ExpandedLiteralValuePToken = [];

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

   private retrieveExternalParameterEntities(value: ExpandedLiteralValuePToken, done: Done) {
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
         const seeking: { [name: string] : boolean} = {};
         let seekingCount = 0;

         for (var info of missingParameterEntities) {
            if (seeking[info.token.name!.str]) { // typeHack
               continue;
            }

            seeking[info.token.name!.str] = true; // typeHack
            seekingCount ++;

            // typeHack
            const sTokenSource = this.processors.retrieveExternalEntity(info.token.externalId!, new EntityMetaData());

            this.processors.processForEntityValue(sTokenSource, (results: ExpandedLiteralValuePToken) => {
               this.expandEntityValue(results, (newResult) => {
                  info.cache = newResult;
                  seekingCount --;

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
            const peInfo = peRef.name ? this.paramEntitiesByName[peRef.name.str] : undefined;

            if (peInfo && !peInfo.unssignedCache) {
               missingParameterEntities.push(peInfo);
            }
         }
      };

      if (missingParameterEntities.length === 0) {
         done();
      } else {
         const seeking: { [name: string] : boolean} = {};
         let seekingCount = 0;

         for (var info of missingParameterEntities) {
            if (seeking[info.token.name!.str]) { // typeHack
               continue;
            }

            seeking[info.token.name!.str] = true; // typeHack
            seekingCount ++;

            let sTokenSource: STokenSource;
            // typeHack
            if (info.isInternal) {
               sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
               // Should add ranges
               info.token.value.forEach((element) => {
                  switch (element.type) {
                     case TEXT_PTOKEN:
                        const textEl = element as TextPToken;
                        if (textEl.text) {
                           sTokenSource.addText(textEl.text.str);
                        }
                        break;
                     case charRef.PTYPE:
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
               sTokenSource = this.processors.retrieveExternalEntity(info.token.externalId!, new EntityMetaData());
            }

            unassigned.parseAllValues(sTokenSource, isElementDecl, (results?: UnassignedArray) => {
               info.unssignedCache = results;
               seekingCount --;

               if (seekingCount === 0) {
                  done();
               }
            });
         }
      }
   }

   private expandUnassigned(value: UnassignedArray|void, isElementDecl: boolean, deliverExpandedUnassigned: (val: UnassignedArray|void) => void) {
      if (!value) {
         deliverExpandedUnassigned(value);
         return;
      }

      this.retrieveExternalParameterEntitiesForUnassigned(value, isElementDecl, () => {
         let newUnassigned: UnassignedArray = [];

         for (let element of value) {
            if (element.type === UnassignedType.REFERENCE) {
               const peRef = element.token;
               const peInfo = peRef.name ? this.paramEntitiesByName[peRef.name.str] : undefined;

               if (peInfo && peInfo.unssignedCache) {
                  newUnassigned = newUnassigned.concat(peInfo.unssignedCache);
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
      if (entityDecl.externalId) {
         const sTokenSource = this.processors.retrieveExternalEntity(entityDecl.externalId, new EntityMetaData());
         this.processors.processBody(sTokenSource, expandToken, entityProcessed);
         return;
      }

      // if this is external, then this will need to look it up and turn it into these.
      // Can PE Refs turn up in external general entities?  how about external parameter entities?
      const sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
      for (let element of entityDecl.value)  {
         // console.log(element);
         if (element.type === TEXT_PTOKEN) {
            const text = element as TextPToken;
            if (text.text) {
               sTokenSource.addText(text.text.str, text.text.firstRange);
            }
         } else if (element.type === charRef.PTYPE) {
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

      this.processors.processBody(sTokenSource, expandToken, entityProcessed);
   }

}

export {
   EntityExpander,
   ExpandToken,
   STokenSourceProcessed,
   TokenHandled as TokenProcessed,
};