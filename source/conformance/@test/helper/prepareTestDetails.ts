/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import {
   IdToErrorMap,
   expectedErrorCodes,
   expectedInvalidCodes,
   expectedNotWfCodes,
} from '../data/expectedCodes';
import { fixTest } from '../data/fixTest';
import { shouldSkipTest } from './shouldSkipTest';
import { ErrorDetails, Test, TestCases, TestDetails, TestSuite } from './types';

interface TestGroups {
   valid: Array<TestDetails>;
   invalid: Array<TestDetails>;
   notWf: Array<TestDetails>;
   error: Array<TestDetails>;
}

function constructErrorInfo(
   expected: IdToErrorMap | undefined,
   errorId: string,
): undefined | ErrorDetails {
   if (!expected?.[errorId]) {
      return undefined;
   }

   const entry = expected[errorId];
   const id = typeof entry === 'string' ? entry : entry.id;
   const message = typeof entry === 'string' ? undefined : entry.message;

   return {
      id,
      message,
   };
}

function buildDetails(
   test: Test,
   cases: Array<TestCases>,
   suite: TestSuite,
   expected?: IdToErrorMap,
): TestDetails {
   const newTest = fixTest(test);
   const expectedError: Record<string, ErrorDetails> = {};
   const def = constructErrorInfo(expected, test.ID);

   if (def) {
      expectedError.default = def;
   }

   for (const ver of [1.0, 1.1]) {
      for (const edition of [1, 2, 3, 4, 5, 6]) {
         const key = `V${ver}R${edition}`;
         const longKey = `${test.ID}--${key}`;
         const info = constructErrorInfo(expected, longKey);

         if (info) {
            expectedError[key] = info;
         }
      }
   }

   // Finally, make any uniform modifiactions to the test
   return {
      ...newTest,
      expectedError,
      cases,
      suite,
   };
}

function groupTest(
   test: Test,
   cases: Array<TestCases>,
   suite: TestSuite,
   groups: TestGroups,
): TestGroups {
   const newError: Array<TestDetails> = [];
   const newInvalid: Array<TestDetails> = [];
   const newNotWf: Array<TestDetails> = [];
   const newValid: Array<TestDetails> = [];

   // Do not run this test if we are wanting to skip it for some reason.
   if (shouldSkipTest(test)) {
      return groups;
   }

   switch (test.TYPE) {
      case 'valid':
         newValid.push(buildDetails(test, cases, suite));
         break;
      case 'invalid':
         newInvalid.push(buildDetails(test, cases, suite, expectedInvalidCodes));
         break;
      case 'not-wf':
         newNotWf.push(buildDetails(test, cases, suite, expectedNotWfCodes));
         break;
      case 'error':
         newError.push(buildDetails(test, cases, suite, expectedErrorCodes));
         break;
   }

   return {
      ...groups,
      error: [...groups.error, ...newError],
      invalid: [...groups.invalid, ...newInvalid],
      notWf: [...groups.notWf, ...newNotWf],
      valid: [...groups.valid, ...newValid],
   };
}

function walkCase(
   testCase: TestCases,
   parentCases: Array<TestCases>,
   suite: TestSuite,
   groups: TestGroups,
): TestGroups {
   const allCases = [...parentCases, testCase];

   const intermediateGroups = testCase.cases.reduce(
      (subGroups, testCase) => walkCase(testCase, allCases, suite, subGroups),
      groups,
   );

   return testCase.tests.reduce(
      (subGroups, test) => groupTest(test, allCases, suite, subGroups),
      intermediateGroups,
   );
}

function walkSuite(testSuite: TestSuite, groups: TestGroups): TestGroups {
   return testSuite.cases.reduce(
      (subGroups, testCase) => walkCase(testCase, [], testSuite, subGroups),
      groups,
   );
}

function prepareTestDetails(testData: TestSuite): Array<TestDetails> {
   const results = walkSuite(testData, {
      error: [],
      invalid: [],
      notWf: [],
      valid: [],
   });

   return [...results.valid, ...results.invalid, ...results.notWf, ...results.error];
}

export { TestDetails, TestGroups, prepareTestDetails };
