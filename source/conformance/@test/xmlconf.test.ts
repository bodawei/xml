/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';
import { EntityLocation, EntityKind, EntityMetaData, XmlRevision, XmlVersion } from 'basic';
import { CheckWellFormed } from 'nodeStream';
import { PTokenStream } from 'pTokenStream';
import { PToken } from 'token';
import { PToXTokenStream, CheckXTokenValidStream } from 'xTokenStream';

import { TestDetails, buildTestDetails } from './helper/buildTestDetails';
import { gatherPTokens } from './helper/gatherPTokens';
import { gatherStrings } from './helper/gatherStrings';
import { makeAllDone } from './helper/makeAllDone';
import { TestSuite } from './helper/types';
import { TestExpanderStream } from './helper/TestExpanderStream';
import { XTokenToXmlStream } from './helper/XTokenToXmlStream';
import metadata from './data/xmlconf.json';
import { AttFixerStream } from 'nodeStream';
import { ContextType } from 'pToken';

function setUpStreams(test: TestDetails, ver: XmlVersion, rev: XmlRevision): Transform {
   const emd = new EntityMetaData(EntityKind.DOCUMENT, ver, rev, new EntityLocation(test.testPath));
   const pTokenStream = new PTokenStream(emd, { context: ContextType.DOCUMENT });
   const entityExpander = new TestExpanderStream(test, true);
   const attFix = new AttFixerStream();
   const checkWF = new CheckWellFormed();
   const toXToken = new PToXTokenStream();
   const checkValid = new CheckXTokenValidStream();

   pTokenStream.pipe(entityExpander).pipe(attFix).pipe(checkWF).pipe(toXToken).pipe(checkValid);

   pTokenStream.addText(test.testData || '');
   pTokenStream.endText();

   return checkValid;
}

describe('XML Conformance tests', () => {
   const allDetails = buildTestDetails(metadata as TestSuite);

   allDetails.forEach((testData) => {
      const ver = testData.VERSION ? (Number.parseFloat(testData.VERSION) as XmlVersion) : 1.0;
      const defaultRev: XmlRevision = ver === 1.0 ? 5 : 2;
      const editionString = testData.EDITION ? testData.EDITION : String(defaultRev);

      const allEditions = editionString
         .split(/ +/)
         .map((ver) => Number.parseInt(ver, 10) as XmlRevision);

      allEditions.forEach((edition) => {
         it(`${testData.ID} (${testData.TYPE}:${ver}/${edition}) ${testData.description}`, (done) => {
            const hasOutput = 'outputData' in testData;
            const testStream = setUpStreams(testData, ver, edition);
            const doneWhenAllDone = makeAllDone(hasOutput ? 2 : 1, done);

            // If the test details includes output, then we should test that the output matches
            if (hasOutput) {
               const toXmlStream = testStream.pipe(new XTokenToXmlStream());

               gatherStrings(toXmlStream, (results: Array<string>) => {
                  expect(results).toEqualNormalized(testData.outputData);
                  doneWhenAllDone();
               });
            }

            // We also want to test  whether the errors match as expected
            gatherPTokens(testStream, (results: Array<PToken>) => {
               const key = `V${ver}R${edition}`;
               let expectedError;

               if (testData.expectedError) {
                  expectedError = testData.expectedError[key] || testData.expectedError.default;

                  if (expectedError?.id === 'none') {
                     expectedError = undefined;
                  }
               }

               // console.log(
               //    'results',
               //    results.map((r) => r.type),
               // );
               // const actualErrors: Array<any> = results.filter(
               //    (token) => token.type === 'ERROR_TYPE' && (token as any).subtype !== 'WARNING',
               // ) as any;

               // const xxx = actualErrors.map((error) => `${error.id} : ${error.message}`);

               // console.log('-------------------');
               // console.log('ID>   ', testData.ID);
               // console.log('About>', testData.description);
               // console.log(testData.testData?.replace('\\r\\n', '\n').replace('\\n', '\n'));
               // console.log('---');
               // console.log(xxx.join('\n'));

               if (expectedError) {
                  expect(results).toHaveErrors([expectedError]);
               } else {
                  expect(results).not.toHaveErrors();
               }
               doneWhenAllDone();
            });
         });
      });
   });
});
