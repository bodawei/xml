import {
   PToken,
   ATTLISTDECL_PTOKEN_TYPE,
   AttListPToken,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ElementStartPToken,
   ElementEmptyPToken,
   TEXT_PTOKEN,
   TextPToken,
   CHARREF_PTOKEN,
} from 'token';
import { strOrBlank, toSToken, SToken } from 'sToken';
import { LiteralValuePToken } from 'source/token/common/literal';
import { ENTITY_META_DATA, EntityMetaData } from 'basic';
import { AttributePToken } from 'source/token/common/attribute';

interface AttDetals {
   name: SToken;
   isCData: boolean;
   openQuote?: SToken;
   defaultValue?: LiteralValuePToken;
   closeQuote?: SToken;
}

interface ElementDetails {
   [attName: string]: AttDetals;
}

interface AttDetailsMap {
   [elementName: string]: ElementDetails;
}

interface NameMap {
   [name: string]: boolean;
}

const CDATA_REGEX = /[ \r\n\t]/g;
const OTHER_REGEX = /[ \r\n\t]+/g;
const LEADING_SPACE_REGEX = /^[ ]+/;
const TRAILING_SPACE_REGEX = /[ ]+$/;

/*
 * §3.3.3: (1.0/1) a whitespace character (#x20, #xD, #xA, #x9) is processed by appending #x20
 *    to the normalized value, except that only a single #x20 is appended for a "#xD#xA"
 *    sequence that is part of an external parsed entity or the literal entity value of
 *    an internal parsed entity
 * §3.3.3 (1.0/2+) For a white space character (#x20, #xD, #xA, #x9), append a space
 *    character (#x20) to the normalized value.
 * (See discussion in the README for this)
 */
function normalizeString(input: string, details: AttDetals): string {
   if (details.isCData) {
      return input.replace(CDATA_REGEX, ' ');
   } else {
      return input.replace(OTHER_REGEX, ' ');
   }
}

/*
 * This is the heart of the noramlization work. Remember an attribute value will contain
 * a sereis of TEXT_PTOKENs, CHARREF_PTOKEN and GENERAL_ENTITY_REFERENCE_PTOKENs.
 * It is relevant to note that if the attribute is not a CDATA attribute, then
 * we also want to trim the spaces at the start and end, and collapse any between.
 * However, those spaces we need to collapse or trim may span across multiple
 * TEXT_PTOKENs.  Presumably, though the spec doesn 't mention this explicitly,
 * a CHARREF that contains a space is not so normalized.
 */
function normalizeAttr(attributeValue: LiteralValuePToken, details: AttDetals): LiteralValuePToken {
   const newValue: LiteralValuePToken = [];
   let lastWasSpace = true;
   let lastItem;

   /*
    * Find the last text token in the attribute so we know which one
    * to trim (don't remember the last if followed by CHARREF, but we
    * do not care about entity references
    */
   for (const val of attributeValue) {
      if (val.type === TEXT_PTOKEN) {
         lastItem = val;
      } else if (val.type === CHARREF_PTOKEN) {
         lastItem = undefined;
      }
   }
   /*
    * §3.3.3 a character reference is processed by appending the referenced character to the
    *    attribute value
    * §3.3.3 an entity reference is processed by recursively processing the replacement text of the entity
    *    Though, these will already have been expanded, so we simply pass the start and end tokens through as well.
    * §3.3.3 Note that if the unnormalized attribute value contains a character reference to...
    *    To paraphrase: char refs in the attr value have that character passed through unchanged.
    *    in contrast non-char-ref'ed whitespace characters are transformed to spaces, and entity
    *    replacement text containing whitespace chars are also converted to space.
    */
   for (const val of attributeValue) {
      const isLast = lastItem === val;
      switch (val.type) {
         case TEXT_PTOKEN:
            let newStr = normalizeString(strOrBlank(val.text), details);

            // Remove any leading space if there was space before this text token
            if (lastWasSpace && !details.isCData) {
               newStr = newStr.replace(LEADING_SPACE_REGEX, '');
            }

            // Remove all trailing space, if present
            if (isLast && !details.isCData) {
               newStr = newStr.replace(TRAILING_SPACE_REGEX, '');
               lastWasSpace = false;
            } else {
               lastWasSpace =
                  newStr.length === 0 ? lastWasSpace : newStr[newStr.length - 1] === ' ';
            }

            const lastText = new TextPToken({
               text: new SToken(newStr, val.text.originalStr, val.text.ranges),
            });
            newValue.push(lastText);
            break;
         case CHARREF_PTOKEN:
            lastWasSpace = false;
            newValue.push(val);
            break;
         default:
            newValue.push(val);
            break;
      }
   }

   return newValue;
}

/*
 * Go through each attribute and normalize its values
 */
function normalizeAttributes(
   attributes: Array<AttributePToken>,
   attrDefs: ElementDetails,
): Array<AttributePToken> {
   const newAttributes = [];

   for (const attr of attributes) {
      const attrName = strOrBlank(attr.name);
      const attrDef = attrDefs[attrName] ?? { isCData: false };

      newAttributes.push({
         ...attr,
         value: normalizeAttr(attr.value, attrDef),
      });
   }

   return newAttributes;
}

/*
 * §3.3.2 Attribute defaults
 * In an attribute declaration, #REQUIRED means that the attribute
 * must always be provided, #IMPLIED that no default value is
 * provided. If the declaration is neither #REQUIRED nor #IMPLIED,
 * then the AttValue value contains the declared default value;
 * the #FIXED keyword states that the attribute must always have
 * the default value. When an XML processor encounters an element
 * without a specification for an attribute for which it has read
 * a default value declaration, it must report the attribute with
 * the declared default value to the application
 */
function gatherDefaults(
   item: ElementStartPToken | ElementEmptyPToken,
   attrDefs: ElementDetails,
): Array<AttributePToken> {
   const hasAttr: NameMap = {};
   const newAttrs: Array<AttributePToken> = [];

   for (const attr of item.attributes) {
      hasAttr[strOrBlank(attr.name)] = true;
   }

   for (const attrName of Object.keys(attrDefs)) {
      const attrDef = attrDefs[attrName];

      if (!hasAttr[attrName] && attrDef.defaultValue && attrName !== '') {
         newAttrs.push({
            name: attrDef.name,
            equal: toSToken('='),
            openQuote: attrDef.openQuote,
            value: attrDef.defaultValue,
            closeQuote: attrDef.closeQuote,
            trailingSpace: toSToken(' '),
         });
      }
   }

   return newAttrs;
}

/*
 * Essentially a one-function class that processes each PToken it is given, adjusting
 * element attributes as needed
 */
class AttFixer {
   private attDetails: AttDetailsMap = {};
   private emd?: EntityMetaData;

   processPToken(input: PToken): PToken {
      switch (input.type) {
         case ENTITY_META_DATA:
            this.emd = this.emd ?? input;
            break;
         case ATTLISTDECL_PTOKEN_TYPE:
            this.captureAttributeDetails(input);
            break;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            return this.processElementPToken(input);
      }

      return input;
   }

   /*
    * Extract information we need fro ATTLIST declaration, and
    * store for later use.
    */
   private captureAttributeDetails(attList: AttListPToken): void {
      const elementName = strOrBlank(attList.elementName);

      if (elementName === '') {
         return;
      }

      this.attDetails[elementName] = this.attDetails[elementName] || {};

      const elDetails = this.attDetails[elementName];

      for (const def of attList.attDefs) {
         const attName = strOrBlank(def.name);
         const attType = strOrBlank(def.type).toLowerCase();

         // §3.3.0: When more than one AttlistDecl is provided for
         //    a given element type, the contents of all those provided
         //    are merged. When more than one definition is provided
         //    for the same attribute of a given element type, the first
         //    declaration is binding and later declarations are ignored
         if (elDetails[attName] || attName === '') {
            continue;
         }

         // §3.3.3 All attributes for which no declaration has been read should be
         //    treated by a non-validating processor as if declared CDATA.
         elDetails[attName] = {
            name: def.name,
            isCData: attType === 'cdata',
         };

         if (def.value && def.value.length > 0) {
            elDetails[attName].openQuote = def.openQuote || toSToken('"');
            elDetails[attName].defaultValue = def.value;
            elDetails[attName].closeQuote = def.closeQuote || toSToken('"');
         }
      }
   }

   private processElementPToken(
      pToken: ElementStartPToken | ElementEmptyPToken,
   ): ElementStartPToken | ElementEmptyPToken {
      const elementName = strOrBlank(pToken.name);
      const attrDefs = this.attDetails[elementName] ?? {};

      const defaultAttrs = gatherDefaults(pToken, attrDefs);
      const combined = [...pToken.attributes, ...defaultAttrs];
      const allAttrs = normalizeAttributes(combined, attrDefs);
      let nameSpace = pToken.nameSpace;

      if (!nameSpace && pToken.attributes.length === 0 && defaultAttrs.length !== 0) {
         nameSpace = toSToken(' ');
      } else if (
         pToken.attributes.length !== 0 &&
         defaultAttrs.length !== 0 &&
         !allAttrs[pToken.attributes.length - 1].trailingSpace
      ) {
         allAttrs[pToken.attributes.length - 1].trailingSpace = toSToken(' ');
      }

      if (pToken.type === ELEMENT_START_PTOKEN) {
         return new ElementStartPToken({
            ...pToken,
            nameSpace,
            attributes: allAttrs,
         });
      } else {
         return new ElementEmptyPToken({
            ...pToken,
            nameSpace,
            attributes: allAttrs,
         });
      }
   }
}

export { AttFixer };
