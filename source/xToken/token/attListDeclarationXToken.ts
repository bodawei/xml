/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { AttListDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { AttributeValueXToken } from '../../token/common/attribute';
import literal from '../../token/common/literal';

enum AttDefinitionType {
   CDATA = 'CDATA',
   ID = 'ID',
   IDREF = 'IDREF',
   IDREFS = 'IDREFS',
   ENTITY = 'ENTITY',
   ENTITIES = 'ENTITIES',
   NMTOKEN = 'NMTOKEN',
   NMTOKENS = 'NMTOKENS',
   NOTATION = 'NOTATION',
   ENUMERATION = 'ENUMERATION',
}

enum AttDefaultType {
   REQUIRED = 'REQUIRED',
   IMPLIED = 'IMPLIED',
   FIXED = 'FIXED',
}

interface AttDefinitionProps {
   name: string;
   type: AttDefinitionType;
   enumeration?: Array<string>;
   defaultType: AttDefaultType | undefined;
   value: AttributeValueXToken;
}

interface AttDefinitionXToken {
   readonly name: string;
   readonly type: AttDefinitionType;
   readonly enumeration?: Array<string>;
   readonly defaultType: AttDefaultType | undefined;
   readonly value: AttributeValueXToken;
}

function stringTypeToEnum(type: string): AttDefinitionType {
   switch (type) {
      case AttDefinitionType.ID:
         return AttDefinitionType.ID;
      case AttDefinitionType.IDREF:
         return AttDefinitionType.IDREF;
      case AttDefinitionType.IDREFS:
         return AttDefinitionType.IDREFS;
      case AttDefinitionType.ENTITY:
         return AttDefinitionType.ENTITY;
      case AttDefinitionType.ENTITIES:
         return AttDefinitionType.ENTITIES;
      case AttDefinitionType.NMTOKEN:
         return AttDefinitionType.NMTOKEN;
      case AttDefinitionType.NMTOKENS:
         return AttDefinitionType.NMTOKENS;
      case AttDefinitionType.NOTATION:
         return AttDefinitionType.NOTATION;
      default:
      case AttDefinitionType.CDATA:
         return AttDefinitionType.CDATA;
   }
}
function stringDefaultTypeToEnum(type: string): AttDefaultType | undefined {
   switch (type) {
      case '#REQUIRED':
         return AttDefaultType.REQUIRED;
      case '#IMPLIED':
         return AttDefaultType.IMPLIED;
      case '#FIXED':
         return AttDefaultType.FIXED;
      default:
         return undefined;
   }
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
            const ucName = strOrBlank(attDef.type).toUpperCase();
            const ucDefaultType = strOrBlank(attDef.defaultType).toUpperCase();
            let type: AttDefinitionType = stringTypeToEnum(ucName);

            if (attDef.enumeration && ucName === '') {
               type = AttDefinitionType.ENUMERATION;
            }

            xDefs.push({
               name: attDef.name.str,
               type,
               enumeration: attDef.enumeration?.toXToken(),
               defaultType: stringDefaultTypeToEnum(ucDefaultType),
               value: literal.makeTokenCompatible(attDef) || [],
            });
         }

         this.elementName = strOrBlank(nameOrPToken.elementName);
         this.pToken = nameOrPToken;
      }

      this.attDefs = xDefs;
   }
}

export {
   ATTLIST_DECLARATION_XTOKEN,
   AttDefinitionType,
   AttDefaultType,
   AttListDeclarationXToken,
   AttDefinitionXToken,
};
