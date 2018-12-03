/* Copyright ® 2017-2018 by David John Burrowes. All rights reserved. */

import stream from 'readable-stream';
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
import { STokenSource } from 'sToken';
import { defaultExtractors } from 'extractor';
import { EntityMetaData } from 'basic';
import { TEXT_PTOKEN, TextPToken } from 'source/token/text';
import { PTokenStream } from 'pTokenStream';

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

type Done = () => void;

enum ValidationMode {
   VALIDATING,
   NON_VALIDATING,
   STANDALONE,
}

// Now expand everything.  If it is internal, then we need to first expand the char references
// feed the internal entity value through a processor which expands char refs
// then feed whatever into a STokenSource, a PTokenStream, and then into this, or another instance of this.
function dumpEntity(entityDecl: EntityDeclarationPToken, deliverToken: (value:PToken, done: Done) => void, allDone: Done): void {
   if (entityDecl.externalId) {
      allDone();
      return;
   }

   // if this is external, then this will need to look it up and turn it into these.
   // Can PE Refs turn up in external general entities?  how about external parameter entities?
   const sTokenSource = new STokenSource(defaultExtractors, new EntityMetaData());
   entityDecl.value.forEach((element: PToken) => {
      if (element.type === TEXT_PTOKEN) {
         const text = element as TextPToken;
         if (text.text) {
            sTokenSource.addText(text.text.str, text.text.firstRange);
         }
      } else {
         // do nothing  We should only be finding parameter entity start/end and text (plus charrefs maybe)in these.
      }
   });
   sTokenSource.endText();

   const pTokenStream = new PTokenStream(sTokenSource);

   pTokenStream.on('data', (token: PToken) => {
      if (token.type !== 'ENTITY_META_DATA') {
         pTokenStream.pause();
         deliverToken(token, () => {
            pTokenStream.resume();
         });
      }
   });
   pTokenStream.on('end', () => {
      allDone();
   });
}

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

class EntityExpander extends stream.Transform {
   private paramEntitiesByName: ParameterEntityMap = {};
   private generalEntitiesByName: GeneralEntityMap = {};
   private validationMode: ValidationMode;
   // SOON: starting, dtd, content end
   private dumpEntity = dumpEntity;

   constructor(validating?: boolean) {
      super({
         objectMode: true,
      });

      this.validationMode = validating ? ValidationMode.VALIDATING : ValidationMode.NON_VALIDATING;
   }

   _transform(pToken: PToken, encoding: string, done: Done) {
      this.handleAll(pToken, done);
   }

   private handleAll(pToken: PToken, done: Done) {
      switch (pToken.type) {
         // case XMLDECL_PTOKEN:
         //    this.handleXmlDeclaration(pToken as XmlDeclarationPToken);
         //    break;
         case ENTITY_DECLARATION_PTOKEN:
            this.handleEntityDeclaration(pToken as EntityDeclarationPToken);
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            this.handleGeneralEntityReference(pToken as GeneralEntityReferencePToken, done);
            return;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            this.handleParameterEntityReference(pToken as ParameterEntityReferencePToken, done);
            return;
      }

      this.push(pToken);
      done();
   }

   // private handleXmlDeclaration(pToken: XmlDeclarationPToken) {
   //    for (const param of pToken.params) {
   //       if (param.name.str.toLowerCase() === 'standalone' && this.validationMode === ValidationMode.NON_VALIDATING) {
   //          this.validationMode = ValidationMode.STANDALONE;
   //       }
   //    }
   // }

   private handleEntityDeclaration(pToken: EntityDeclarationPToken) {
      // If the declaration has no name, we won't be able to look it up
      if (!pToken.name) {
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

      if (entityGroup[name]) {
         return;
      }

      entityGroup[name] = info;
   }

   private handleGeneralEntityReference(pToken: GeneralEntityReferencePToken, allDone: Done) {
      const info = pToken.name ? this.generalEntitiesByName[pToken.name.str] : undefined;

      // Can not expand a reference that has no name
      // Can not expand a reference that we have no declaration for
      // §4.4 unparsed entities may not be referenced in content
      // §4.4 Do not include if is external and we are not validating
      if (!pToken.name || !info || info.isUnparsed ||
         !info.isInternal && this.validationMode !== ValidationMode.VALIDATING) {
            this.push(pToken);
            allDone();
            return;
      }

      this.push(new GeneralEntityStartPToken(pToken));

      this.dumpEntity(info.token, (token: PToken, done: Done) => this.handleAll(token, done), () => {
         this.handleAll(new GeneralEntityEndPToken(pToken), allDone);
      });
   }

   private handleParameterEntityReference(pToken: ParameterEntityReferencePToken, allDone: Done) {
      const info = pToken.name ? this.paramEntitiesByName[pToken.name.str] : undefined;

      // Can not expand a reference that has no name
      // Can not expand a reference that we have no declaration for
      // §4.4 Do not include if is external and we are not validating
      if (!pToken.name ||
         !info || !info.isInternal && this.validationMode !== ValidationMode.VALIDATING) {
         this.push(pToken);
         allDone();
         return;
      }

      this.push(new ParameterEntityStartPToken(pToken));

      this.dumpEntity(info.token, (token: PToken, done: Done) => this.handleAll(token, done), () => {
         this.handleAll(new ParameterEntityEndPToken(pToken), allDone);
      });
   }
}

export {
   EntityExpander,
};