/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, extname, relative, resolve, join } from 'path';
import { Transform } from 'stream';

import { EntityId, ConformanceVersion } from 'basic';
import { PTokenStream } from 'pTokenStream';
import { EntityExpanderStream } from 'nodeStream';
import { PToXTokenStream } from 'xTokenStream';
import SimpleObj from '../../source/simpleobj/so';
import { STokenSource } from 'sToken';
import { defaultExtractors } from 'extractor';

type ContentData = string | SimpleObjData;

type SimpleObjData = {
   type: string,
   attr: {
      [attrName: string]: string,
   },
   content: Array<ContentData>,
}

type RawTestSuite = {
   type: 'TESTSUITE',
   attr: {
      PROFILE?: string,
   },
   content: Array<RawTestCases>,
}

type RawTestCases = {
   type: 'TESTCASES',
   attr: {
      'xml:base'?: string,
      PROFILE?: string,
   },
   content: Array<RawTestCases | RawTest>,
}

type RawTest = {
   type: 'TEST',
   attr: {
      ENTITIES?: 'both' | 'none' | 'parameter' | 'general',
      ID: string,
      OUTPUT?: string,
      SECTIONS: string,
      RECOMMENDATION?: 'XML1.0'|'XML1.1'|'NS1.0'|'NS1.1'|'XML1.0-errata2e'|'XML1.0-errata3e'|'XML1.0-errata4e'|'NS1.0-errata1e',
      TYPE: 'valid'|'invalid'|'not-wf'|'error',
      VERSION?: string,
      EDITION?: string,
      URI: string,
      NAMESPACE?: 'yes'|'no',
      testPath: string,
      testData?: string,
      missingTestFile?: string, // if outputData is absent and outputPath was present, this has a message about why the data could not be found
      outputPath?: string,  // this is present if there was an OUTPUT attribute
      outputData?: string,
      missingOutputFile?: string,  // if testData is absent, this is present
   },
   content: Array<string | ContentData>, // Specifically EM and B
}

type TestSuite = {
   type: 'TESTSUITE',
   PROFILE?: string,
   cases: Array<TestCases>,
};

type TestCases = {
   type: 'TESTCASES',
   PROFILE?: string,
   'xml:base'?: string,
   cases: Array<TestCases>,
   tests: Array<Test>,
   entityPaths: {
      [path: string]: {
         [entityName: string]: string | undefined
      },
   }
};

type Test = {
   type: 'TEST',
   ENTITIES?: 'both' | 'none' | 'parameter' | 'general',
   ID: string,
   OUTPUT?: string,
   SECTIONS: string,
   RECOMMENDATION?: 'XML1.0'|'XML1.1'|'NS1.0'|'NS1.1'|'XML1.0-errata2e'|'XML1.0-errata3e'|'XML1.0-errata4e'|'NS1.0-errata1e',
   TYPE: 'valid'|'invalid'|'not-wf'|'error',
   VERSION?: string,
   EDITION?: string,
   URI: string,
   NAMESPACE?: 'yes'|'no',
   testPath: string,
   testData?: string,
   missingTestFile?: string, // if outputData is absent and outputPath was present, this has a message about why the data could not be found
   outputPath?: string,  // this is present if there was an OUTPUT attribute
   outputData?: string,
   missingOutputFile?: string,  // if testData is absent, this is present
   description: string,
};


/*
 * Given the SimpleObj version of the xmlconf.xml file, make several changes
 * to the data in the object. Return the result
 * 
 * Specifically, to each test this adds the following properties to the attributes
 *    testPath: string
 *    testData?: string
 *    missingOutputFile?: string  // if testData is absent, this is present
 *    outputPath?: string  // this is present if there was an OUTPUT attribute
 *    outputData?: string
 *    missingTestFile?: string // if outputData is absent and outputPath was present, this has a message about why the data could not be found
 * 
 * This also removes text strings from the content properties of test suite and test cases
 */
function addRelatedData(data: SimpleObjData, currentPath: string): RawTestSuite | RawTestCases | RawTest {
   let workingPath = currentPath;
   let result: SimpleObjData = {
      type: data.type,
      attr: { ...data.attr },
      content: [] as Array<any>, // we seem to need a wildcard here
   };

   switch (data.type) {
      case 'TESTSUITE':
         // Throw away any strings in the content, and process any objects
         data.content.forEach((item: ContentData) => {
            if (typeof item === 'object') {
               result.content.push(addRelatedData(item, workingPath) as any);
            }
         });
         return result as RawTestSuite;
      case 'TESTCASES':
         // xml:base is a partial path to the test data
         const basePath = `${currentPath}${data.attr['xml:base'] || ''}`;
         if (basePath.indexOf('ibm/xml-1.1/') !== -1) {
            return result as RawTestCases;
         }
   
         // Throw away any strings in the content, and process any objects
         data.content.forEach((item: ContentData) => {
            if (typeof item === 'object') {
               result.content.push(addRelatedData(item, basePath) as any);
            }
         });
         return result as RawTestCases;
      case 'TEST':
         try {
            let workPath = workingPath;
            // the eduni directory appears to be malformed!  Who actually ran these tests??
            if (workPath.indexOf('namespaces/misc') !== -1) {
               workPath = workPath.replace('namespaces/misc', 'misc');
            }             
            result.attr.testPath = `${workPath}${data.attr.URI || ''}`;
            result.attr.testData = readFileSync(result.attr.testPath, { encoding: 'utf-8' });

            // Oops. Some tests have other character sets
            if (result.attr.testData.indexOf('iso-8859-1') !== -1) {
               result.attr.testData = readFileSync(result.attr.testPath, { encoding: 'latin1' });
            }
         } catch (e) {
            result.attr.missingTestFile = e.message;
         }

         if (data.attr.OUTPUT) {
            try {
               result.attr.outputPath = `${workingPath}${data.attr.OUTPUT || ''}`;
               result.attr.outputData = readFileSync(result.attr.outputPath, { encoding: 'utf-8' });
            } catch (e) {
               result.attr.missingOutputFile = e.message;
            }
         }

         result.content = [ ...data.content ];
         return result as any;
      default:
         throw new Error(`Unknown token type "${data.type}" found`);
   }
}

/*
 * Converts the Raw value into a final object form
 */
function transform(data: RawTestSuite | RawTestCases | RawTest ): TestSuite | TestCases | Test {
   let result: TestSuite | TestCases | Test;

   switch (data.type) {
      case 'TESTSUITE':
         result = {
            type: 'TESTSUITE',
            ...data.attr,
            cases: data.content.map(transform as (item: RawTestCases) => TestCases),
         };
         return result as TestSuite;
      case 'TESTCASES':
         const testCases: TestCases = {
            type: 'TESTCASES',
            ...data.attr,
            tests: [],
            cases: [],
            entityPaths: {},
         };
         result = testCases;

         data.content.forEach((item: RawTestCases | RawTest) => {
            const newItem = transform(item);

            if (item.type === 'TEST') {
               testCases.tests.push(newItem as Test);
            } else {
               testCases.cases.push(newItem as TestCases);
            }
         });
         return testCases;
      case 'TEST':
         const test = {
            type: 'TEST',
            ...data.attr,
            description: '',
         } as Test;

         test.description = data.content.map((item: string | ContentData) => {
            if (typeof item === 'string') {
               return item.replace(/[\n ]+/g, ' ').trim();
            } else {
               if (item.type === 'EM') {
                  return `_${item.content[0]}_`;
               } else if (item.type === 'B') {
                  return `**${item.content[0]}**`;
               }
            }
         }).join('');
         return test;
   }
}

function addDirectory(pathToHere: string, testCases: TestCases, root: string): void {
   try {
      const dirEntries: Array<string> = readdirSync(pathToHere);

      dirEntries.forEach(entryName => {
         const extension = extname(entryName);
         const finalPath = resolve(pathToHere, entryName);
         const stats = statSync(finalPath);
         // The eduni directory in some cases suffixes all files with .xml, and in some cases has no extensions.
         const isEduni = pathToHere.indexOf('eduni') !== -1;

         // eduni puts some files in subfolders
         if (!stats.isFile()) {
            if (!isEduni) {
               return
            } else {
               addDirectory(finalPath, testCases, root);
               return;
            }
         } 

         if (extension === '.xml' && !isEduni) {
            return;
         }

         const testContent = readFileSync(finalPath, { encoding: 'utf-8' });
         const relativePath = (pathToHere[0] !== '.') ? './' + join(root, relative(root, pathToHere)) : pathToHere;

         testCases.entityPaths[relativePath] = testCases.entityPaths[relativePath] || {};
         testCases.entityPaths[relativePath][entryName] = testContent;
      });
   } catch (error) {
      console.log('error', error);
      // ignore this.  We know xmlconf/eduni/namespaces/misc does not exist. D'oh
   }
}

function addEntityPaths(root: string, data:TestSuite | TestCases | Test): TestSuite | TestCases | Test {
   switch (data.type) {
      case 'TESTSUITE':
         const testSuite: TestSuite = {
            ...data,
            cases: data.cases.map(addEntityPaths.bind(undefined, root) as (item: TestCases) => TestCases),
         };
         return testSuite;
      case 'TESTCASES':
         const testCases: TestCases = {
            ...data,
            cases: data.cases.map(addEntityPaths.bind(undefined, root) as (item: TestCases) => TestCases),
         };

         testCases.tests.forEach(test => {
            const dirPath = dirname(test.testPath);

            if (testCases.entityPaths[dirPath]) {
               return;
            }

            addDirectory(dirPath, testCases, root);
         });
         return testCases;
      case 'TEST':
         return { ...data };
   }
}

/*
 * This simple stream simply taks the output from the "SimpleObj" stream
 * (which is a single object representing the content of an XML document)
 * and does two things to it:
 *    1) Rearranges the data from a standard SimpleObj output, into a more
 *       natural format
 *    2) Inserts the related XML test data into the object.
 * 
 * See testcases.dtd in the xmlconf directory to see what the XML DTD is.
 */
class RefineObject extends Transform {
   private outfile: string;
   private root: string;

   constructor(root: string, outfile: string) {
      super({
         objectMode: true,
      });
      this.root = root;
      this.outfile = outfile;
   }

   _transform(chunk: SimpleObjData, _: string, done: () => void) {
      if (chunk == null) {
         return;
      }

      const augmented = addRelatedData(chunk, this.root);
      const transformed = transform(augmented);
      const populated = addEntityPaths(this.root, transformed);
      const str = JSON.stringify(populated, undefined, 2).replace(/\u0085/g, '\\u0085').replace(/\u2028/g, '\\u2028');
      writeFileSync(this.outfile, str, { encoding: 'utf-8' });
      done();
   }
}

/*
 * Set up the streams to convert from the XML document to the desired data format
 * and write as a JSON string
 */
function convertTestData(pathName: string, ouputDir: string) {
   const docPath = resolve(pathName, 'xmlconf.xml');
   const pTokenStream = new PTokenStream(new STokenSource(defaultExtractors), {
      confVer: new ConformanceVersion(1.0, 5),
      entityId: new EntityId(docPath),
   });
   const entityExpander = new EntityExpanderStream(true);
   const toXToken = new PToXTokenStream();
   const so = new SimpleObj();
   const writeJson = new RefineObject(pathName, ouputDir);
   const data = readFileSync(docPath, { encoding: 'utf-8' });

   pTokenStream.addText(data);
   pTokenStream.endText();

   pTokenStream.pipe(entityExpander).pipe(toXToken).pipe(so).pipe(writeJson);
};

/*
 * Call this as:
 *   ts-node <this-script> <path-to-xmlconf-dir> [<output-file>]
 */
const rootDir = process.argv[2];
const ouputDir = process.argv[3] || `${process.cwd()}/xmlconf.json`;
convertTestData(rootDir, ouputDir);
