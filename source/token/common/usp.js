/* Copyright ® 2017 by 柏大衛. All rights reserved. */

// import { Offset, Range } from '../../basic';
import { SToken } from '../../sToken';

import entityReference from '../entityReference.js';
import text from '../text.js';
import literal from './literal.js';

const TERMINATORS = [ '>', '"', '\'', '%' ];

/**********************************************************************\
 Unidentified Syntax Pieces
 This is used to extract certain items from an input stream. The
 intended use is after encountering a parameter entity reference in
 a declaration, anything that comes after it may be impossible to
 accurately assign to the other fields in the relevant PToken until
 we have expanded the parameter entity reference. When this happens
 we know that certain things can legitimately come after the PERef
 and before the closing ">". This includes:
   - space-terminated strings (words)
   - runs of space
   - literals
   - other parameter entity references
 This takes a set of options to specify what is potentially allowable,
 and will read in as many of the allowable things as possible until it
 encounters a ">" or something it is not allowed to recognize. It will
 then pass an array of all all that has been found: PTokens for the
 entity references, and PToken-like things:
   spaces: as a { type: text, space: SToken }
   word: as a { type: word, word: SToken }
   literal: as a { type: literal, openQuote, value, closeQuote }
\**********************************************************************/

function parse(source, options = {}, deliverUsp) {
   const result = [];

   extract(source, result, options, deliverUsp);
}

function extract(source, result, options, deliverUsp) {
   source.extract('space', (sToken) => {
      if (sToken) {
         result.push({ type: 'space', space: sToken });
      }

      source.extract('peekChar', (sToken) => {
         if (!sToken) {
            deliverUsp(result);
         } else {
            handleChar(sToken, source, result, options, deliverUsp);
         }
      });
   });
}

function handleChar(sToken, source, result, options, deliverUsp) {
   switch (sToken.text) {
      case '>':
         deliverUsp(result);
         break;
      case '%':
         entityReference.paramParse(source, (pToken) => {
            result.push(pToken);
            extract(source, result, options, deliverUsp);
         });
         break;
      case '"':
      case '\'':
         const container = { type: 'literal' };
         literal.parse(source, { pToken: container }, () => {
            result.push(container);
            extract(source, result, options, deliverUsp);
         });
         break;
      default:
         source.extract('word', TERMINATORS, (sToken) => {
            result.push({ type: 'word', word: sToken });
            extract(source, result, options, deliverUsp);
         });
         break;
   }
}

function checkForPERef(source, forValue, pTokenPart, deliverPTokenPart, otherwise) {
   source.extract('peekChar', (sToken) => {
      if (!sToken) {
         deliverPTokenPart(pTokenPart);
      } else if (sToken.text === '%') {
         parse(source, {}, (pieces) => {
            pTokenPart.leftOff = forValue;
            pTokenPart.incomplete = pieces;
            deliverPTokenPart(pTokenPart);
         });
      } else {
         otherwise();
      }
   });
}

// function getFirstRangeOf(item) {
//    if (!item) {
//       return;
//    }

//    switch (item.type) {
//       case 'word':
//          return item.word.firstRange;
//       case 'space':
//          return item.space.firstRange;
//       case 'literal':
//          return item.openQuote && item.openQuote.firstRange;
//       case entityReference.PARAM_PTOKEN:
//          return item.open && item.open.firstRange;
//    }
// }

// function getLastRangeOf(item) {
//    if (!item) {
//       return;
//    }

//    switch (item.type) {
//       case 'word':
//          return item.word.lastRange;
//       case 'space':
//          return item.space.lastRange;
//       case 'literal':
//          const tokens = literal.getSTokens(item);
//          return tokens.length > 0 ? tokens[tokens.length - 1].lastRange : undefined;
//       case entityReference.PARAM_PTOKEN:
//          const refTokens = item.getSTokenArray(item);
//          return refTokens.length > 0 ? refTokens[refTokens.length - 1].lastRange : undefined;
//    }
// }

/*
 * Given an array of unassigned values, return the next value.
 * We need to convert a couple special cases:
 *  - We do not want to return pestart and peend markers.
 *    Because in a declaration a parameter entity should be
 *    considered to be surrounded by spaces we convert these
 *    into spaces. They are marked as "optional", however, since
 *    if those spaces are not needed, we completely ignore them.
 *  - If there are a series of spaces in a row consolidate them
 *    into a single space. Imagine a peref inside of a peref
 *    inside a peref, where each starts with a space. We would
 *    end up with three spaces in a row that should, really,
 *    be considered a single space SToken.
 *
 * The standard says in section 4.4.8 that the parameter entity's
 * value must be be enlarged by the attachment of one leading and
 * one following space (#x20) character.
 * https://www.w3.org/TR/xml/#as-PE
 * This opts for something that is functionally equivalent, but
 * prefers to minimize the introduction of space characters to
 * only when there is not already some space in this location.
 */

// Make this a generator. wth
function getNextValue(prev, theArray) {
   for (let index = 0; index < prev.count || 0; index++) {
      theArray.shift();
   }

   if (theArray.length === 0) {
      return {
         count: 0,
         item: undefined,
      };
   }

   let candidate;
   let next = 0;

   // If the first item is a pestart or end, put an optional space in as a candidate
   switch (theArray[next].type) {
      case 'pestart':
      case 'peend':
         const textSToken = new text.PToken({ text: SToken.fromString(' ') });
         textSToken.type = 'space'; // ick
         textSToken.space = textSToken.text;
         textSToken.optional = true;
         candidate = textSToken;
         break;
      default:
         candidate = theArray[next];
         break;
   }
   next++;

   /*
    * If two+ spaces are side-by-side, remove the optional one, or merge
    * the two. This can happen fairly easily, even though the incomplete
    * parser will itself never produce two adjacent spaces. This is because
    * a parameter entity could start or end with a space, thus you could
    * have " startPeref endPeref ". Or you could have parameter entities
    * inside of parameter entities, each starting with spaces. That is, in
    * the worst case, you might have thousands of parameter entities
    * referenced, all of which only add spaces here.
    */
   if (candidate.type === 'space') {
      let newItem = candidate;

      while (theArray[next] && theArray[next].type === 'space') {
         const current = theArray[next];

         // skip the current one if it is optional, as we already have a space
         if (current.optional) {
            continue;
         }

         // If the last was optional, replace it with the current one.
         if (newItem.optional) {
            newItem = current;
            continue;
         }

         // if both the previous and the current are not optional, then merge them.
         newItem.text.merge(current);

         next++;
      }
      candidate = newItem;
   }
   // // Finally, add our best estimate of the range for any optional spaces.
   // for (let index = 1; index < normalized.length; index++) {
   //    const current = normalized[index];

   //    if (current.type === 'space' && current.optional) {
   //       const prevRange = getLastRangeOf(normalized[index - 1]);
   //       const nextRange = getFirstRangeOf(normalized[index + 1]);
   //       let offset;

   //       if (prevRange) {
   //          offset = prevRange.getLastOffset();
   //       } else if (nextRange) {
   //          offset = nextRange.getFirstOffset();
   //       }

   //       current.ranges = [ new Range(offset || new Offset()) ];
   //    }
   // }

   return {
      count: next,
      item: candidate,
   };
}

/*
 * Given the set of values (PTokens, and PToken-like things in the
 * unassignedValues array, find a place for as many of them as possible
 * in the PToken.
 * Start with the property where parsing left off and then look forward
 * in the set of property descriptors until we find one that matches
 * the next value in the unassignedValues.
 *
 * In a good case, we'll assign values to all the properties in the PToken.
 * In a bad case, only some of the PToken's properties will be assigned
 * (this routine will happily skip over properties if there is no
 * approprite value when it comes time to consider that property)
 * In the bad case, the set of unassigned values may not all be assigned.
 *
 * Another way to think about this: we can skip over properties, but
 * may not skip over  value in the unassignedValues array.
 *
 * Space handling can be particularly complicated. See the comments below.
 */
function assignToProps(unassignedValues, pToken, leftOff, propertyDescriptors) {
   let nextValue = getNextValue({}, unassignedValues);
   let index = 0;
   let prev;

   if (!nextValue.item) {
      return;
   }

   /*
    * Find the descriptor where processing left off.
    */

   leftOff = leftOff || propertyDescriptors[0].id;
   for (; index < propertyDescriptors.length; index++) {
      const descriptor = propertyDescriptors[index];

      // Identify the descriptor
      if (descriptor.id === leftOff) {
         /*
          * If the first value item is a space, but our descriptor isn't
          * a space, try to see if the value can be used immediately before
          * the match.
          * e.g.
          *    <!ENTITY % leadingSpace " SYSTEM 'http://somewhere.com'">
          *    <!ELEMENT foo %leadingSpace;>
          * The leading space really belongs with the space after foo.
          * Of course, it might also belong later on, in case a property was
          * not matched. However, our bias is to reproduce the parsing we
          * would have done if the PERef wasn't there.
          */
         if (descriptor.type !== 'space' && nextValue.item.type === 'space') {
            const prevWasSpace = prev && prev.type === 'space';

            if (prevWasSpace && !nextValue.item.optional) {
               if (pToken[prev.id]) {
                  pToken[prev.id].merge(nextValue.item.space);
               } else {
                  pToken[prev.id] = nextValue.item.space;
               }
            }

            if (prevWasSpace || nextValue.item.optional) {
               nextValue = getNextValue(nextValue, unassignedValues);
            }
         }

         break;
      }

      prev = descriptor;
   }

   // Now processs all the remaining descriptors
   for (; index < propertyDescriptors.length; index++) {
      const descriptor = propertyDescriptors[index];

      // If we've got an optional space and the descriptor is not a space, then ignore the space
      if (descriptor.type !== 'space' && nextValue.item.optional) {
         nextValue = getNextValue(nextValue, unassignedValues);
         if (!nextValue.item) {
            return;
         }
      }

      if (descriptor.type === nextValue.item.type) {
         // Don't use the value if it is an optional space and a space is not required here.
         if (!nextValue.item.optional || descriptor.required) {
            switch (nextValue.item.type) {
               case 'word':
                  pToken[descriptor.id] = nextValue.item.word;
                  break;
               case 'space':
                  pToken[descriptor.id] = nextValue.item.space;
                  break;
               default:
                  pToken[descriptor.id] = nextValue.item;
                  break;
            }
         }

         nextValue = getNextValue(nextValue, unassignedValues);
      }

      if (!nextValue.item) {
         return;
      }
   }
}

export {
   parse,
   checkForPERef,
   assignToProps,
};
