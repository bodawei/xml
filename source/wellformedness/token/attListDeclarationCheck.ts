/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector } from 'basic';
import { AttListDeclarationPToken } from 'pToken';
import { strOrBlank } from 'basic';

import { literalCheck } from '../common/literalCheck';
import { nameCheck } from '../common/nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { wordListCheck } from '../common/wordListCheck';
import { Warning } from '../error/Warning';
import { warningCodes } from '../error/warningCodes';
import { wellFormedErrorCodes } from '../error/wellFormedError';

const WID = warningCodes.id;
const WFEID = wellFormedErrorCodes.id;
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
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   // When you rework this, make sure you're doing all the text checking correctly.

   const declType = strOrBlank(pToken.declType);
   const namesSeen: Record<string, boolean> = {};

   collector.setPos(pToken.open);

   collector.setPos(pToken.openSpace);
   collector.check(pToken.openSpace, WFEID.NOTATIONDECL_OPEN_XTRA_SPACE_AFTER);

   collector.setPos(pToken.declType);
   collector.check(declType !== 'ATTLIST', WFEID.ATTLISTDECL_DECLTYPE_INVALID, [declType]);

   const elNameText = strOrBlank(pToken.elementName);

   collector.setPos(pToken.elementName);
   collector.check(!pToken.elementName, WFEID.ATTLISTDECL_NO_ELEMENT_NAME);
   nameCheck(pToken.elementName, collector, confVer, WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID);

   collector.setPos(pToken.elementNameSpace);
   if (pToken.attDefs.length > 0) {
      collector.check(!pToken.elementNameSpace, WFEID.ATTLISTDECL_ELEMENT_NAME_NO_TRAILING_SPACE);
   }

   for (let index = 0; index < pToken.attDefs.length; index++) {
      const attDef = pToken.attDefs[index];
      const attName = strOrBlank(attDef.name);

      collector.setPos(attDef.name);
      nameCheck(attDef.name, collector, confVer, WFEID.ATTLISTDECL_ATTR_NAME_INVALID);
      nameXmlCheck(
         attDef.name,
         collector,
         confVer,
         'ATTRIBUTE',
         WID.ATTLISTDECL_ATTR_NAME_XMLCOLON_RESERVED,
         WID.ATTLISTDECL_ATTR_NAME_XML_RESERVED,
      );

      if (namesSeen[attName]) {
         collector.reportProblem(Warning, WID.ATTLISTDECL_ATTR_NAME_DUPLICATE, [attName]);
      }

      namesSeen[attName] = true;

      collector.setPos(attDef.nameSpace);
      collector.check(!attDef.nameSpace, WFEID.ATTLISTDECL_ATTR_NAME_NO_SPACE, [
         attName,
         elNameText,
      ]);

      collector.setPos(attDef.type);
      const attType = strOrBlank(attDef.type);
      const upperAttType = attType.toLocaleUpperCase();
      const knownType = ATTR_TYPES.indexOf(upperAttType) !== -1;

      if (knownType) {
         collector.check(attType !== upperAttType, WFEID.ATTLISTDECL_ATTR_TYPE_INVALID, [
            attName,
            elNameText,
            attType,
         ]);
      }

      if (upperAttType === '') {
         if (!attDef.enumeration) {
            collector.report(WFEID.ATTLISTDECL_ATTR_NO_ATTTYPE, [attName, elNameText]);
         } else {
            wordListCheck(attDef.enumeration, collector, confVer);
            collector.check(
               !attDef.enumeration.closeSpace,
               WFEID.ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE,
               [attName, elNameText],
            );
         }
      } else {
         collector.check(!knownType, WFEID.ATTLISTDECL_ATTR_TYPE_UNKNOWN, [
            attName,
            elNameText,
            attType,
         ]);
         collector.setPos(attDef.typeSpace);
         collector.check(!attDef.typeSpace, WFEID.ATTLISTDECL_ATTR_TYPE_NO_SPACE, [
            attName,
            attType,
            elNameText,
         ]);

         if (upperAttType === 'NOTATION') {
            if (!attDef.enumeration) {
               collector.report(WFEID.ATTLISTDECL_ATTR_NO_NOTATION, [attName, elNameText]);
            } else {
               wordListCheck(attDef.enumeration, collector, confVer);
               collector.check(
                  !attDef.enumeration.closeSpace,
                  WFEID.ATTLISTDECL_ATTR_NO_NOTATION_SPACE,
                  [attName, elNameText],
               );
            }
         }
      }

      // No default type is not an error
      const defType = strOrBlank(attDef.defaultType);
      const upperDefType = defType.toLocaleUpperCase();

      if (attDef.defaultType) {
         collector.setPos(attDef.defaultType);
         const knownDefType = DEF_TYPES.indexOf(upperDefType) !== -1;

         collector.check(!knownDefType, WFEID.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN, [
            attName,
            elNameText,
            defType,
         ]);

         if (knownDefType) {
            collector.check(defType !== upperDefType, WFEID.ATTLISTDECL_ATTR_DEFAULT_INVALID, [
               attName,
               elNameText,
               defType,
            ]);
         }

         collector.setPos(attDef.defaultTypeSpace);
         if (upperDefType === '#FIXED') {
            collector.check(!attDef.defaultTypeSpace, WFEID.ATTLISTDECL_ATTR_FIXED_NO_SPACE, [
               attName,
               elNameText,
            ]);
         }
      }

      collector.setPos(attDef.openQuote);

      if (upperDefType === '' || upperDefType === '#FIXED') {
         collector.check(
            !attDef.openQuote,
            upperDefType === ''
               ? WFEID.ATTLISTDECL_ATTR_NO_VALUE
               : WFEID.ATTLISTDECL_ATTR_FIXED_NO_VALUE,
            [attName, elNameText],
         );
         // @@@ need to check and complain if any entity refs are to external entities (general or parameter)
         literalCheck(attDef, collector, confVer, WFEID.NOUN_ATTRIBUTE);
      } else {
         collector.check(attDef.openQuote, WFEID.ATTLISTDECL_ATTR_EXTRA_VALUE, [
            attName,
            elNameText,
         ]);
      }
   }

   if (pToken.extra) {
      collector.setPos(pToken.extra);
      collector.report(WFEID.ATTLISTDECL_EXTRA_TEXT, [strOrBlank(pToken.extra)]);
   }

   collector.setPos(pToken.close);
   collector.check(!pToken.close, WFEID.ATTLISTDECL_NO_CLOSE, [elNameText]);
}

export { attListDeclarationCheck };
