/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion, Collector, rangeStartOffset } from 'basic';
import { strOrBlank, SToken } from 'basic';
import { isTextPToken, pTokenArrayToString } from 'pToken';
import { AttributePToken, LiteralValuePToken } from 'token';

import { nameXmlCheck } from '../common/nameXmlCheck';
import { Error } from '../error/error';
import { errorCodes } from '../error/errorCodes';
import { warningCodes } from '../error/warningCodes';
import { wellFormedErrorCodes } from '../error/wellFormedError';
import { attributeLangCheck } from './attributeLangCheck';
import { literalCheck } from './literalCheck';
import { nameCheck } from './nameCheck';

type CheckAttValue = (
   name: SToken,
   value: LiteralValuePToken,
   collector: Collector,
   confVer: ConformanceVersion,
) => void;
type CheckAttName = (
   name: SToken,
   index: number,
   collector: Collector,
   confVer: ConformanceVersion,
) => void;

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

function attributeCheck(
   attributes: ReadonlyArray<AttributePToken>,
   collector: Collector,
   confVer: ConformanceVersion,
   preceedingSpace: SToken | undefined,
   type: string,
   checkName?: CheckAttName,
   checkValue?: CheckAttValue,
): void {
   const seenAttrNames: Record<string, true | undefined> = {};

   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];
      const nameText = strOrBlank(attr.name);

      if (index === 0) {
         collector.setPos(preceedingSpace);
         collector.check(!preceedingSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [nameText]);
      } else {
         collector.setPos(attributes[index - 1].trailingSpace);
         collector.check(
            !attributes[index - 1].trailingSpace,
            WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            [nameText],
         );
      }

      collector.setPos(attr.name);

      if (type === WFEID.NOUN_ATTRIBUTE) {
         // Well-formedness constraint: §3.1: Unique Att Spec
         //    An attribute name must not appear more than once in the same start-tag or empty-element tag.
         collector.check(seenAttrNames[nameText], WFEID.ATTRIBUTE_DUPLICATE_NAME, [nameText]);
         nameXmlCheck(
            attr.name,
            collector,
            confVer,
            'ATTRIBUTE',
            WID.ATTRIBUTE_NAME_XMLCOLON_RESERVED,
            WID.ATTRIBUTE_NAME_XML_RESERVED,
         );

         //
         // §2.12: Language Identification
         // The value of the xml:lang attribute must match a particular
         // set of syntactic constraints. Note that if the attribute value
         // has entity references, this won't do any checking.
         //
         if (attr.name.str.toLowerCase() === 'xml:lang') {
            attributeLangCheck(attr.value, collector, confVer); // TypeHack
         }

         seenAttrNames[nameText] = true;
      }

      nameCheck(attr.name, collector, confVer, WFEID.ATTRIBUTE_INVALID_NAME);

      if (checkName) {
         checkName(attr.name, index, collector, confVer);
      }

      collector.setPos(attr.postNameSpace);
      collector.setPos(attr.equal);
      collector.check(!attr.equal, WFEID.ATTRIBUTE_NO_EQUAL, [nameText]);
      collector.setPos(attr.postEqualSpace);

      literalCheck(attr, collector, confVer, type, () => {
         // Well-formedness constraint: §3.1: No < in Attribute Values
         //   The replacement text of any entity referred to directly or indirectly
         //   in an attribute value must not contain a <.
         //   (Note that while the text speaks of only the replacement text of
         //   entity values, the syntax of AttValue doesn't allow it anywhere).
         if (type === WFEID.NOUN_ATTRIBUTE) {
            for (const valuePart of attr.value) {
               if (isTextPToken(valuePart)) {
                  if (valuePart.text.str.includes('<')) {
                     collector.report(WFEID.ATTRIBUTE_INVALID_VALUE, [nameText]);
                  }
               }
            }
         }

         if (checkValue) {
            checkValue(attr.name, attr.value, collector, confVer);
         }

         //
         // §2.10
         // This specification does not give meaning to any value of `xml:space` other than
         // "default" and "preserve". It is an error for other values to be specified;
         // the XML processor may report the error or may recover by ignoring the attribute
         // specification or by reporting the (erroneous) value to the application.
         //
         // @@@@ Should error if it is not lowercase.
         // We report error on values in validity
         if (attr.name.str.toLowerCase() === 'xml:space') {
            const valueString = pTokenArrayToString(attr.value);
            const position = attr.openQuote?.ranges[0];

            if (valueString !== 'preserve' && valueString !== 'default') {
               collector.reportProblem(
                  Error,
                  errorCodes.id.XMLSPACE_INVALID_VALUE,
                  [valueString],
                  position ? rangeStartOffset(position) : undefined,
               );
            }
         }
      });
   }
}

export { attributeCheck };
