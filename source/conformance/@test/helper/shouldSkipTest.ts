/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { testFilters } from '../data/testFilters';
import { Test } from './types';

function isExcluded(testData: Test): boolean {
   if (testFilters.excludedIds.includes(testData.ID)) {
      return true;
   }

   return false;
}

function isIncluded(testData: Test): boolean {
   return testFilters.includedIds.includes(testData.ID);
}

function shouldSkipTest(testData: Test): boolean {
   if (isIncluded(testData)) {
      return false;
   }

   const hasAnyIncludes = testFilters.includedIds.length !== 0;

   return isExcluded(testData) || hasAnyIncludes;
}

export { shouldSkipTest };
