/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Transform } from "stream";
import { EntityLocation, EntityKind, EntityMetaData } from "basic";
import { ERROR_TYPE } from "error";
import { CheckWellFormed } from "nodeStream";
import { PTokenStream } from "pTokenStream";
import { PToken } from "token";
import { PToXTokenStream, CheckXTokenValidStream } from "xTokenStream";

import { TestSuite, TestCases, Test, TestDetails } from "../types";
const metadata = require('../xmlconf.json');


// DO All of this should go into another routine which returns the sorted set of tests
const validTests: Array<TestDetails> = [];

function walkTest(test: Test, cases: Array<TestCases>, suite: TestSuite): void {
   // Pruning and inclusion goes here.

   if (test.TYPE === 'valid') {
      validTests.push({
         ...test,
         cases,
         suite
      });
   }
}

function walkCase(testCase: TestCases, parentCases: Array<TestCases>, suite: TestSuite): void {
   const allCases = [...parentCases, testCase];

   testCase.cases.forEach((testCase) => walkCase(testCase, allCases, suite));
   testCase.tests.forEach((test) => walkTest(test, allCases, suite));
}

function walkSuite(testSuite: TestSuite): void {
   testSuite.cases.forEach((testCase) => walkCase(testCase, [], testSuite));
}

walkSuite(metadata);

// DO This should just go into some basic test utility 'cause we do this so much
function gatherStream(stream: Transform, expect: (results: Array<PToken>) => void) {
   const cache: Array<PToken> = [];

   stream.on('data', (item: PToken) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);
   });
}


describe('XML Conformance tests', () => {

   describe('valid cases', () => {

      function setupValidTest(test: TestDetails) {
         const emd = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3, new EntityLocation(test.testPath));
         const pTokenStream = new PTokenStream(emd);
         const entityExpander = new IbmEntityExpanderStream(resources, true);
         const checkWF = new CheckWellFormed();
         const toXToken = new PToXTokenStream();
         const checkValid = new CheckXTokenValidStream();
   
         pTokenStream.pipe(entityExpander).pipe(checkWF).pipe(toXToken).pipe(checkValid);
         pTokenStream.addText(test.outputData || '');
         pTokenStream.endText();

         return checkValid;
      }

      validTests.forEach(testData => {

         it(`${testData.ID}`, (done) => {
            const checkValid = setupValidTest(testData);

            gatherStream(checkValid, (results: Array<PToken>) => {
               // DO Move the below into an expect handler.
               let errors: Array<any> = results.filter((token: any) => token.type === ERROR_TYPE && token.subtype !== 'WARNING');

               if (errors.length > 0) {
                  console.log(`Validation failure\n\t`);
                  // DO We can provide a lot more details from the test metadata
                  console.log(errors.map(item => `${item.id} : ${item.message}`).join('\n\t'));
               }

               expect(errors.length).toEqual(0);
               done();
            });

         });

         // For valid tests, also need to check output

      });

   });

});