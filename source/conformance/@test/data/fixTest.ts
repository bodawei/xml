/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Test } from '../helper/types';

/*
 * Other fixes we have not yet incorporated
    // It looks to me like this test answer is wrong.
   ibmValidTests.P02['ibm02v01.xml'].output = ibmValidTests.P02['ibm02v01.xml'].output
      .replace('\n\n', '\n')
      .replace(/\n$/, '');
   // I don't think i-bs-abcd was valid even in 2003.
   ibmValidTests.P36['ibm36v01.xml'].input = ibmValidTests.P36['ibm36v01.xml'].input
      .replace('i-BS-ABCD', 'i-klingon');
   ibmValidTests.P36['ibm36v01.xml'].output = ibmValidTests.P36['ibm36v01.xml'].output
      .replace('i-BS-ABCD', 'i-klingon');

   // not-wf/P21/ibm21n02.xml thinks it is bad because of a bad CDEnd.  But I believe it is perfectly OK. This is an error because of case and placement, but not that.

   notWfTests.P02['ibm02n31.xml'].input = notWfTests.P02['ibm02n31.xml'].input
      .replace('���', String.fromCharCode(57343));
   notWfTests.P02['ibm02n30.xml'].input = notWfTests.P02['ibm02n30.xml'].input
      .replace('���', String.fromCharCode(55296));
*/

function fixTest(test: Test): Test {
   // if (test.testData?.toLowerCase().indexOf('<?xml') === -1 && test.ID !== 'sgml02') {
   //    return {
   //       ...test,
   //       testData: `<?xml version="1.0"?>${test.testData}`,
   //    };
   // }

   // rmt-004 and rmt-045 encode &#140; differently in their output data. I assume this is differences in the canonical XML standard between the two.
   // I'm not going to investigate that now, as this project is not embarking on writing a fully conformant Canonical XML formatter at this time.
   // so manhandle the result
   if (test.ID === 'rmt-044') {
      return {
         ...test,
         outputData: test.outputData?.replace('\u008c', '&#140;'),
      };
   }

   return test;
}

export { fixTest };
