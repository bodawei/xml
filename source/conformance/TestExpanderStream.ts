import { Transform } from 'stream';

import { EntityLocation, EntityMetaData, EntityKind } from 'basic';
import { EntityExpander } from 'expand';
import { defaultExtractors } from 'extractor';
import { PTokenStream } from 'pTokenStream';
import { STokenSource } from 'sToken';
import { AttributeValuePToken, PToken, EntityValuePToken, ExternalId } from 'token';
import { PTokenFromLiteralStream } from 'pTokenStream';

import { TestDetails } from './types';

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

   // DO #2 need a type EntityValueElement
   pTokenStream.on('data', (token: PToken) => {
      results.push(token);
   });
   pTokenStream.on('end', () => {
      done(results);
   });
}

// DO #6 retrieve the external entity text for the specified path and filename
function findEntity(pName: string, name: string, resources: any): string {
   let result = '';

   if (!resources[pName]) {
      return result;
   });

   return result;
}

// DO #3 We need to actually load all the external entities into the xmlconf.json file
function retrieveExternalEntity(
   testDetails: TestDetails,
   externalId: ExternalId,
   entityMetaData: EntityMetaData,
): RetrieveResults {
   const parts = entityMetaData.location.systemId.match(/.*\/([Pp][0-9]+a?)\/[^\/]+/);
   const production = parts ? parts[1] : '';
   const systemInfo = externalId.system;
   let entityName = 'ERROR';

   if (systemInfo && systemInfo.value) {
      entityName = (systemInfo as any).value[0].text.str;
   }

   const emd = new EntityMetaData(
      EntityKind.EXTERNAL,  // Do we use the kind anywhere?
      entityMetaData.version,
      entityMetaData.revision,
      new EntityLocation(entityName),
   );

   const entityText = findEntity(production, entityName, testDetails);
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

// DO #4 expose AttributeValueResults and ReturnResults in some way
// DO #5 need an AttributValueElement type
function parseAttributeValue(
   sTokenSource: STokenSource,
   done: (results: AttributeValueResults) => void,
): void {
   const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: false, geRef: true });
   const results: AttributeValuePToken = [];

   pTokenStream.on('data', (token: PToken) => {
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
