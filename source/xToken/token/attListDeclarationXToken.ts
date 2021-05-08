/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { AttListDeclarationPToken } from 'pToken';
import { SToken, strOrBlank } from 'sToken';

import { makeWordListX } from '../common/makeWordListX';

import { LiteralValueX, makeLiteralValueX } from '../common/makeLiteralValueX';

interface AttDefinitionXToken {
   readonly name: string;
   readonly type: AttDefinitionType;
   readonly enumeration?: ReadonlyArray<string>;
   readonly defaultType: AttDefaultType | undefined;
   readonly value: LiteralValueX;
}

const ATTLIST_DECLARATION_XTOKEN = 'ATTLIST_DECLARATION_XTOKEN';

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

function typeToEnum(inputType: SToken | undefined, hasEnumeration: boolean): AttDefinitionType {
   const ucName = strOrBlank(inputType).toUpperCase();

   if (hasEnumeration && ucName === '') {
      return AttDefinitionType.ENUMERATION;
   }

   switch (ucName) {
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
function defaultTypeToEnum(defaultType: SToken | undefined): AttDefaultType | undefined {
   const type = strOrBlank(defaultType).toUpperCase();

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
      const xDefs: Array<AttDefinitionXToken> = [];

      if (typeof nameOrPToken === 'string') {
         this.elementName = nameOrPToken;

         for (const item of attDefs) {
            xDefs.push({
               ...item,
               enumeration: item.enumeration ? [...item.enumeration] : undefined,
            });
         }
      } else {
         this.elementName = strOrBlank(nameOrPToken.elementName);
         this.pToken = nameOrPToken;

         for (const attDef of nameOrPToken.attDefs) {
            xDefs.push({
               name: strOrBlank(attDef.name),
               type: typeToEnum(attDef.type, !!attDef.enumeration),
               enumeration: makeWordListX(attDef.enumeration),
               defaultType: defaultTypeToEnum(attDef.defaultType),
               value: makeLiteralValueX(attDef.value),
            });
         }
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
