/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import XTokenToXmlStream from "./XmlTokenToXmlStream";

const { readFileSync } = require('fs');
const { Transform } = require('stream');
const { PToken } = require('../token');

const { EntityLocation, EntityMetaData, EntityKind } = require('../basic');
const { PTokenStream } = require('../pTokenStream');
const { PToXTokenStream, CheckXTokenValidStream } = require('../xTokenStream');
const { CheckWellFormed } = require('../stream');
const { EntityExpanderStream } = require('../stream/EntityExpanderStream');




class Outch extends Transform {
   constructor(alldone: any) {
      super({
         objectMode: true,
      });
      this.alldone = alldone;
   }

   _transform(chunk: any, _: string, done: () => void) {
      if (chunk == null) {
         this.alldone();
         return;
      }
      delete chunk.pToken;

      if (chunk.attributes) {
         chunk.attributes.forEach((item: any) => {
            delete item.pToken;
            if (item.value) {
               item.value.forEach((item: any) => {
                  delete item.pToken;
               });
            }
         });
      }

      console.log(JSON.stringify(chunk, undefined, 4));
      // console.log(chunk.type);
      done();
   }
}



function setup(pathName: string, done: any) {
   const emd = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3, new EntityLocation(pathName));
   const pTokenStream = new PTokenStream(emd);
   const entityExpander = new EntityExpanderStream(true);
   const checkWF = new CheckWellFormed();
   const toXToken = new PToXTokenStream();
   const checkValid = new CheckXTokenValidStream();
   const outch = new Outch(done);

   const data = readFileSync(pathName, { encoding: 'utf-8' });

   // console.log('data', data);
   pTokenStream.addText(data);
   pTokenStream.endText();

   pTokenStream.pipe(entityExpander).pipe(toXToken).pipe(outch);
};

fdescribe('www', () => {
   it('xyzzy', (done) => {
      setup('./source/@test/xmlconf/xmlconf.xml', done);
   });
});