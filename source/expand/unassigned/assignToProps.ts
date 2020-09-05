/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { Range, EntityId } from 'basic';
import { SToken, strOrBlank } from 'sToken';
import { UnassignedArray, UnassignedValue, UnassignedType, spaceFromSToken } from 'token';

const BLANK_ORIGIN = 'https://www.w3.org/TR/xml/#as-PE';

type UnassignedPToken = {
   type: string;
   nextPropName?: string;
   extra?: UnassignedArray;
   unassigned?: UnassignedArray;
   peRefPlus: UnassignedArray;
};

type Descriptor = {
   name: string;
   type: string;
   allowed?: RegExp;
   flatten?: boolean;
};

type DescriptorArray = Array<Descriptor>;

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

   getNext(): UnassignedValue | undefined {
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

   ungetValue(value: UnassignedValue | undefined): void {
      if (value) {
         this.values.unshift(value);
      }
   }

   _peekValue(): UnassignedValue {
      const unassignedPToken = this.values[0];
      if (
         !unassignedPToken ||
         (unassignedPToken.type !== UnassignedType.ENTITY_START &&
            unassignedPToken.type !== UnassignedType.ENTITY_END)
      ) {
         return unassignedPToken;
      }

      const spaceToken = new SToken(
         ' ',
         ' ',
         new Range(new EntityId(BLANK_ORIGIN), 0, 0, 0, 1, 0, 1),
      );

      return spaceFromSToken(spaceToken);
   }
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

function findDescriptorsToUse(
   propertyDescriptors: DescriptorArray,
   pToken: UnassignedPToken | {},
   leftOff: string,
   cursor: UnassignedValueCursor,
): DescriptorArray {
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
            if (
               descriptor.type !== UnassignedType.SPACE &&
               nextValue.type === UnassignedType.SPACE
            ) {
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
function assignValues(
   propertyDescriptors: DescriptorArray,
   pToken: UnassignedPToken | {},
   cursor: UnassignedValueCursor,
): void {
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

function assignToProps(
   unassignedValues: UnassignedArray,
   pToken: UnassignedPToken | {},
   leftOff: string | void,
   propertyDescriptors: DescriptorArray,
): void {
   const valueCursor = new UnassignedValueCursor(unassignedValues);
   const allDescriptors = propertyDescriptors.slice(0);
   const startPropName = leftOff || propertyDescriptors[0].name;

   const descriptors = findDescriptorsToUse(allDescriptors, pToken, startPropName, valueCursor);

   assignValues(descriptors, pToken, valueCursor);
}

export { assignToProps };
