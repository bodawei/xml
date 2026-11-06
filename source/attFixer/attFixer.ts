/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import {
   ATTLIST_DECLARATION_PTOKEN,
   CHARREF_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   TEXT_PTOKEN,
   AttListDeclarationPToken,
   ParseToken,
   TextPToken,
} from 'pToken';
import { strOrBlank, toSToken, SToken } from 'basic';

// ick
import {
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ElementStartPToken,
   ElementEmptyPToken,
} from 'token';
import { LiteralValuePToken } from '../token/common/literal';
import { AttributePToken } from '../token/common/attribute';
import { externalIdNormalize } from './common/externalIdNormalize';

interface AugmentedAttributePToken extends AttributePToken {
   defaulted?: boolean;
   normalized?: boolean;
   dtdChangedNormalization?: boolean;
}

interface AttDetals {
   name: SToken;
   isCData: boolean;
   openQuote?: SToken;
   defaultValue?: LiteralValuePToken;
   closeQuote?: SToken;
}

type ElementDetails = Record<string, AttDetals | undefined>;

type AttDetailsMap = Record<string, ElementDetails | undefined>;

type NameMap = Record<string, boolean>;

const CDATA_REGEX = /[ \r\n\t]/g;
const OTHER_REGEX = /[ \r\n\t]+/g;
const LEADING_SPACE_REGEX = /^[ ]+/;
const TRAILING_SPACE_REGEX = /[ ]+$/;

function isAugmentedAttribute(
   attribute: AttributePToken | AugmentedAttributePToken,
): attribute is AugmentedAttributePToken {
   return 'normalized' in attribute || 'defaulted' in attribute;
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
function normalizeAttr(
   attributeValue: LiteralValuePToken,
   details: AttDetals,
): {
   normalized: boolean;
   dtdChangedNormalization: boolean;
   value: LiteralValuePToken;
} {
   const newValue: LiteralValuePToken = [];
   let lastWasSpace = true;
   let normalized = false;
   let dtdChangedNormalization = false;
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
         lastItem = val;
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
            /*
             * §3.3.3: (1.0/1) a whitespace character (#x20, #xD, #xA, #x9) is processed by appending #x20
             *    to the normalized value, except that only a single #x20 is appended for a "#xD#xA"
             *    sequence that is part of an external parsed entity or the literal entity value of
             *    an internal parsed entity
             * §3.3.3 (1.0/2+) For a white space character (#x20, #xD, #xA, #x9), append a space
             *    character (#x20) to the normalized value.
             * (See discussion in the README for this)
             */
            const baseNormalization = strOrBlank(val.text).replace(CDATA_REGEX, ' ');
            let newStr: string = baseNormalization;

            // Do more normalization if this isn't CDATA
            if (!details.isCData) {
               newStr = baseNormalization.replace(OTHER_REGEX, ' ');

               // Remove any leading space if there was space before this text token
               if (lastWasSpace) {
                  newStr = newStr.replace(LEADING_SPACE_REGEX, '');
               }

               // Remove all trailing space, if present
               if (isLast) {
                  newStr = newStr.replace(TRAILING_SPACE_REGEX, '');

                  if (newStr === '' && newValue.length > 0) {
                     let foundNonWhite = false;
                     let index = newValue.length;
                     const temp: LiteralValuePToken = [];

                     while (!foundNonWhite && index !== 0) {
                        index -= 1;
                        const prev = newValue[index];

                        // not enough. would have to go back further if it is not ext
                        if (prev.type === TEXT_PTOKEN) {
                           const newer = prev.text.str.replace(TRAILING_SPACE_REGEX, '');
                           const newPrev = new TextPToken({
                              text: new SToken(newer, prev.text.originalStr, prev.text.ranges),
                           });

                           if (newer.length > 0) {
                              foundNonWhite = true;
                           }
                           newValue.pop();
                           temp.unshift(newPrev);
                        } else {
                           temp.unshift(prev);
                           newValue.pop();
                        }
                     }

                     newValue.push(...temp);
                  }

                  lastWasSpace = false;
               } else {
                  lastWasSpace = newStr.length === 0 ? lastWasSpace : newStr.endsWith(' ');
               }
            }

            const lastText = new TextPToken(
               new SToken(newStr, val.text.originalStr, val.text.ranges),
            );

            if (newStr !== val.text.str) {
               newValue.push(lastText);
               normalized = true;

               //
               // §2.9 Validity Constraint: Standaone Document Declaration
               //    ...attributes with values subject to normalization, where
               //    the attribute appears in the document with a value WHICH WILL
               //    CHANGE AS A RESULT OF NORMALIZATION, ..
               //    (or as 1.0/3 phrases it)
               //    attributes with tokenized types, where the attribute appears
               //    in the document with a value such that normalization will produce
               //    a different value from that which would be produced in the absence
               //    of the declaration,
               if (baseNormalization !== newStr) {
                  dtdChangedNormalization = true;
               }
            } else {
               newValue.push(val);
            }
            break;
         case CHARREF_PTOKEN:
            // This is all not cdata
            if (val.char === ' ') {
               if (details.isCData || (!lastWasSpace && !isLast)) {
                  newValue.push(val);
               }

               if (isLast) {
                  const prev = newValue[newValue.length - 1];
                  if (prev?.type === CHARREF_PTOKEN && prev.char === ' ') {
                     newValue.pop();
                  }
               }
               lastWasSpace = true;
            } else {
               lastWasSpace = false;
               newValue.push(val);
            }
            break;
         default:
            newValue.push(val);
            break;
      }
   }

   return {
      dtdChangedNormalization,
      normalized,
      value: newValue,
   };
}

// CheckXTokenValidStream noralization.. is same?
// normalizeAttributeValue(attribute: any, attInfo: AttInfo | undefined): any {
//    // typeHack
//    const attrDef: AttDefinitionXToken | undefined = attInfo ? attInfo.def : undefined;
//    const isCData = !attrDef || attrDef.type === 'CDATA';
//    let prevHadTrailingSpace = true; // consider the start to already be space terminated
//    let prevPiece: { text: string } | undefined;
//    const newValue = [];

//    for (let index = 0; index < attribute.value.length; index++) {
//       const piece = attribute.value[index];

//       if (!isTextXToken(piece)) {
//          newValue.push(piece);
//          continue;
//       }

//       let str = piece.text;
//       const cDataText = str.replace(/[ \r\n\t]/g, ' ');

//       if (isCData) {
//          str = cDataText;
//       } else {
//          str = str.replace(/[ \r\n\t]+/g, ' ');

//          if (prevHadTrailingSpace) {
//             str = str.replace(/^ /, '');
//          }

//          prevHadTrailingSpace = str.endsWith(' ');
//       }

//       const newPiece = new TextXToken(str);
//       newValue.push(newPiece);
//       if (!isCData) {
//          prevPiece = newPiece;
//       }
//    }

//    if (prevHadTrailingSpace && prevPiece) {
//       prevPiece.text = prevPiece.text.replace(/ $/, ''); // typeHack
//    }

//    return newValue;
// }
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
      const attrDef = attrDefs[attrName] ?? { name: attr.name, isCData: false };
      const normalizedInfo = normalizeAttr(attr.value, attrDef);
      const newAttr: AugmentedAttributePToken = {
         ...attr,
         value: normalizedInfo.value,
      };

      if (normalizedInfo.normalized) {
         newAttr.normalized = true;
      }

      if (normalizedInfo.dtdChangedNormalization) {
         newAttr.dtdChangedNormalization = true;
      }

      newAttributes.push(newAttr);
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
): Array<AugmentedAttributePToken> {
   const hasAttr: NameMap = {};
   const newAttrs: Array<AugmentedAttributePToken> = [];

   for (const attr of item.attributes) {
      hasAttr[strOrBlank(attr.name)] = true;
   }

   for (const attrName of Object.keys(attrDefs)) {
      const attrDef = attrDefs[attrName]!;

      if (!hasAttr[attrName] && attrDef.defaultValue && attrName !== '') {
         newAttrs.push({
            closeQuote: attrDef.closeQuote,
            defaulted: true,
            equal: toSToken('='),
            name: attrDef.name,
            openQuote: attrDef.openQuote,
            trailingSpace: toSToken(' '),
            value: attrDef.defaultValue,
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

   processPToken(input: ParseToken): ParseToken {
      switch (input.type) {
         case ATTLIST_DECLARATION_PTOKEN:
            this.captureAttributeDetails(input);
            break;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            return this.processElementPToken(input);
         case NOTATION_DECLARATION_PTOKEN:
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            if (input.externalId) {
               return {
                  ...input,
                  externalId: externalIdNormalize(input.externalId),
               };
            }
            break;
         // Should do externalId processing here DocTypeStartPToken here
         default:
            // ignore
            break;
      }

      return input;
   }

   /*
    * Extract information we need fro ATTLIST declaration, and
    * store for later use.
    */
   private captureAttributeDetails(attList: AttListDeclarationPToken): void {
      const elementName = strOrBlank(attList.elementName);

      if (elementName === '') {
         return;
      }

      this.attDetails[elementName] = this.attDetails[elementName] ?? {};

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const elDetails = this.attDetails[elementName]!;

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
         const working: Record<string, any> = {
            name: def.name,
            isCData: attType === 'cdata',
         };

         if (def.value.length > 0) {
            working.openQuote = def.openQuote ?? toSToken('"');
            working.defaultValue = def.value;
            working.closeQuote = def.closeQuote ?? toSToken('"');
         }

         elDetails[attName] = working as any;
      }
   }

   private processElementPToken(
      pToken: ElementStartPToken | ElementEmptyPToken,
   ): ElementStartPToken | ElementEmptyPToken {
      const elementName = strOrBlank(pToken.name);

      if (elementName === '') {
         return pToken;
      }

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

export { AugmentedAttributePToken, isAugmentedAttribute, AttFixer };
