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
   if (testFilters.includedIds.includes(testData.ID)) {
      return true;
   }

   return testFilters.includedIds.length === 0;
}

function shouldSkipTest(testData: Test): boolean {
   return isExcluded(testData) || !isIncluded(testData);
}

export { shouldSkipTest };
