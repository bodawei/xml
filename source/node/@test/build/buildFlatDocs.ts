/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { readFileSync, writeFileSync } from 'fs';

import { TestCases, TestSuite } from '../../../conformance/@test/helper/types';
import { TestDoc } from '../data/flatDocsTypes';

function walkCase(
   testCase: TestCases,
   parentCases: Array<TestCases>,
   suite: TestSuite,
   docs: Array<TestDoc>,
): Array<TestDoc> {
   const allCases = [...parentCases, testCase];

   const caseDocs = testCase.cases.reduce(
      (subDocs, testCase) => walkCase(testCase, allCases, suite, subDocs),
      docs,
   );

   return testCase.tests.reduce((subDocs, test) => {
      subDocs.push({
         id: test.ID,
         version: test.VERSION,
         edition: test.EDITION,
         doc: test.testData || '',
      });
      return subDocs;
   }, caseDocs);
}

function walkSuite(testSuite: TestSuite, docs: Array<TestDoc>): Array<TestDoc> {
   return testSuite.cases.reduce(
      (subGroups, testCase) => walkCase(testCase, [], testSuite, subGroups),
      docs,
   );
}

function convertTestData(pathName: string, ouputDir: string) {
   const data = readFileSync(pathName, { encoding: 'utf-8' });

   const tests = walkSuite(JSON.parse(data), []);

   writeFileSync(ouputDir, JSON.stringify(tests, undefined, 3));
}

/*
 * Call this as:
 *   ts-node <this-script> <path-to-xmlconf-dir> [<output-file>]
 */
const rootDir = process.argv[2];
const ouputDir = process.argv[3];
convertTestData(rootDir, ouputDir);
