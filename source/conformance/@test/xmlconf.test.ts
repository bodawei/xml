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

function setUpStreams(test: TestDetails): Transform {
   const ver = test.VERSION ? (Number.parseFloat(test.VERSION) as XmlVersion) : 1.0;
   const defaultRev: XmlRevision = ver === 1.0 ? 5 : 2;
   const rev = test.EDITION ? (Number.parseInt(test.EDITION, 10) as XmlRevision) : defaultRev;
   const emd = new EntityMetaData(EntityKind.DOCUMENT, ver, rev, new EntityLocation(test.testPath));
   const pTokenStream = new PTokenStream(emd);
   const entityExpander = new TestExpanderStream(test, true);
   const checkWF = new CheckWellFormed();
   const toXToken = new PToXTokenStream();
   const checkValid = new CheckXTokenValidStream();

   pTokenStream.pipe(entityExpander).pipe(checkWF).pipe(toXToken).pipe(checkValid);

   pTokenStream.addText(test.testData || '');
   pTokenStream.endText();

   return checkValid;
}

describe('XML Conformance tests', () => {
   const allDetails = buildTestDetails(metadata as TestSuite);

   allDetails.forEach((testData) => {
      it(`${testData.ID} (${testData.TYPE}) ${testData.description}`, (done) => {
         const hasOutput = 'outputData' in testData;
         const testStream = setUpStreams(testData);
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

            if (testData.expectedError) {
               expect(results).toHaveErrors([testData.expectedError]);
            } else {
               expect(results).not.toHaveErrors();
            }
            doneWhenAllDone();
         });
      });
   });
});
