/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const Offset = require('./shared/Offset.js');
const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./shared/TextChunk.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlEntityStream = require('./XmlEntityStream.js');
const tokens = require('./XmlToken.js');

const testUtils = require('./XmlTokenStream-util.test.js');
const makeStrictStream = testUtils.makeStrictStream;
const makeLaxStream = testUtils.makeLaxStream;
const makeStrictExternalEntityStream = testUtils.makeStrictExternalEntityStream;
const makeStringTokenArray = testUtils.makeStringTokenArray;
const expectError = testUtils.expectError;
const ignoreToken = testUtils.ignoreToken;
const expectToken = testUtils.expectTokenType;

const TEST_CHUNKS = [ new TextChunk.PlainChunk('from test') ];

function expectTokenTypes(tokenArray, typeArray) {
   expect(tokenArray.length).toEqual(typeArray.length);

   for (let index = 0; index < tokenArray.length; index++) {
      const expectedDescription = `index ${index} (${typeArray[index].name})`;
      const actualDescription = `index ${index} (${tokenArray[index].constructor.name})`;

      expect(actualDescription).toEqual(expectedDescription);
   }
}

function expectTokenDetails(tokenArray, detailsArray) {
   expect(tokenArray.length).toEqual(detailsArray.length);

   for (let index = 0; index < tokenArray.length; index++) {
      for (const key in detailsArray[index]) {
         if (key === 'constFunc') {
            const expectedDescription = `index ${index} (${detailsArray[index].constFunc.name})`;
            const actualDescription = `index ${index} (${tokenArray[index].constructor.name})`;

            expect(expectedDescription).toEqual(actualDescription);
         } else {
            expect(tokenArray[index][key]).toEqual(detailsArray[index][key]);
         }
      }
   }
}

describe('XmlEntityStream', () => {

   describe('construction', () => {

      it('throws an error if not passed an entity manager', () => {
         expect(() => {
            new XmlEntityStream();
         }).toThrowError('Must provide an XmlEntityManager instance.');
      });

   });

   describe('on("data")', () => {

      it('retrieves all the tokens from the underlying stream', (done) => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>data</one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.CharData,
               tokens.ElementEnd
            ]);
            done();
         });

         ts.pipe(es);
      });

   });

   describe('on("error")', () => {

      it('does not reflect the error from the piped-from stream', (done) => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>data</two>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         let tsErrorOrder;
         let esErrorOrder;
         let orderCount = 1;
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expect(tsErrorOrder).toEqual(1);

            expect(esErrorOrder).toBeUndefined();

            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.CharData
            ]);
            done();
         });
         ts.on('error', () => {
            tsErrorOrder = orderCount;
            orderCount++;
         });
         es.on('error', () => {
            esErrorOrder = orderCount;
            orderCount++;
         });

         ts.pipe(es);
      });

      it('is ended after a terminal error in the underlying stream', (done) => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>data</two>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         let esFinished;

         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expect(esFinished).toEqual(true);

            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.CharData
            ]);
            done();
         });
         ts.on('error', () => {});
         es.on('error', () => {});
         es.on('finish', () => {
            esFinished = true;
         });

         ts.pipe(es);
      });

   });

   describe('on("end")', () => {

      it('is finished and ended automatically after piped-from stream is ended', (done) => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>data</one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         const endSequence = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.CharData,
               tokens.ElementEnd
            ]);

            expect(endSequence).toEqual([ 'tsEnd', 'tsFinish' ]);
            done();
         });
         ts.on('end', () => {
            endSequence.push('tsEnd');
         });
         es.on('finish', () => {
            endSequence.push('tsFinish');
         });

         ts.pipe(es);
      });

   });

   describe('entity expansion in content', () => {

      it('marks entity start as having data when the entity is defined', (done) => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&amp;data</one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expect(results[2].haveEntityData).toEqual(true);
            done();
         });

         ts.pipe(es);
      });

      it('inserts entity data after start and before end', (done) => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&quot;data</one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.EntityStart,
               tokens.CharData,
               tokens.EntityEnd,
               tokens.CharData,
               tokens.ElementEnd
            ]);

            expect(results[3].text).toEqual('"');
            done();
         });

         ts.pipe(es);
      });

      it('recognizes entities within entities', (done) => {
         const ts = makeStrictStream('<?xml version="1.0"?><root>&level1;</root>');
         const es = new XmlEntityStream(new XmlEntityManager());
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level1', '<child>&level2;</child>', undefined, undefined, TEST_CHUNKS));
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level2', '&quot;&#x41;', undefined, undefined, TEST_CHUNKS));
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenDetails(results, [ {
                  constFunc: tokens.XmlDeclaration
               }, {
                  constFunc: tokens.ElementStart,
                  name: 'root'
               }, {
                  constFunc: tokens.EntityStart,
                  name: 'level1'
               }, {
                  constFunc: tokens.ElementStart,
                  name: 'child'
               }, {
                  constFunc: tokens.EntityStart,
                  name: 'level2'
               }, {
                  constFunc: tokens.EntityStart,
                  name: 'quot'
               }, {
                  constFunc: tokens.CharData,
                  text: '"'
               }, {
                  constFunc: tokens.EntityEnd,
                  name: 'quot'
               }, {
                  constFunc: tokens.CharRef,
                  text: 'A'
               }, {
                  constFunc: tokens.EntityEnd,
                  name: 'level2'
               }, {
                  constFunc: tokens.ElementEnd,
                  name: 'child'
               }, {
                  constFunc: tokens.EntityEnd,
                  name: 'level1'
               }, {
                  constFunc: tokens.ElementEnd,
                  name: 'root'
               }
            ]);

            done();
         });

         ts.pipe(es);
      });

      it('retrieves the expected chunks', (done) => {
         const ts = makeStrictStream('<?xml version="1.0"?><root>&lt;</root>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd,
               tokens.ElementEnd
            ]);

            expect(results[3].chunks).toEqual(makeStringTokenArray([
               new TextChunk.PlainChunk('&'),
               new TextChunk.PlainChunk('#'),
               new TextChunk.DigitChunk('60', true),
               new TextChunk.PlainChunk(';')
            ]));
            done();
         });

         ts.pipe(es);
      });

      it('reports an error if the entity is not found', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><root>&bogus;</root>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('error', (error) => {
            expect(error.id).toEqual(SyntaxError.ID.REFERENCE_NO_DECLARATION);
            expect(error.message).toEqual('Missing declaration for entity "bogus".');
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.EntityStart,
               tokens.EntityEnd,
               tokens.ElementEnd
            ]);

            done();
         });

         ts.pipe(es);
      });

      xit('reports the place and context of the error', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><root>&level1;</root>',
            new EntityMetaData(undefined, undefined, undefined, new EntityLocation('systemId', 'publicId')));
         const es = new XmlEntityStream(new XmlEntityManager(), {
            lax: true
         });
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level1', '<child>&level2;</child>', undefined, undefined, TEST_CHUNKS));
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level2', '<!--bugNoEnd', undefined, undefined, TEST_CHUNKS));
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            const token = results[5];

            expect(token.place).toEqual(new Offset(0, 12, 12));
            expect(token.context).toEqual([ {
               offset: new Offset(0, 0, 0),
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 7, 7),
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 27, 27),
               location: new EntityLocation('systemId', 'publicId')
            } ]);

            done();
         });

         ts.pipe(es);
      });

   });

   describe('entity expansion in attributes', () => {

      it('does nothing when attribute is just text', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><one foo="bar"></one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            expect(results[1].attributes[0].value).toEqual([ new tokens.Text('bar', tokens.ATTR_NO_CHUNKS) ]);
            done();
         });

         ts.pipe(es);
      });

      it('inserts text from entity', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><one foo="&amp;"></one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            const attrPieces = results[1].attributes[0].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd
            ]);
            done();
         });

         ts.pipe(es);
      });

      xit('reports an error if an entity is not found', () => {
         const ts = makeLaxStream('<?xml version="1.0"?><one foo="&bogus;"></one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('error', (token) => {
            console.log('wtf')
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            expect(results[1].attributes[0].value[0].haveEntityData).toEqual(false);
            done();
         });

         ts.pipe(es);
      });

      it('marks entity start as having data when the entity is defined', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><one foo="&amp;"></one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            expect(results[1].attributes[0].value[0].haveEntityData).toEqual(true);

            done();
         });

         ts.pipe(es);
      });

      it('inserts text from multiple entities in one attribute', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><one foo="&amp;&amp;"></one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            const attrPieces = results[1].attributes[0].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd,
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd
            ]);
            done();
         });

         ts.pipe(es);
      });

      it('inserts text from multiple attributes', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><one foo="&amp;&quot;" bar="&quot;&amp;"></one>');
         const es = new XmlEntityStream(new XmlEntityManager());
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            let attrPieces = results[1].attributes[0].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd,
               tokens.EntityStart,
               tokens.CharData,
               tokens.EntityEnd
            ]);
            attrPieces = results[1].attributes[1].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharData,
               tokens.EntityEnd,
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd
            ]);
            done();
         });

         ts.pipe(es);
      });

      it('recognizes entities within entities', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><root attr="&level1;">one</root>');
         const es = new XmlEntityStream(new XmlEntityManager());
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level1', '(&level2;)', undefined, undefined, TEST_CHUNKS));
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level2', '&quot;&#x41;', undefined, undefined, TEST_CHUNKS));
         const results = [];
         es.on('data', (token) => {
            results.push(token);
         });
         es.on('end', () => {
            const attrPieces = results[1].attributes[0].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharData,
               tokens.EntityStart,
               tokens.EntityStart,
               tokens.CharData,
               tokens.EntityEnd,
               tokens.CharRef,
               tokens.EntityEnd,
               tokens.CharData,
               tokens.EntityEnd
            ]);
            done();
         });

         ts.pipe(es);
       });

   });

});
