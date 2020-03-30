import { Transform } from 'stream';

import { Token } from 'basic';
import { EntityLocation, EntityMetaData, EntityKind } from 'basic';
import { PTokenStream } from 'pTokenStream';
import { STokenSource } from 'sToken';
import { EntityExpander, ExpandToken, STokenSourceProcessed, TokenProcessed } from '../expand/EntityExpander';
import { PTokenFromLiteralStream } from 'pTokenStream';
import { EntityValuePToken } from 'source/token/entityDeclaration';
import { defaultExtractors } from 'extractor';
import { ExternalId } from 'source/token/common/externalId';


function processBody(sTokenSource: STokenSource, inContent: boolean, expandToken: ExpandToken, done: STokenSourceProcessed) {
   const pTokenStream = new PTokenStream(sTokenSource);
   let seenEnd = false;
   let paused = false;

   (pTokenStream as any)._inContent = inContent;

   function checkit() {
      if (seenEnd && !paused) {
         done();
      }
   }

   pTokenStream.on('data', (token: Token) => {
      pTokenStream.pause();
      paused = true;
      expandToken(token as any, () => {
         paused = false;
         pTokenStream.resume();
         checkit();
      });
   });
   pTokenStream.on('end', () => {
      seenEnd = true;
      checkit();
   });
}

function processForEntityValue(sTokenSource: STokenSource, done: (result: EntityValuePToken) => void) {
   const pTokenStream = new PTokenFromLiteralStream(sTokenSource, { peRef: true });
   const results: EntityValuePToken = []

   pTokenStream.on('data', (token: Token) => {
      results.push(token as any);
   });
   pTokenStream.on('end', () => {
      done(results);
   });
}

function findEntity(pName: string, name: string, resources: any): string {
   let result: string = '';

   if (!resources[pName]) {
      return result;
   }
   return resources[pName][name];


   Object.keys(resources).forEach(res => {
      Object.keys(resources[res]).forEach(entName => {
         if (entName === name) {
            result = resources[res][entName];
         }
      });
   });

   return result;
}


function retrieveExternalEntity(resources: any, externalId: ExternalId, entityMetaData: EntityMetaData) {
   const parts = entityMetaData.location.systemId.match(/.*\/([Pp][0-9]+a?)\/[^\/]+/);
   const production = parts ? parts[1] : '';
   const systemInfo = externalId.system;
   // console.log('a', (systemInfo as any).value[0]);
   let entityName = 'ERROR';

   if (systemInfo && systemInfo.value) {
      entityName = (systemInfo as any).value[0].text.str;
   }

   // const lastIndex = entityMetaData.location.systemId.lastIndexOf('/');
   // const parentPath = entityMetaData.location.systemId.substring(0, lastIndex);
   // const startLocation = entityMetaData.location;
   // const newLocation = new EntityLocation((systemInfo as any).value[0].text.str);
   // newLocation.setBaseLocation(startLocation);

   const emd = new EntityMetaData(EntityKind.EXTERNAL, entityMetaData.version, entityMetaData.revision, new EntityLocation(entityName));

   const entity = findEntity(production, entityName, resources);
   // console.log('LOC =>', newLocation);
   // console.log('Ext =>', (externalId.system as any).value[0].text.str);
   // console.log('ent =>', entity);


   const source = new STokenSource(defaultExtractors, emd);
   if (entity) {
      source.addText(entity); // !placeholder-for-external-entity!');
   }
   source.endText();

   return source;
}

/**********************************************************************\
 An EntityExpanderStream is simply a stream wrapper around an
 EntityExpander.
\**********************************************************************/

class IbmEntityExpanderStream extends Transform {
   private entityExpander: EntityExpander;

   constructor(resources: any, validating: boolean) {
      super({
         objectMode: true,
      });

      this.entityExpander = new EntityExpander(validating, this.push.bind(this), {
         processBody,
         processForEntityValue,
         retrieveExternalEntity: retrieveExternalEntity.bind(undefined, resources),
      });
   }

   _transform(token: Token, encoding: string, done: TokenProcessed) {
      this.entityExpander.expandToken(token, done);
   }
}

export { IbmEntityExpanderStream };