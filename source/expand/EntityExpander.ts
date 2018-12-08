/* Copyright ® 2017-2018 by David John Burrowes. All rights reserved. */

import { Token } from 'basic';
import {
   XMLDECL_PTOKEN,
   ENTITY_DECLARATION_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,

   GeneralEntityReferencePToken,
   GeneralEntityStartPToken,
   GeneralEntityEndPToken,
   ParameterEntityReferencePToken,
   ParameterEntityStartPToken,
   ParameterEntityEndPToken,
   XmlDeclarationPToken,

   PToken,
} from 'token';
import { EntityDeclarationPToken } from 'source/token/entityDeclaration';
import * as charRef from 'source/token/charRef';
import { STokenSource } from 'sToken';
import { defaultExtractors } from 'extractor';
import { EntityMetaData } from 'basic';
import { TEXT_PTOKEN, TextPToken } from 'source/token/text';

type GeneralEntityInfo = {
   token: EntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
};

type ParameterEntityInfo = {
   token: EntityDeclarationPToken;
   isInternal: boolean;
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

type ExpandToken = (token: Token, tokenProcessed: TokenProcessed) => void;
type TokenProcessed = () => void;
type ProcessSTokenSource = (sTokenSource: STokenSource, expandToken: ExpandToken, done: STokenSourceProcessed) => void;
type STokenSourceProcessed = () => void;
type DeliverAToken = (token: Token) => boolean;

/**********************************************************************\
 An EntityExpander transforms a series of PTokens and expands any
 general or parameter entity reference tokens encountered directory, or
 found in any attribute values or in any entity values.

 Expand here means that the entity reference is replaced by an entity
 start PToken, followed by the PTokens that are derived from the
 entity value, followed by an entity end PToken.

 This does minimal checking on the overall well-formedness or validity
 of the series of PTokens. This does attend to whether this is being
 done in the context of a validating, non-validating or standalone
 context, and as such it is sensitive to whether it is in the middle
 of the DTD or not, when it does any expansion.  Aside from that,
 this is not concerned whether the series of PTokens actually describe
 a reasonable XML entity.
\**********************************************************************/

class EntityExpander {
   private paramEntitiesByName: ParameterEntityMap = {};
   private generalEntitiesByName: GeneralEntityMap = {};
   private validationMode: ValidationMode;
   // SOON: starting, dtd, content end
   private deliverAToken: DeliverAToken;
   private processSTokenStream: ProcessSTokenSource;

   constructor(validating: boolean, handoffToken: DeliverAToken, processSTokenStream: ProcessSTokenSource) {
      this.validationMode = validating ? ValidationMode.VALIDATING : ValidationMode.NON_VALIDATING;
      this.deliverAToken = handoffToken;
      this.processSTokenStream = processSTokenStream;
   }

   public expandToken(pToken: Token, expanded: TokenProcessed) {
      switch (pToken.type) {
         // case XMLDECL_PTOKEN:
         //    this.handleXmlDeclaration(pToken as XmlDeclarationPToken);
         //    break;
         case ENTITY_DECLARATION_PTOKEN:
            this.handleEntityDeclaration(pToken as EntityDeclarationPToken, expanded);
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            this.processGeneralEntityReference(pToken as GeneralEntityReferencePToken, expanded);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            this.processParameterEntityReference(pToken as ParameterEntityReferencePToken, expanded);
            break;
         default:
            this.deliverAToken(pToken);
            expanded();
      }
   }

   // private handleXmlDeclaration(pToken: XmlDeclarationPToken) {
   //    for (const param of pToken.params) {
   //       if (param.name.str.toLowerCase() === 'standalone' && this.validationMode === ValidationMode.NON_VALIDATING) {
   //          this.validationMode = ValidationMode.STANDALONE;
   //       }
   //    }
   // }

   private handleEntityDeclaration(pToken: EntityDeclarationPToken, expanded: TokenProcessed) {
      // If the declaration has no name, we won't be able to look it up
      if (!pToken.name) {
         this.deliverAToken(pToken);
         expanded();
         return;
      }

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
            isUnparsed: !!pToken.nDataName,
            isInternal: !pToken.externalId,
         };
         entityGroup = this.generalEntitiesByName;
      }

      if (!entityGroup[name]) {
         entityGroup[name] = info;
      }

      this.deliverAToken(pToken);
      expanded();
   }

   private processGeneralEntityReference(pToken: GeneralEntityReferencePToken, referenceProcessed: TokenProcessed) {
      const info = pToken.name ? this.generalEntitiesByName[pToken.name.str] : undefined;

      // Can not expand a reference that has no name
      // Can not expand a reference that we have no declaration for
      // §4.4 unparsed entities may not be referenced in content
      // §4.4 Do not include if is external and we are not validating
      if (!pToken.name || !info || info.isUnparsed ||
         !info.isInternal && this.validationMode !== ValidationMode.VALIDATING) {
            this.deliverAToken(pToken);
            referenceProcessed();
            return;
      }

      this.deliverAToken(new GeneralEntityStartPToken(pToken));

      const entityProcessed = () => this.expandToken(new GeneralEntityEndPToken(pToken), referenceProcessed);

      this.processEntity(info.token, this.processSTokenStream, (subToken: PToken, subProcessed: TokenProcessed) => {
         if (subToken.type === 'ENTITY_META_DATA') {
            subProcessed();
            return;
         }

         this.expandToken(subToken, subProcessed);
      }, entityProcessed);
   }

   private processParameterEntityReference(pToken: ParameterEntityReferencePToken, referenceProcessed: TokenProcessed) {
      const info = pToken.name ? this.paramEntitiesByName[pToken.name.str] : undefined;

      // Can not expand a reference that has no name
      // Can not expand a reference that we have no declaration for
      // §4.4 Do not include if is external and we are not validating
      if (!pToken.name ||
         !info || !info.isInternal && this.validationMode !== ValidationMode.VALIDATING) {
         this.deliverAToken(pToken);
         referenceProcessed();
         return;
      }

      this.deliverAToken(new ParameterEntityStartPToken(pToken));

      const entityProcessed = () => this.expandToken(new ParameterEntityEndPToken(pToken), referenceProcessed);

      this.processEntity(info.token, this.processSTokenStream, (subToken: PToken, subProcessed: TokenProcessed) => {
         if (subToken.type === 'ENTITY_META_DATA') {
            subProcessed();
            return;
         }

         this.expandToken(subToken, subProcessed);
      }, entityProcessed);
   }

   // Now expand everything.  If it is internal, then we need to first expand the char references
   // feed the internal entity value through a processor which expands char refs
   // then feed whatever into a STokenSource, a PTokenStream, and then into this, or another instance of this.
   private processEntity(entityDecl: EntityDeclarationPToken, processSTokenStream: ProcessSTokenSource, expandToken: ExpandToken, entityProcessed: TokenProcessed): void {
      if (entityDecl.externalId) {
         entityProcessed();
         return;
      }

      // if this is external, then this will need to look it up and turn it into these.
      // Can PE Refs turn up in external general entities?  how about external parameter entities?
      const sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
      entityDecl.value.forEach((element: PToken) => {
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
      });
      sTokenSource.endText();

      processSTokenStream(sTokenSource, expandToken, entityProcessed);
   }

}

export {
   EntityExpander,
   ExpandToken,
   STokenSourceProcessed,
   TokenProcessed,
};