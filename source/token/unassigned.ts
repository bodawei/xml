/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { EntityLocation, Range } from '../basic';
import { ErrorCollector } from '../error';
import { SToken, STokenSource } from '../sToken';

import entityEnd from './entityEnd.js';
import entityReference from './entityReference.js';
import entityStart from './entityStart.js';
import text from './text';
import { TextPToken } from './text';
import literal from './common/literal.js';

const TERMINATORS = [ '>', '"', '\'', '%' ];
const TERMINATORS_FOR_NAMELIST = [ '>', '"', '\'', '%', '(', ')', '|', ',', '+', '*', '?' ];
const IS_NAMELIST_CHARS = /[()|,+*?]/;
const BLANK_ORIGIN = 'https://www.w3.org/TR/xml/#as-PE';

const TYPE = {
   SPACE: 'space',
   WORD: 'word',
   LITERAL : 'literal',
};

interface SubtypedTextPToken extends TextPToken {
   subType: string;
};

interface EntityReferencePToken {
   type: string;
   getSTokenArray(): Array<SToken>;
}

interface LiteralPToken {
   type: string;
   openQuote?: SToken;
   value?: SToken;
   closeQuote?: SToken;
}

type UnassignedValue = SubtypedTextPToken | EntityReferencePToken | LiteralPToken;
type UnassignedArray = Array<UnassignedValue>;

type DeliverUnassigned = (value?: UnassignedValue) => void;
type DeliverUnassignedArray = (values?: UnassignedArray) => void;

interface UnassignedPToken {
   type: string;
   nextPropName?: string;
   extra?: UnassignedArray;
   unassigned?: UnassignedArray;
}

interface Descriptor {
   name: string;
   type: string;
   allowed?: RegExp;
   flatten?: boolean
};

type DescriptorArray = Array<Descriptor>;

function isTypedText(value: any): value is SubtypedTextPToken {
   if (value && value.subType) {
      return true;
   }
}

function isLiteral(value: any): value is LiteralPToken {
   if (value && value.type === TYPE.LITERAL) {
      return true;
   }
}

/**********************************************************************\
 The "unassigned" module contains several routines involved in
 handling parsing and manipulating data from within an attlist,
 element, entity or notation declaration.

 This needs special handling, because it is possible to put a
 parameter entity reference in these in ways that make it difficult
 or impossible to resolve what the remaining text means until the
 parameter entity value is available (which is at a substantially
 different stage in the processing).  For example:
    <!ENTITY %somePERef; "foo">
 In this case we can not tell if this is a general or parameter
 entity declaration, and while at first glance it seems that the
 "foo" is the entity value, it might actually be the system or
 public literal.

 The general pattern for handling this is: when a parametner entity
 reference is encounterd while parsing a declaration, this will
 gather the reference and all the remaining text together into
 an array. The text is all parsed at a limited level into a series
 of PTokens, which we call unassigned values.  The array of these
 values is then attached as a property called "unassigned" to the
 PToken representing the declaration. They are called "unassigned"
 because we do not yet know what properties of the declaration
 PToken to assign them to.

 Later, when the parameter entity value is available, its own values
 (also represented as PTokens) will be merged into the unassigned
 array, and then another routine here can be used to assign these
 values to the appropriate properties of the declaration.

 The unassigned values are parsed in this way because we have to
 do enough parsing to accurately find the ">" that closes the
 declaration (e.g. should not be stopped by a ">" inside of a
 literal), but we can not do more detailed parsing until we know
 how they will be used.

 TYPES
 class LiteralPseudoPToken extends LiteralPTokenPart {
    type: 'literal',
    // The value property always contains a single SToken.
 }
 class AnnotatedTextPToken extends TextPToken {
    // if 'space' text property contains only space chars
    // if 'word' text property contains non-space chars
    subType: 'space'|'word',
 }
 type UnassignedValue = ParamEntityPToken | LiteralPseudoPToken |
   AnnotatedTextPToken;
\**********************************************************************/

/**********************************************************************\
 Parse a single unassigned value and pass it (or nothing) back through
 the callback.
\**********************************************************************/

function parseNextValue(source: STokenSource, includeNameListChars: boolean, deliverValue: DeliverUnassigned) {
   source.extract('space', (sToken: SToken) => {
      if (sToken) {
         const pToken = spaceFromSToken(sToken);
         deliverValue(pToken);
         return;
      }

      source.extract('peekChar', (sToken) => {
         if (!sToken) {
            deliverValue();
            return;
         }

         extractValue(source, sToken.str, includeNameListChars, deliverValue);
      });
   });
}

function extractValue(source: STokenSource, peekedChar: string, includeNameListChars: Boolean, deliverValue: DeliverUnassigned) {
   if (includeNameListChars && IS_NAMELIST_CHARS.test(peekedChar)) {
      source.extract('match', peekedChar, (sToken) => {
         const pToken = wordFromSToken(sToken);
         deliverValue(pToken);
      });
      return;
   }

   switch (peekedChar) {
      case '>':
         deliverValue(); // no more values!
         break;
      case '%':
         // return the parameter entity reference
         entityReference.paramParse(source, deliverValue);
         break;
      case '"':
      case '\'':
         const container: LiteralPToken = { type: TYPE.LITERAL };
         literal.parse(source, { pToken: container }, () => {
            deliverValue(container);
         });
         break;
      default:
         const terminators = includeNameListChars ? TERMINATORS_FOR_NAMELIST : TERMINATORS;

         source.extract('word', terminators, (sToken) => {
            const pToken = wordFromSToken(sToken);
            deliverValue(pToken);
         });
         break;
   }
}

/**********************************************************************\
 If the next thing in the source is a parameter entity reference,
 then parse it and all the remaining unassigned values and pass an
 array of them back through the callback. Otherwise pass nothing
 back.
\**********************************************************************/

function checkForPERef(source: STokenSource, deliverResult: DeliverUnassignedArray) {
   source.extract('peekChar', (sToken) => {
      if (!sToken || sToken.str !== '%') {
         deliverResult();
         return;
      }

      parseAllValues(source, false, deliverResult);
   });
}

function parseAllValues(source: STokenSource, includeNameListChars: boolean, deliverValues: DeliverUnassignedArray) {
   const values: UnassignedArray = [];

   function handleValue(value: UnassignedValue) {
      if (!value) {
         deliverValues(values);
         return;
      }

      values.push(value);
      // call via the public interface (helps with jasmine spy'ing)
      unassigned.parseNextValue(source, includeNameListChars, handleValue);
   }

   unassigned.parseNextValue(source, includeNameListChars, handleValue);
}

/**********************************************************************\
 Given the set of unassigned values, find a place for as many of them
 as possible in the PToken.

 Start with the property where parsing left off and then look forward
 in the set of property descriptors until we find one that matches
 the next value in the unassignedValues.

 In a good case, we'll assign values to all described properties.
 In a bad case, only some of the PToken's properties will be assigned
 (this routine will skip over properties in the descriptors if there
 is no approprite value when it comes time to consider that property)
 In the bad case, the set of unassigned values may not all be assigned.

 Another way to think about this: we can skip over properties, but
 may not skip over a value in the unassignedValues array.
\**********************************************************************/

function assignToProps(unassignedValues: UnassignedArray, pToken: UnassignedPToken|{}, leftOff: string, propertyDescriptors: DescriptorArray) {
   const valueCursor = new UnassignedValueCursor(unassignedValues);
   const allDescriptors = propertyDescriptors.slice(0);
   const startPropName = leftOff || propertyDescriptors[0].name;

   const descriptors = findDescriptorsToUse(allDescriptors, pToken, startPropName, valueCursor);

   assignValues(descriptors, pToken, valueCursor);
}

function findDescriptorsToUse(propertyDescriptors: DescriptorArray, pToken: UnassignedPToken|{}, leftOff: string, cursor: UnassignedValueCursor) {
   let nextValue = cursor.getNext();
   let prev;

   while (propertyDescriptors.length > 0 && nextValue) {
      const descriptor = propertyDescriptors[0];

      if (descriptor.name === leftOff) {
         /*
          * If the first value item is a space, but our descriptor isn't
          * a space, try to see if the value can be used in the property
          * immediately before the matched descriptor.
          * e.g.
          *    <!ENTITY % example " SYSTEM 'http://somewhere.com'">
          *    <!ELEMENT foo %example;>
          * The leading space in the entity value really belongs with
          * the space after foo. Our bias is to reproduce the parsing we
          * would have done if the PERef wasn't there.
          */
         if (isTypedText(nextValue)) {
            if (descriptor.type !== TYPE.SPACE && nextValue.subType === TYPE.SPACE) {
               const prevWasSpace = prev && prev.type === TYPE.SPACE;
               const genericPToken: any = pToken;

               if (prevWasSpace) {
                  if (genericPToken[prev.name]) {
                     genericPToken[prev.name].merge(nextValue.text);
                  } else {
                     genericPToken[prev.name] = nextValue.text;
                  }

                  nextValue = cursor.getNext();
               }
            }
         }

         break;
      }

      prev = propertyDescriptors.shift();
   }

   cursor.ungetValue(nextValue);

   return propertyDescriptors;
}

function assignValues(propertyDescriptors: DescriptorArray, pToken: UnassignedPToken|{}, cursor: UnassignedValueCursor) {
   for (let index = 0; index < propertyDescriptors.length; index++) {
      const nextValue = cursor.getNext();
      const descriptor = propertyDescriptors[index];
      const genericPToken: any = pToken;

      if (!nextValue) {
         return;
      }

      if (isTypedText(nextValue) && descriptor.type === nextValue.subType) {
         switch (nextValue.subType) {
            case TYPE.WORD:
               let canAssign = true;
               if (descriptor.allowed) {
                  const valueText = nextValue.text ? nextValue.text.str : '';
                  canAssign = descriptor.allowed.test(valueText.toLocaleLowerCase());
               }

               if (canAssign) {
                  genericPToken[descriptor.name] = nextValue.text;
               } else {
                  cursor.ungetValue(nextValue);
               }
               break;
            case TYPE.SPACE:
               genericPToken[descriptor.name] = nextValue.text;
               break;
         }
      } else if (descriptor.type === nextValue.type) {
         if (isLiteral(nextValue) && descriptor.flatten) {
            genericPToken.openQuote = nextValue.openQuote;
            genericPToken.value = nextValue.value;
            genericPToken.closeQuote = nextValue.closeQuote;
         } else {
            genericPToken[descriptor.name] = nextValue;
            delete genericPToken[descriptor.name].type;
         }
      } else {
         cursor.ungetValue(nextValue);
      }
   }
}

/*
 * A simple class used to iterate through an array of unassigned values.
 *
 * We need to do special work in two cases:
 *  - We do not want to return pestart and peend markers.
 *    Instead, section 4.4.8 of the standard says that the
 *    replacement text for a parameter entity, in this context,
 *    must have a space added before and after the rest of the
 *    text.
 *    https://www.w3.org/TR/xml/#as-PE
 *  - If there are a series of spaces in a row consolidate them
 *    into a single text PToken.
 */
class UnassignedValueCursor {
   private values: Array<UnassignedValue>;

   constructor(unassignedValues: Array<UnassignedValue>) {
      this.values = unassignedValues;
   }

   getNext(): UnassignedValue {
      if (this.values.length <= 0) {
         return;
      }

      const candidatePToken = this._peekValue();
      this.values.shift();

      /*
       * If two+ spaces are side-by-side, merge the two. This can happen
       * even though the unassigned parser will itself never produce two
       * adjacent spaces. For example, a peref's EntityValue is " &another; "
       * and another is defined as " x ". Because 4.4.8 says the replacement
       * text must be prefixed and suffixed by a space, that turns this into
       * "   x   ".
       */
      if (isTypedText(candidatePToken) && candidatePToken.subType === TYPE.SPACE) {
         let nextValue = this._peekValue();

         while (nextValue && isTypedText(nextValue) && nextValue.subType === TYPE.SPACE) {
            candidatePToken.text.merge(nextValue.text);
            this.values.shift();
            nextValue = this._peekValue();
         }
      }

      return candidatePToken;
   }

   ungetValue(value: UnassignedValue) {
      if (value) {
         this.values.unshift(value);
      }
   }

   _peekValue(): UnassignedValue {
      const pToken = this.values[0];
      if (!pToken || (pToken.type !== entityStart.PARAM_PTYPE &&
         pToken.type !== entityEnd.PARAM_PTYPE)) {
         return pToken;
      }

      const spaceToken = new SToken(' ', ' ',
         new Range(new EntityLocation(BLANK_ORIGIN), 0, 0, 0, 1, 0, 1));

      return spaceFromSToken(spaceToken);
   }
}

/**********************************************************************\
 Utility routines for some common operations
\**********************************************************************/

function wordFromSToken(sToken: SToken): SubtypedTextPToken {
   // Fighting with TypeScript
   const buildIt: any = text.PToken;
   const pToken = new buildIt({ text: sToken }) as SubtypedTextPToken

   pToken.subType = TYPE.WORD;
   return pToken;
}

function spaceFromSToken(sToken: SToken) {
   // Fighting with TypeScript
   const buildIt: any = text.PToken;
   const pToken = new buildIt({ text: sToken }) as SubtypedTextPToken

   pToken.subType = TYPE.SPACE;
   return pToken;
}

function makeCheckCallback(pToken: UnassignedPToken, propName: string, foundUnassigned: ({}) => void, otherwise: () => void): (values: UnassignedArray) => void {
   return (unassignedValues: UnassignedArray) => {
      if (unassignedValues) {
         pToken.nextPropName = propName;
         pToken.unassigned = unassignedValues;
         foundUnassigned(pToken);
         return;
      }

      otherwise();
   };
}

function getSTokens(unassignedArray: UnassignedArray) {
   let tokens: Array<SToken> = [];

   for (let index = 0; index < unassignedArray.length; index++) {
      const value = unassignedArray[index];

      if (isTypedText(value)) {
         tokens.push(value.text);
      } else if (isLiteral(value)) {
         tokens = tokens.concat(literal.getSTokens(value));
      } else if (value.type == 'PARAMETERENTITYREF') {
         tokens = tokens.concat(value.getSTokenArray());
      }
   }

   return tokens;
}

function checkExtra(values: UnassignedArray, ec: ErrorCollector, errorCode: string) {
   if (values && values.length > 0) {
      // convert the unassigned values into a set of STokens
      const sTokens = getSTokens(values);
      const firstToken = sTokens[0].clone();
      const originalFirst = sTokens.shift();

      ec.setPos(originalFirst);
      const unifiedSToken = sTokens.reduce((accumulation, sToken) => {
         accumulation.merge(sToken);
         return accumulation;
      }, firstToken);

      ec.report(errorCode, [ unifiedSToken.originalStr ]);
   }
}

const unassigned = {
   checkForPERef,
   parseNextValue,
   parseAllValues,
   assignToProps,
   wordFromSToken,
   spaceFromSToken,
   makeCheckCallback,
   getSTokens,
   checkExtra,
   isTypedText,
};

export default unassigned;

export {
   UnassignedArray,
   DescriptorArray,
   Descriptor,
};