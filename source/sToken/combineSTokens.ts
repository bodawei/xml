/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Range, rangeEndOffset, rangeStartOffset } from 'basic';
import { offsetsAreEqual } from 'basic';
import SToken from './SToken';

function canFuseRanges(range1: Range, range2: Range) {
   const locationsSame = range1.entityId === range2.entityId;
   const locationsEqual =
      range1.entityId.systemId === range2.entityId.systemId &&
      range1.entityId.publicId === range2.entityId.publicId;

   if (locationsSame || locationsEqual) {
      return offsetsAreEqual(rangeEndOffset(range1), rangeStartOffset(range2));
   }

   return false;
}

function combineSTokens(first: SToken | undefined, other: SToken | undefined): SToken | undefined {
   if (!first) {
      return other;
   } else if (!other) {
      return first;
   }

   const str = first.str + other.str;
   const originalStr = first.originalStr + other.originalStr;
   const firstRanges = [...first.ranges];
   const otherRanges = [...other.ranges];

   if (first.lastRange && other.firstRange) {
      if (canFuseRanges(first.lastRange, other.firstRange)) {
         const lastRange = first.lastRange;
         const firstRange = other.firstRange;

         // Remove the last range of this and the first of the next
         firstRanges.pop();
         otherRanges.shift();

         // Create a new one which is the union of the two
         const newLastRange = new Range(
            lastRange.entityId,
            lastRange.startIndex,
            lastRange.startRow,
            lastRange.startColumn,
            firstRange.endIndex,
            firstRange.endRow,
            firstRange.endColumn,
         );

         // insert it in place of one of the originals.
         otherRanges.unshift(newLastRange);
      }
   }

   return new SToken(str, originalStr, [...firstRanges, ...otherRanges]);
}

export { combineSTokens };
