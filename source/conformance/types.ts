interface TestSuite {
   type: 'TESTSUITE';
   PROFILE?: string;
   cases: Array<TestCases>;
}

interface TestCases {
   type: 'TESTCASES';
   PROFILE?: string;
   'xml:base'?: string;
   cases: Array<TestCases>;
   tests: Array<Test>;
   entityPaths: {
      [path: string]: {
         [entityName: string]: string;
      };
   };
}

interface Test {
   type: 'TEST';
   ENTITIES: 'both' | 'none' | 'parameter' | 'general';
   ID: string;
   OUTPUT?: string;
   SECTIONS: string;
   RECOMMENDTATION:
      | 'XML1.0'
      | 'XML1.1'
      | 'NS1.0'
      | 'NS1.1'
      | 'XML1.0-errata2e'
      | 'XML1.0-errata3e'
      | 'XML1.0-errata4e'
      | 'NS1.0-errata1e';
   TYPE: 'valid' | 'invalid' | 'not-wf' | 'error';
   VERSION?: string;
   EDITION?: string;
   URI: string;
   NAMESPACE: 'yes' | 'no';
   testPath: string;
   testData?: string;
   missingTestFile?: string; // if outputData is absent and outputPath was present, this has a message about why the data could not be found
   outputPath?: string; // this is present if there was an OUTPUT attribute
   outputData?: string;
   missingOutputFile?: string; // if testData is absent, this is present
   description: string;
}

interface TestDetails extends Test {
   cases: Array<TestCases>;
   suite: TestSuite;
}

export { Test, TestCases, TestDetails, TestSuite };
