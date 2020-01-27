/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { EntityLocation, Range } from 'basic';
import { ErrorCollector } from 'error';
import { SToken, STokenSource, strOrBlank } from 'sToken';

import { ParameterEntityReferencePToken, parseParameterEntityReference } from '../parameterEntityReference';
import { TextPToken } from '../text';
import literal, { LiteralPToken } from '../common/literal';

const TERMINATORS = [ '>', '"', '\'', '%' ];
const TERMINATORS_FOR_NAMELIST = [ '>', '"', '\'', '%', '(', ')', '|', ',', '+', '*', '?' ];
const IS_NAMELIST_CHARS = /[()|,+*?]/;
const BLANK_ORIGIN = 'https://www.w3.org/TR/xml/#as-PE';

enum UnassignedType {
   SPACE = 'space',
   WORD = 'word',
   LITERAL = 'literal',
   REFERENCE = 'reference',
   ENTITY_START = 'entityStart',
   ENTITY_END = 'entityEnd',
};

type UnassignedWord = {
   type: UnassignedType.WORD,
   token: TextPToken,
};

type UnassignedSpace = {
   type: UnassignedType.SPACE,
   token: TextPToken,
};

type UnassignedLiteral = {
   type: UnassignedType.LITERAL,
   token: LiteralPToken,
};

type UnassignedReference = {
   type: UnassignedType.REFERENCE,
   token: ParameterEntityReferencePToken,
};

type UnassignedStartEntity = {
   type: UnassignedType.ENTITY_START,
   token: ParameterEntityReferencePToken,
};

type UnassignedEndEntity = {
   type: UnassignedType.ENTITY_END,
   token: ParameterEntityReferencePToken,
};

type UnassignedValue = UnassignedSpace | UnassignedWord | UnassignedReference | UnassignedLiteral | UnassignedStartEntity | UnassignedEndEntity;
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
\**********************************************************************/

/**********************************************************************\
 Parse a single unassigned value and pass it (or nothing) back through
 the callback.
\**********************************************************************/

function parseNextValue(source: STokenSource, includeNameListChars: boolean, deliverValue: DeliverUnassigned) {
   source.extractNoParams('space', (sToken) => {
      if (sToken) {
         const pToken = spaceFromSToken(sToken);
         deliverValue(pToken);
         return;
      }

      source.extractNoParams('peekChar', (sToken) => {
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
         const pToken = wordFromSToken(sToken!); // typeFix: Because we peeked, this will always be not undefined
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
         parseParameterEntityReference(source, (reference: ParameterEntityReferencePToken | void) => {
            deliverValue({
               type: UnassignedType.REFERENCE,
               token: reference as ParameterEntityReferencePToken, // typeHack
            });
         });
         break;
      case '"':
      case '\'':
         const container: LiteralPToken = { } as LiteralPToken; // typeHack
         literal.parse(source, { pToken: container }, () => {
            const literal: UnassignedLiteral = {
               type: UnassignedType.LITERAL,
               token: container,
            }

            deliverValue(literal);
         });
         break;
      default:
         const terminators = includeNameListChars ? TERMINATORS_FOR_NAMELIST : TERMINATORS;

         source.extract('word', terminators, (sToken) => {
            const pToken = wordFromSToken(sToken!); // typeFix: Because we peeked, this will always be not undefined
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
   source.extractNoParams('peekChar', (sToken) => {
      if (!sToken || sToken.str !== '%') {
         deliverResult();
         return;
      }

      parseAllValues(source, false, deliverResult);
   });
}

function parseAllValues(source: STokenSource, includeNameListChars: boolean, deliverValues: DeliverUnassignedArray) {
   const values: UnassignedArray = [];

   function handleValue(value: UnassignedValue | void) {
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

function assignToProps(unassignedValues: UnassignedArray, pToken: UnassignedPToken|{}, leftOff: string | void, propertyDescriptors: DescriptorArray) {
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
         if (nextValue.type === 'word' || nextValue.type === 'space') {
            if (descriptor.type !== UnassignedType.SPACE && nextValue.type === UnassignedType.SPACE) {
               const prevWasSpace = prev && prev.type === UnassignedType.SPACE;
               const prevName = prev ? prev.name : '';
               const genericPToken: any = pToken;

               if (prevWasSpace) {
                  if (genericPToken[prevName]) {
                     genericPToken[prevName].merge(nextValue.token.text);
                  } else {
                     genericPToken[prevName] = nextValue.token.text;
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

/*
 * In general, this assumes if it is placing a property, that property is assumed to
 * be empty.  We don't verify.  An exception to this is spaces, since we frequently
 * want to be sure to consume a leading space in case that's what is on the unassigned
 * array.
 */
function assignValues(propertyDescriptors: DescriptorArray, pToken: UnassignedPToken|{}, cursor: UnassignedValueCursor) {
   for (let index = 0; index < propertyDescriptors.length; index++) {
      const nextValue = cursor.getNext();
      const descriptor = propertyDescriptors[index];
      const genericPToken: any = pToken;

      if (!nextValue) {
         return;
      }

      if (nextValue.type === descriptor.type) {
         switch (nextValue.type) {
            case UnassignedType.WORD:
               let canAssign = true;
               if (descriptor.allowed) {
                  const valueText = strOrBlank(nextValue.token.text);
                  canAssign = descriptor.allowed.test(valueText.toLocaleLowerCase());
               }

               if (canAssign) {
                  genericPToken[descriptor.name] = nextValue.token.text;
               } else {
                  cursor.ungetValue(nextValue);
               }
               break;
            case UnassignedType.SPACE:
               if (genericPToken[descriptor.name]) {
                  genericPToken[descriptor.name].merge(nextValue.token.text);
               } else {
                  genericPToken[descriptor.name] = nextValue.token.text;
               }
               break;
            case UnassignedType.LITERAL:
               if (descriptor.flatten) {
                  genericPToken.openQuote = nextValue.token.openQuote;
                  genericPToken.value = nextValue.token.value;
                  genericPToken.closeQuote = nextValue.token.closeQuote;
               } else {
                  genericPToken[descriptor.name] = nextValue.token;
               }
               break;
            // Other types won't get here. entity start and ends will have become spaces, and references will have been expanded
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

   getNext(): UnassignedValue | void {
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
      if (candidatePToken.type === 'space') {
         let nextValue = this._peekValue();

         while (nextValue && nextValue.type === 'space') {
            candidatePToken!.token.text!.merge(nextValue.token.text!); // ick
            this.values.shift();
            nextValue = this._peekValue();
         }
      }

      return candidatePToken;
   }

   ungetValue(value: UnassignedValue | void) {
      if (value) {
         this.values.unshift(value);
      }
   }

   _peekValue(): UnassignedValue {
      const unassignedPToken = this.values[0];
      if (!unassignedPToken || (unassignedPToken.type !== UnassignedType.ENTITY_START &&
         unassignedPToken.type !== UnassignedType.ENTITY_END)) {
         return unassignedPToken;
      }

      const spaceToken = new SToken(' ', ' ',
         new Range(new EntityLocation(BLANK_ORIGIN), 0, 0, 0, 1, 0, 1));

      return spaceFromSToken(spaceToken);
   }
}

/**********************************************************************\
 Utility routines for some common operations
\**********************************************************************/

function wordFromSToken(sToken: SToken): UnassignedWord {
   return {
      type: UnassignedType.WORD,
      token: new TextPToken({ text: sToken }),
   };
}

function spaceFromSToken(sToken: SToken): UnassignedSpace {
   return {
      type: UnassignedType.SPACE,
      token: new TextPToken({ text: sToken }),
   };
}

function makeCheckCallback(pToken: UnassignedPToken, propName: string, foundUnassigned: (pToken: any) => void, otherwise: () => void): DeliverUnassignedArray {
   return (unassignedValues?: UnassignedArray) => {
      if (unassignedValues) {
         pToken.nextPropName = propName;
         pToken.unassigned = unassignedValues;
         foundUnassigned(pToken);
         return;
      }

      otherwise();
   };
}

function parsePERefOrOrdinary(source: STokenSource, pToken: UnassignedPToken, propName: string, foundUnassigned: (pToken: any) => void, otherwise: () => void) {
   const callback = makeCheckCallback(pToken, propName, foundUnassigned, otherwise);

   checkForPERef(source, callback);
}

function getSTokens(unassignedArray: UnassignedArray) {
   let tokens: Array<SToken> = [];

   for (let index = 0; index < unassignedArray.length; index++) {
      const value = unassignedArray[index];

      if (value.type === 'word' || value.type === 'space') {
         tokens.push(value.token.text);
      } else if (value.type === 'literal') {
         tokens = tokens.concat(literal.getSTokens(value.token));
      } else if (value.type == 'reference') {
         tokens = tokens.concat(value.token.toSTokenArray());
      }
   }

   return tokens;
}

function checkExtra(values: UnassignedArray | void, ec: ErrorCollector, errorCode: string) {
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
   parsePERefOrOrdinary,
   makeCheckCallback,
   getSTokens,
   checkExtra,
};

export default unassigned;

export {
   UnassignedArray,
   UnassignedValue,
   UnassignedEndEntity,
   DescriptorArray,
   Descriptor,
   UnassignedType,
};