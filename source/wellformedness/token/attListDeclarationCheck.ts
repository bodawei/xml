/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, XmlWarning } from 'basic';
import { AttListDeclarationPToken } from 'pToken';
import { strOrBlank } from 'sToken';

import { literalCheck } from '../common/literalCheck';
import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { wordListCheck } from '../common/wordListCheck';
import { WellFormedError } from '../error/WellFormedError';

const WARN = XmlWarning.ID;
const WFEID = WellFormedError.ID;
const ATTR_TYPES = [
   'CDATA',
   'ID',
   'IDREF',
   'IDREFS',
   'ENTITY',
   'ENTITIES',
   'NMTOKEN',
   'NMTOKENS',
   'NOTATION',
];
const DEF_TYPES = ['#REQUIRED', '#IMPLIED', '#FIXED'];

function attListDeclarationCheck(
   pToken: AttListDeclarationPToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
): void {
   // When you rework this, make sure you're doing all the text checking correctly.

   const declType = strOrBlank(pToken.declType);
   const namesSeen: Record<string, boolean> = {};

   ec.setPos(pToken.open);

   ec.setPos(pToken.openSpace);
   ec.check(pToken.openSpace, WFEID.NOTATIONDECL_OPEN_XTRA_SPACE_AFTER);

   ec.setPos(pToken.declType);
   ec.check(declType !== 'ATTLIST', WFEID.ATTLISTDECL_DECLTYPE_INVALID, [declType]);

   const elNameText = strOrBlank(pToken.elementName);

   ec.setPos(pToken.elementName);
   ec.check(!pToken.elementName, WFEID.ATTLISTDECL_NO_ELEMENT_NAME);
   nameCheck(pToken.elementName, ec, confVer, WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID);

   ec.setPos(pToken.elementNameSpace);
   if (pToken.attDefs.length > 0) {
      ec.check(!pToken.elementNameSpace, WFEID.ATTLISTDECL_ELEMENT_NAME_NO_TRAILING_SPACE);
   }

   for (let index = 0; index < pToken.attDefs.length; index++) {
      const attDef = pToken.attDefs[index];
      const attName = strOrBlank(attDef.name);

      ec.setPos(attDef.name);
      nameCheck(attDef.name, ec, confVer, WFEID.ATTLISTDECL_ATTR_NAME_INVALID);
      nameXmlCheck(
         attDef.name,
         ec,
         confVer,
         'ATTRIBUTE',
         WARN.ATTRLISTDECL_ATTR_NAME_XMLCOLON_RESERVED,
         WARN.ATTRLISTDECL_ATTR_NAME_XML_RESERVED,
      );

      if (namesSeen[attName]) {
         ec.reportError(WARN.ATTLISTDECL_ATTR_NAME_DUPLICATE, XmlWarning, [attName]);
      }

      namesSeen[attName] = true;

      ec.setPos(attDef.nameSpace);
      ec.check(!attDef.nameSpace, WFEID.ATTLISTDECL_ATTR_NAME_NO_SPACE, [attName, elNameText]);

      ec.setPos(attDef.type);
      const attType = strOrBlank(attDef.type);
      const upperAttType = attType.toLocaleUpperCase();
      const knownType = ATTR_TYPES.indexOf(upperAttType) !== -1;

      if (knownType) {
         ec.check(attType !== upperAttType, WFEID.ATTLISTDECL_ATTR_TYPE_INVALID, [
            attName,
            elNameText,
            attType,
         ]);
      }

      if (upperAttType === '') {
         if (!attDef.enumeration) {
            ec.report(WFEID.ATTLISTDECL_ATTR_NO_ATTTYPE, [attName, elNameText]);
         } else {
            wordListCheck(attDef.enumeration, ec, confVer);
            ec.check(!attDef.enumeration.closeSpace, WFEID.ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE, [
               attName,
               elNameText,
            ]);
         }
      } else {
         ec.check(!knownType, WFEID.ATTLISTDECL_ATTR_TYPE_UNKNOWN, [attName, elNameText, attType]);
         ec.setPos(attDef.typeSpace);
         ec.check(!attDef.typeSpace, WFEID.ATTLISTDECL_ATTR_TYPE_NO_SPACE, [
            attName,
            attType,
            elNameText,
         ]);

         if (upperAttType === 'NOTATION') {
            if (!attDef.enumeration) {
               ec.report(WFEID.ATTLISTDECL_ATTR_NO_NOTATION, [attName, elNameText]);
            } else {
               wordListCheck(attDef.enumeration, ec, confVer);
               ec.check(!attDef.enumeration.closeSpace, WFEID.ATTLISTDECL_ATTR_NO_NOTATION_SPACE, [
                  attName,
                  elNameText,
               ]);
            }
         }
      }

      // No default type is not an error
      const defType = strOrBlank(attDef.defaultType);
      const upperDefType = defType.toLocaleUpperCase();

      if (attDef.defaultType) {
         ec.setPos(attDef.defaultType);
         const knownDefType = DEF_TYPES.indexOf(upperDefType) !== -1;

         ec.check(!knownDefType, WFEID.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN, [
            attName,
            elNameText,
            defType,
         ]);

         if (knownDefType) {
            ec.check(defType !== upperDefType, WFEID.ATTLISTDECL_ATTR_DEFAULT_INVALID, [
               attName,
               elNameText,
               defType,
            ]);
         }

         ec.setPos(attDef.defaultTypeSpace);
         if (upperDefType === '#FIXED') {
            ec.check(!attDef.defaultTypeSpace, WFEID.ATTLISTDECL_ATTR_FIXED_NO_SPACE, [
               attName,
               elNameText,
            ]);
         }
      }

      ec.setPos(attDef.openQuote);

      if (upperDefType === '' || upperDefType === '#FIXED') {
         ec.check(
            !attDef.openQuote,
            upperDefType === ''
               ? WFEID.ATTLISTDECL_ATTR_NO_VALUE
               : WFEID.ATTLISTDECL_ATTR_FIXED_NO_VALUE,
            [attName, elNameText],
         );
         // @@@ need to check and complain if any entity refs are to external entities (general or parameter)
         literalCheck(attDef, ec, confVer, WFEID.NOUN_ATTRIBUTE);
      } else {
         ec.check(attDef.openQuote, WFEID.ATTLISTDECL_ATTR_EXTRA_VALUE, [attName, elNameText]);
      }
   }

   if (pToken.extra) {
      ec.setPos(pToken.extra);
      ec.report(WFEID.ATTLISTDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   ec.setPos(pToken.close);
   ec.check(!pToken.close, WFEID.ATTLISTDECL_NO_CLOSE, [elNameText]);
}

export { attListDeclarationCheck };
