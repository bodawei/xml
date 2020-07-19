/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Transform } from 'stream';
import { PToken } from 'token';

type PTokenArray = Array<PToken>;

import { IbmEntityExpanderStream} from './IbmEntityExpanderStream';

import { EntityLocation, EntityMetaData, EntityKind } from 'basic';
import { PTokenStream } from 'pTokenStream';
import { PToXTokenStream, CheckXTokenValidStream } from 'xTokenStream';
import { CheckWellFormed } from '../nodeStream';

import XTokenToXmlStream from './XmlTokenToXmlStream';

import validTests from './ibm-valid-10';
import valid11Tests from './ibm-valid-11';
import notWFTests from './ibm-not-wf';
import invalidTests from './ibm-invalid-10';
import { notWellFormedCodes, invalidErrorCodes } from './support/ibm/errorCodes';

type IbmTests = {
   [productionName: string]: {
      [testName: string]: {
         input: string,
         output: string,
      }
   }
}

type IbmErrorTests = {
   [productionName: string]: {
      [testName: string]: {
         input: string,
      }
   }
}

type IbmResources = {
   [productionName: string]: {
      [testName: string]: string
   }
}


const ibmValidTests: IbmTests = validTests.ibm.tests;
const ibmInvalidTests: IbmTests = invalidTests.ibm.tests;
const ibmValid11Tests: IbmTests = valid11Tests.ibm.tests;
const notWfTests: IbmErrorTests = notWFTests.ibm.tests;
const notWfResources: IbmResources = notWFTests.ibm.resources;

function fixTests() {
   // It looks to me like this test answer is wrong.
   ibmValidTests.P02['ibm02v01.xml'].output = ibmValidTests.P02['ibm02v01.xml'].output
      .replace('\n\n', '\n')
      .replace(/\n$/, '');
   // I don't think i-bs-abcd was valid even in 2003.
   ibmValidTests.P36['ibm36v01.xml'].input = ibmValidTests.P36['ibm36v01.xml'].input
      .replace('i-BS-ABCD', 'i-klingon');
   ibmValidTests.P36['ibm36v01.xml'].output = ibmValidTests.P36['ibm36v01.xml'].output
      .replace('i-BS-ABCD', 'i-klingon');
   // notWfTests.misc['ltinentval.xml'].input = notWfTests.misc['ltinentval.xml'].input
   //    .replace('<--*', '<!--*');
   notWfTests.misc['simpleltinentval.xml'].input = notWfTests.misc['simpleltinentval.xml'].input
      .replace('<--*', '<!--*');

   // 443 tests have this problem
   Object.keys(notWfTests).forEach(productionName => {
      Object.keys(notWfTests[productionName]).forEach(testName => {
         const testData = notWfTests[productionName][testName];
         if (testData.input.toLowerCase().indexOf('<?xml') === -1) {
            testData.input = '<?xml version="1.0"?>\n' + testData.input;
         }
      });
   });

   // 12 tests have this problem
   let count = 0;
   Object.keys(ibmValidTests).forEach(productionName => {
      Object.keys(ibmValidTests[productionName]).forEach(testName => {
         const testData = ibmValidTests[productionName][testName];
         if (testData.input.toLowerCase().indexOf('<?xml') === -1) {
            testData.input = '<?xml version="1.0"?>\n' + testData.input;
            count ++;
         }
      });
   });
   // console.log('COUNT', count);

   // not-wf/P21/ibm21n02.xml thinks it is bad because of a bad CDEnd.  But I believe it is perfectly OK. This is an error because of case and placement, but not that.

   notWfTests.P02['ibm02n31.xml'].input = notWfTests.P02['ibm02n31.xml'].input
      .replace('���', String.fromCharCode(57343));
   notWfTests.P02['ibm02n30.xml'].input = notWfTests.P02['ibm02n30.xml'].input
      .replace('���', String.fromCharCode(55296));
}

function gatherStream(stream: Transform, expect: (results: PTokenArray) => void) {
   const cache: PTokenArray = [];

   stream.on('data', (item: PToken) => {
      cache.push(item);
   });

   stream.on('end', () => {
      expect(cache);
   });
}

function skipTest(name: string, skips: Array<string>, includes: Array<string>) {
   if (skips.includes(name)) {
      return true;
   }

   if (includes.length === 0) {
      return false;
   }

   return !includes.includes(name);
}

function skipProduction(productionName: string, minProduction: number | void, maxProduction: number | void) {
   if (!minProduction && !maxProduction) {
      return false;
   }

   const min = minProduction || 0;
   const max = maxProduction || 1000;

   const matching = productionName.match(/[pP]([0-9]*)a?/);
   if (!matching) {
      return true;
   }

   const prodNum = parseInt(matching[1], 10);

   return (prodNum < min || prodNum > max);
}

// XML Conformance tests cover: Rev 2 and 3
describe('ibm tests', () => {
   let pTokenStream: PTokenStream;
   let checkWF: CheckWellFormed;
   let entityExpander: IbmEntityExpanderStream;
   let toXToken: PToXTokenStream;
   let checkValid: CheckXTokenValidStream;
   let toXml: XTokenToXmlStream;

   function setup(pathName: string, resources: IbmResources) {
      const emd = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3, new EntityLocation(pathName));
      pTokenStream = new PTokenStream(emd);
      entityExpander = new IbmEntityExpanderStream(resources, true);
      checkWF = new CheckWellFormed();
      toXToken = new PToXTokenStream();
      checkValid = new CheckXTokenValidStream();
      toXml = new XTokenToXmlStream();

      pTokenStream.pipe(entityExpander).pipe(checkWF).pipe(toXToken).pipe(checkValid).pipe(toXml);
   };

   function setupNotWF(pathName: string, resources: IbmResources) {
      const emd = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3, new EntityLocation(pathName));
      pTokenStream = new PTokenStream(emd);
      checkWF = new CheckWellFormed();
      entityExpander = new IbmEntityExpanderStream(resources, true);

      return pTokenStream.pipe(entityExpander).pipe(checkWF);
   };

   fixTests();

   Object.keys(ibmValidTests).forEach(productionName => {
      Object.keys(ibmValidTests[productionName]).forEach(testName => {
         const skipTests: Array<string> = [];
         const includeTests: Array<string> = [];

         if (skipTest(testName, skipTests, includeTests) || skipProduction(productionName)) {
            return;
         }

         it(`valid/${productionName}/${testName}`, (done) => {
            setup(`${__dirname}/xmlconf/ibm/valid/${productionName}/${testName}`, validTests.ibm.resources);
            const testData = ibmValidTests[productionName][testName];
            const expected = testData.output.replace(/&#10;/g, '\n').replace(/&#9;/g, '\t').replace(/&#13;/g, '\r');
            pTokenStream.addText(testData.input);
            pTokenStream.endText();

            gatherStream(checkValid, (results) => {
               let error = results.filter((token: any) => token.type === 'ERROR_TYPE' && token.subtype !== 'WARNING');

               if (error.length > 0) {
                  console.log(`valid/${productionName}/${testName} failed validity`);
                  console.log(error.map((item: any) => `${item.id} : ${item.message}`).join('\n\t'));
               }
               expect(error.length).toEqual(0);
            });

            gatherStream(toXml, (results) => {
               expect(results.join('')).toEqual(expected);
               done();
            });
         });

      });
   });

   Object.keys(notWfTests).forEach(productionName => {
      Object.keys(notWfTests[productionName]).forEach(testName => {
         const skipTests: Array<string> = [
            'ibm66n03.xml', // It is not clear if this is actually an error. If the entity were used, then it would be.  But it isn't, and it could as easily be a geref as a char ref.
         ];
         const includeTests: Array<string> = [];

         if (skipTest(testName, skipTests, includeTests) || skipProduction(productionName)) {
            return;
         }

         it(`not-wf/${productionName}/${testName}`, (done) => {
            const stream = setupNotWF(`${__dirname}/xmlconf/ibm/not-wf/${productionName}/${testName}`, notWfResources);
            const testData = notWfTests[productionName][testName];
            pTokenStream.addText(testData.input);
            pTokenStream.endText();

            gatherStream(stream, (results) => {
               let error = results.filter(token => (token as any).type === 'ERROR_TYPE' && (token as any).subtype === 'WELL_FORMED_ERROR');

               // console.log('results', JSON.stringify(results, undefined, 5) );
               // console.log('results', JSON.stringify(error, undefined, 5) );

               const match = (results as any).reduce((acc: boolean, err: any) => {
                  const entry = (notWellFormedCodes as any)[testName];
                  if (!entry) {
                     return acc;
                  }
                  const entryObj = typeof entry === 'string' ? { id: entry } : entry;
                  const idMatches = err.id === entryObj.id;
                  const msgMatch = entryObj.message ? entryObj.message.test(err.message) : true;
                  return acc || (idMatches && msgMatch);
               }, false);

               if (!match) {
                  if (error.length > 0) {
                     console.log(`===> not-wf/${productionName}/${testName}`);
                     console.log(error.map(item => `\t${(item as any).id}\n\t${(item as any).message}`).join('\n\t'));
                  }
               }

               expect(match).toEqual(true);
               done();
            });
         });
      });
   });


   function setupInvalidStreams(pathName: string, resources: IbmResources) {
      const emd = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3, new EntityLocation(pathName));
      pTokenStream = new PTokenStream(emd);
      entityExpander = new IbmEntityExpanderStream(resources, true);
      checkWF = new CheckWellFormed();
      toXToken = new PToXTokenStream();
      checkValid = new CheckXTokenValidStream();
      toXml = new XTokenToXmlStream();

      pTokenStream.pipe(entityExpander).pipe(checkWF).pipe(toXToken).pipe(checkValid).pipe(toXml);

      return {
         pTokenStream,
         checkValid,
      };
   };

   for (const productionName in ibmInvalidTests) {
      for (const testName in ibmInvalidTests[productionName]) {
         const skipTests: Array<string> = [];
         const includeTests: Array<string> = [  ];

         if (skipTest(testName, skipTests, includeTests) || skipProduction(productionName)) {
            continue;
         }

         it(`passes invalid/${productionName}/${testName}`, (done) => {
            const { pTokenStream, checkValid, } = setupInvalidStreams(`${__dirname}/xmlconf/ibm/invalid/${productionName}/${testName}`, invalidTests.ibm.resources);
            const testData = ibmInvalidTests[productionName][testName];
            pTokenStream.addText(testData.input);
            pTokenStream.endText();

            gatherStream(checkValid, (results) => {
               const errors = results.filter((token : any) => token.subtype === 'VALIDITY_ERROR')
               const foundError = errors.reduce((acc: boolean, err: any) => {
                     const entry = invalidErrorCodes[testName];

                     if (!entry) {
                        return acc;
                     }

                     const entryObj = typeof entry === 'string' ? { id: entry } : entry;
                     const idMatches = err.id === entryObj.id;
                     const msgMatch = entryObj.message ? entryObj.message.test(err.message) : true;

                     return acc || (idMatches && msgMatch);
                  }, false);

               // Report unexpected errors.
               if (!foundError) {
                  if (errors.length > 0) {
                     console.log(`For invalid/${productionName}/${testName} found these errors:`);
                     console.log(errors.map((item: any) => `${item.id} : ${item.message}`).join('\n\t'));
                  } else {
                     console.log(`For invalid/${productionName}/${testName} found no errors when we should have found ${invalidErrorCodes[testName]}`);
                  }
               }

               expect(foundError).toEqual(true);
               done();
            });
         });

      };
   };

});
