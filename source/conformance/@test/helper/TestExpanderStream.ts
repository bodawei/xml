/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { dirname } from 'path';
import { Transform } from 'stream';

import { EntityLocation, EntityMetaData, EntityKind } from 'basic';
import { EntityExpander, RetrieveResults, AttributeValueResults } from 'expand';
import { defaultExtractors } from 'extractor';
import { PTokenStream } from 'pTokenStream';
import { STokenSource } from 'sToken';
import {
   AttributeValueElement,
   AttributeValuePToken,
   PToken,
   EntityValuePToken,
   EntityValueElement,
   ExternalId,
} from 'token';
import { PTokenFromLiteralStream } from 'pTokenStream';

import { TestCases } from './types';
import { TestDetails } from './buildTestDetails';

function parseBody(
   sTokenSource: STokenSource,
   inContent: boolean,
   expandToken: (token: PToken | undefined, tokenProcessed: () => void) => void,
): void {
   const pTokenStream = new PTokenStream(sTokenSource, inContent);
   let seenEnd = false;
   let paused = false;

   function checkIfThisCanEnd(): void {
      if (seenEnd && !paused) {
         expandToken(undefined, () => {
            // do nothing
         });
      }
   }

   pTokenStream.on('data', (token: PToken) => {
      pTokenStream.pause();
      paused = true;

      expandToken(token, () => {
         paused = false;
         pTokenStream.resume();
         // between when data arrives and expandToken() calls back, we may have
         // gotten an "end" event.  If so, respond to that.
         checkIfThisCanEnd();
      });
   });

   pTokenStream.on('end', () => {
      seenEnd = true;
      checkIfThisCanEnd();
   });
}

function parseEntityValue(
   sTokenSource: STokenSource,
   done: (result: EntityValuePToken) => void,
): void {
   const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
   const results: EntityValuePToken = [];

   pTokenStream.on('data', (token: EntityValueElement) => {
      results.push(token);
   });
   pTokenStream.on('end', () => {
      done(results);
   });
}

function findEntityContent(cases: Array<TestCases>, dir: string, name: string): string {
   for (const testcase of cases) {
      if (testcase.entityPaths[dir] && testcase.entityPaths[dir][name]) {
         return testcase.entityPaths[dir][name];
      }
   }

   for (const testcase of cases) {
      if (testcase.cases.length > 0) {
         const result = findEntityContent(testcase.cases, dir, name);

         if (result !== '') {
            return result;
         }
      }
   }

   return '';
}

function findEntity(testDetails: TestDetails, entityName: string): string {
   const testDir = dirname(testDetails.testPath);

   const entityContent = findEntityContent(testDetails.cases, testDir, entityName);

   return entityContent;
}

function retrieveExternalEntity(
   testDetails: TestDetails,
   externalId: ExternalId,
   entityMetaData: EntityMetaData,
): RetrieveResults {
   const systemInfo = externalId.system;
   let entityName = 'ERROR';

   if (systemInfo && systemInfo.value) {
      entityName = (systemInfo as any).value[0].text.str;
   }

   const emd = new EntityMetaData(
      EntityKind.EXTERNAL, // Do we use the kind anywhere?
      entityMetaData.version,
      entityMetaData.revision,
      new EntityLocation(entityName),
   );

   const entityText = findEntity(testDetails, entityName);
   // Throw an error if we can't find the entity?

   const source = new STokenSource(defaultExtractors, emd);
   source.addText(entityText);
   source.endText();

   return {
      sTokenSource: source,
      getErrors() {
         return [];
      },
   };
}

function parseAttributeValue(
   sTokenSource: STokenSource,
   done: (results: AttributeValueResults) => void,
): void {
   const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: false, geRef: true });
   const results: AttributeValuePToken = [];

   pTokenStream.on('data', (token: AttributeValueElement) => {
      results.push(token);
   });
   pTokenStream.on('end', () => {
      done({ newValue: results, errors: [] }); // Why no errors?
   });
}

class TestExpanderStream extends Transform {
   private entityExpander: EntityExpander;

   constructor(testDetails: TestDetails, validating: boolean) {
      super({
         objectMode: true,
      });

      this.entityExpander = new EntityExpander(validating, this.push.bind(this), {
         parseBody,
         parseEntityValue,
         retrieveExternalEntity: retrieveExternalEntity.bind(undefined, testDetails),
         parseAttributeValue,
      });
   }

   _transform(token: PToken, encoding: string, done: () => void): void {
      this.entityExpander.expandPToken(token, done);
   }
}

export { TestExpanderStream };
