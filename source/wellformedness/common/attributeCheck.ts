/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, ErrorCollector, error, ErrorToken, warning } from 'basic';
import { isTextPToken, pTokenArrayToString } from 'pToken';
import { strOrBlank, SToken } from 'sToken';
import { AttributePToken, LiteralValuePToken } from 'token';

import { attributeLangCheck } from './attributeLangCheck';
import { literalCheck } from './literalCheck';
import { nameCheck } from './nameCheck';
import { nameXmlCheck } from '../common/nameXmlCheck';
import { WellFormedError } from '../error/WellFormedError';

type CheckAttValue = (
   name: SToken,
   value: LiteralValuePToken,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
) => void;
type CheckAttName = (
   name: SToken,
   index: number,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
) => void;

const WFEID = WellFormedError.ID;
const WARN = warning.id;

function attributeCheck(
   attributes: ReadonlyArray<AttributePToken>,
   ec: ErrorCollector,
   confVer: ConformanceVersion,
   preceedingSpace: SToken | undefined,
   type: string,
   checkName?: CheckAttName,
   checkValue?: CheckAttValue,
): void {
   const seenAttrNames: { [attrName: string]: true | undefined } = {};

   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];
      const nameText = strOrBlank(attr.name);

      if (index === 0) {
         ec.setPos(preceedingSpace);
         ec.check(!preceedingSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [nameText]);
      } else {
         ec.setPos(attributes[index - 1].trailingSpace);
         ec.check(!attributes[index - 1].trailingSpace, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [
            nameText,
         ]);
      }

      ec.setPos(attr.name);

      if (type === WFEID.NOUN_ATTRIBUTE) {
         // Well-formedness constraint: §3.1: Unique Att Spec
         //    An attribute name must not appear more than once in the same start-tag or empty-element tag.
         ec.check(seenAttrNames[nameText], WFEID.ATTRIBUTE_DUPLICATE_NAME, [nameText]);
         nameXmlCheck(
            attr.name,
            ec,
            confVer,
            'ATTRIBUTE',
            WARN.ATTRIBUTE_NAME_XMLCOLON_RESERVED,
            WARN.ATTRIBUTE_NAME_XML_RESERVED,
         );

         //
         // §2.12: Language Identification
         // The value of the xml:lang attribute must match a particular
         // set of syntactic constraints. Note that if the attribute value
         // has entity references, this won't do any checking.
         //
         if (attr.name.str.toLowerCase() === 'xml:lang') {
            attributeLangCheck(attr.value, ec, confVer); // TypeHack
         }

         seenAttrNames[nameText] = true;
      }

      nameCheck(attr.name, ec, confVer, WFEID.ATTRIBUTE_INVALID_NAME);

      if (checkName) {
         checkName(attr.name, index, ec, confVer);
      }

      ec.setPos(attr.postNameSpace);
      ec.setPos(attr.equal);
      ec.check(!attr.equal, WFEID.ATTRIBUTE_NO_EQUAL, [nameText]);
      ec.setPos(attr.postEqualSpace);

      literalCheck(attr, ec, confVer, type, () => {
         // Well-formedness constraint: §3.1: No < in Attribute Values
         //   The replacement text of any entity referred to directly or indirectly
         //   in an attribute value must not contain a <.
         //   (Note that while the text speaks of only the replacement text of
         //   entity values, the syntax of AttValue doesn't allow it anywhere).
         if (type === WFEID.NOUN_ATTRIBUTE) {
            for (let index = 0; index < attr.value.length; index++) {
               const valuePart = attr.value[index];

               if (isTextPToken(valuePart)) {
                  if (valuePart.text.str.indexOf('<') !== -1) {
                     ec.report(WFEID.ATTRIBUTE_INVALID_VALUE, [nameText]);
                  }
               }
            }
         }

         if (checkValue) {
            checkValue(attr.name, attr.value, ec, confVer);
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
               ec.reportError(
                  error.id.XMLSPACE_INVALID_VALUE,
                  ErrorToken,
                  [valueString],
                  position?.getStartOffset(),
               );
            }
         }
      });
   }
}

export { attributeCheck };
