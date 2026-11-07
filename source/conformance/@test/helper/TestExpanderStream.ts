/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { basename, dirname, relative, resolve, join } from 'path';
import { Transform } from 'stream';

import { EntityId, ENTITY_ID } from 'basic';
import { EntityExpander, OpaqueEntityLoc, RetrieveResults, AttributeValueResults } from 'expand';
import { PTokenStream, PTokenLiteralStream } from 'node';
import { ParseType } from 'pToken';
import { STokenSource } from 'basic';
import {
   AttributeValueElement,
   AttributeValuePToken,
   PToken,
   EntityValuePToken,
   EntityValueElement,
} from 'token';

import { TestCases } from './types';
import { TestDetails } from './prepareTestDetails';

interface ResolvedInfo {
   testDetails: TestDetails;
   pathToEntity: string;
   entityId: EntityId;
}

function parseBody(
   sTokenSource: STokenSource,
   context: ParseType,
   expandToken: (token: PToken | undefined, tokenProcessed: () => void) => void,
): void {
   const pTokenStream = new PTokenStream(sTokenSource, {
      parseType: context,
   });
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
   const pTokenStream = new PTokenLiteralStream(sTokenSource, { peRef: true });
   const results: EntityValuePToken = [];

   pTokenStream.on('data', (token: EntityValueElement) => {
      results.push(token);
   });
   pTokenStream.on('end', () => {
      done(results);
   });
}

function findEntityContent(cases: Array<TestCases>, docDir: string, entitySubPath: string): string {
   const fullPath = resolve(docDir, entitySubPath);
   const fullTargetDir = dirname(fullPath);
   const name = basename(fullPath);
   const dir = `./${relative(process.cwd(), fullTargetDir)}`;

   // console.log('docDir', docDir);
   // console.log('entitySubPath', entitySubPath);
   // console.log('fullPath', fullPath);
   // console.log('fullTargetDir', fullTargetDir);
   // console.log('dir', dir);
   // console.log('name', name);

   for (const testcase of cases) {
      if (testcase.entityPaths[dir]?.[name]) {
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

function resolveEntityId(
   testDetails: TestDetails,
   baseEntity: EntityId | OpaqueEntityLoc,
   relativeEntity: EntityId,
): OpaqueEntityLoc {
   const entityName = relativeEntity.systemId;
   let pathToEntity: string;

   /*
    * Given a baseEntity and a relative Entity, compute the path
    * relative to the test details to find the entity.
    */
   if (baseEntity.type === ENTITY_ID) {
      // This is too simple for the completely general purpose case
      pathToEntity = './' + entityName;
   } else {
      const base = baseEntity as ResolvedInfo;

      // §4.2.2: relative URIs are relative to the location of the resource within which the entity declaration occurs
      // Implicitly, non-relative are not.  So are relative to the document entity.
      if (entityName.startsWith('.')) {
         const baseEntityDir = dirname(base.pathToEntity);
         pathToEntity = './' + join(baseEntityDir, entityName);
      } else {
         pathToEntity = './' + entityName;
      }
   }

   return {
      testDetails,
      pathToEntity,
      entityId: relativeEntity,
   };
}
function retrieveExternalEntity(entityLoc: OpaqueEntityLoc): RetrieveResults {
   const castEntity = entityLoc as ResolvedInfo;
   // console.log('>>>', baseEntity, relativeEntity);
   // console.log('RETRIEVE IN TEST EXPANDER', entityName, baseEntity, relativeEntity);
   const entityText = findEntity(castEntity.testDetails, castEntity.pathToEntity);
   // console.log('entityText', entityText, '\n');
   // Throw an error if we can't find the entity?

   const source = new STokenSource(castEntity.entityId);
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
   const pTokenStream = new PTokenLiteralStream(sTokenSource, { peRef: false, geRef: true });
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
         resolveEntityId: resolveEntityId.bind(undefined, testDetails),
         retrieveExternalEntity: retrieveExternalEntity,
         parseAttributeValue,
      });
   }

   _transform(token: PToken, encoding: string, done: () => void): void {
      this.entityExpander.expandPToken(token, done);
   }
}

export { TestExpanderStream };
