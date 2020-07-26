/* Copyright ® 2020 by 柏大衛. All rights reserved. */

interface TestSuite {
   readonly type: 'TESTSUITE';
   readonly PROFILE?: string;
   readonly cases: Array<TestCases>;
}

interface TestCases {
   readonly type: 'TESTCASES';
   readonly PROFILE?: string;
   readonly 'xml:base'?: string;
   readonly cases: Array<TestCases>;
   readonly tests: Array<Test>;
   readonly entityPaths: {
      readonly [path: string]: {
         readonly [entityName: string]: string;
      };
   };
}

interface Test {
   readonly type: 'TEST';
   readonly ENTITIES: 'both' | 'none' | 'parameter' | 'general';
   readonly ID: string;
   readonly OUTPUT?: string;
   readonly SECTIONS: string;
   readonly RECOMMENDATION:
      | 'XML1.0'
      | 'XML1.1'
      | 'NS1.0'
      | 'NS1.1'
      | 'XML1.0-errata2e'
      | 'XML1.0-errata3e'
      | 'XML1.0-errata4e'
      | 'NS1.0-errata1e';
   readonly TYPE: 'valid' | 'invalid' | 'not-wf' | 'error';
   readonly VERSION?: string;
   readonly EDITION?: string;
   readonly URI: string;
   readonly NAMESPACE: 'yes' | 'no';
   readonly testPath: string;
   readonly testData?: string;
   readonly missingTestFile?: string; // if outputData is absent and outputPath was present, this has a message about why the data could not be found
   readonly outputPath?: string; // this is present if there was an OUTPUT attribute
   readonly outputData?: string;
   readonly missingOutputFile?: string; // if testData is absent, this is present
   readonly description: string;
}

interface ErrorDetails {
   readonly id: string;
   readonly message: string | RegExp | undefined;
}

interface TestDetails extends Test {
   readonly expectedError?: ErrorDetails;
   readonly cases: Array<TestCases>;
   readonly suite: TestSuite;
}

export { ErrorDetails, Test, TestCases, TestDetails, TestSuite };
