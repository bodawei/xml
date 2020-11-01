/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { AttListDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { AttributeValueXToken } from '../../token/common/attribute';
import literal from '../../token/common/literal';

interface AttDefinitionProps {
   name: string;
   type: string;
   enumeration?: Array<string>;
   defaultType: string;
   value: AttributeValueXToken;
}

interface AttDefinitionXToken {
   readonly name: string;
   readonly type: string;
   readonly enumeration?: Array<string>;
   readonly defaultType: string;
   readonly value: AttributeValueXToken;
}

const ATTLIST_DECLARATION_XTOKEN = 'ATTLIST_DECLARATION_XTOKEN';

class AttListDeclarationXToken {
   public readonly type: typeof ATTLIST_DECLARATION_XTOKEN = ATTLIST_DECLARATION_XTOKEN;

   public readonly elementName: string;

   public readonly attDefs: ReadonlyArray<AttDefinitionXToken>;

   public pToken?: AttListDeclarationPToken;

   constructor(pToken: AttListDeclarationPToken);
   constructor(elementName: string, attDefs: Array<AttDefinitionXToken>);
   constructor(
      nameOrPToken: string | AttListDeclarationPToken,
      attDefs: ReadonlyArray<AttDefinitionXToken> = [],
   ) {
      const xDefs: Array<AttDefinitionProps> = [];

      if (typeof nameOrPToken === 'string') {
         this.elementName = nameOrPToken;

         for (const item of attDefs) {
            xDefs.push({
               name: item.name,
               type: item.type,
               enumeration: item.enumeration,
               defaultType: item.defaultType,
               value: item.value,
            });
         }
      } else {
         for (const attDef of nameOrPToken.attDefs) {
            let type: string = strOrBlank(attDef.type);

            if (attDef.enumeration && type === '') {
               type = 'ENUMERATION';
            }

            xDefs.push({
               name: attDef.name.str,
               type,
               enumeration: attDef.enumeration?.toXToken(),
               defaultType: strOrBlank(attDef.defaultType),
               value: literal.makeTokenCompatible(attDef) || [],
            });
         }

         this.elementName = strOrBlank(nameOrPToken.elementName);
         this.pToken = nameOrPToken;
      }

      this.attDefs = xDefs;
   }
}

export { ATTLIST_DECLARATION_XTOKEN, AttListDeclarationXToken, AttDefinitionXToken };
