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
const makeStringTokenArray = testUtils.makeStringTokenArray;

const TEST_CHUNKS = [ new TextChunk.PlainChunk('from test') ];

function expectTokenTypes(tokenArray, typeArray) {
   if (tokenArray.length !== typeArray.length) {
      throw new Error('Lengths in expectTokenTypes() do not match: tokenArray.length=' + tokenArray.length + ', ' +
      'typeArray.length=' + typeArray.length);
   }

   for (let index = 0; index < tokenArray.length; index++) {
      const expectedDescription = `index ${index} (${typeArray[index].name})`;
      const actualDescription = `index ${index} (${tokenArray[index].constructor.name})`;

      expect(actualDescription).toEqual(expectedDescription);
   }
}

function expectTokenDetails(tokenArray, detailsArray) {
   if (tokenArray.length !== detailsArray.length) {
      throw new Error('Lengths in expectTokenDetails() do not match: tokenArray.length=' + tokenArray.length + ', ' +
      'detailsArray.length=' + detailsArray.length);
   }

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

function pipeAndTest(inputString, done, endHandler, other = {}) {
   const manager = other.manager;
   const errorHandler = other.errorHandler;
   const strictMode = other.strictMode;
   const entityMd = other.entityMd;

   const ts = makeLaxStream(inputString, entityMd);
   const es = new XmlEntityStream(manager || new XmlEntityManager(), {
      lax: !strictMode
   });
   const results = [];

   es.on('data', (token) => {
      results.push(token);
   });
   es.on('error', errorHandler || function errHandler(error) { throw error; });
   es.on('end', () => {
      endHandler(results);
      done();
   });

   ts.pipe(es);
}

describe('XmlEntityStream', () => {

   describe('construction', () => {

      it('throws an error if not passed an entity manager', () => {
         expect(() => {
            new XmlEntityStream();
         }).toThrowError('Must provide an XmlEntityManager instance.');
      });

   });

   describe('read()', () => {

      it('retrieves all the tokens from the underlying stream', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><one>data</one>');
         const es = new XmlEntityStream(new XmlEntityManager(), {
            lax: true
         });

         ts.pipe(es);
         let count = 0;
         es.on('readable', () => {
            switch (count) {
               case 0:
                  expect(es.read() instanceof tokens.XmlDeclaration).toEqual(true);
                  break;
               case 1:
                  expect(es.read() instanceof tokens.ElementStart).toEqual(true);
                  break;
               case 2:
                  expect(es.read() instanceof tokens.CharData).toEqual(true);
                  break;
               case 3:
                  expect(es.read() instanceof tokens.ElementEnd).toEqual(true);
                  done();
                  break;
               default:
                  break;
            }
            count++;
         });
      });

   });

   describe('on("data")', () => {

      it('retrieves all the tokens from the underlying stream', (done) => {
         pipeAndTest('<?xml version="1.0"?><one>data</one>', done, (results) => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.CharData,
               tokens.ElementEnd
            ]);
         });
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
         pipeAndTest('<?xml version="1.0"?><one>&amp;data</one>', done, (results) => {
            expect(results[2].haveEntityData).toEqual(true);
         });
      });

      it('inserts entity data after start and before end', (done) => {
         pipeAndTest('<?xml version="1.0"?><one>&quot;data</one>', done, (results) => {
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
         });
      });

      it('recognizes entities within entities', (done) => {
         const manager = new XmlEntityManager();
         manager.addEntity(new tokens.EntityDeclaration('l1', '<ch>&level2;</ch>', undefined, undefined, TEST_CHUNKS));
         manager.addEntity(new tokens.EntityDeclaration('level2', '&quot;&#x41;', undefined, undefined, TEST_CHUNKS));

         pipeAndTest('<?xml version="1.0"?><root>&l1;</root>', done, evaluate, { manager: manager });

         function evaluate(results) {
            expectTokenDetails(results, [ {
               constFunc: tokens.XmlDeclaration
            }, {
               constFunc: tokens.ElementStart,
               name: 'root'
            }, {
               constFunc: tokens.EntityStart,
               name: 'l1'
            }, {
               constFunc: tokens.ElementStart,
               name: 'ch'
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
               name: 'ch'
            }, {
               constFunc: tokens.EntityEnd,
               name: 'l1'
            }, {
               constFunc: tokens.ElementEnd,
               name: 'root'
            } ]);
         }
      });

      it('retrieves the expected chunks', (done) => {
         pipeAndTest('<?xml version="1.0"?><root>&lt;</root>', done, (results) => {
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
         });
      });

      it('adds an error to the stream if the entity is not found', (done) => {
         pipeAndTest('<?xml version="1.0"?><root>&bogus1;</root>', done, (results) => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               SyntaxError,
               tokens.EntityStart,
               tokens.EntityEnd,
               tokens.ElementEnd
            ]);

            expect(results[2].id).toEqual(SyntaxError.ID.REFERENCE_NO_DECLARATION);
            expect(results[2].message).toEqual('Missing declaration for entity "bogus1".');
         });
      });

      it('reports an error to the error handler in strict mode', (done) => {
         let gotError = false;
         pipeAndTest('<?xml version="1.0"?><root>&bogus101;</root>', done, evaluate, {
            errorHandler: errorHandler,
            strictMode: true
         });

         function errorHandler(error) {
            gotError = true;
            expect(error.id).toEqual(SyntaxError.ID.REFERENCE_NO_DECLARATION);
            expect(error.message).toEqual('Missing declaration for entity "bogus101".');
         }

         function evaluate(results) {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart
            ]);
            expect(gotError).toEqual(true);
         }
      });

      it('reports the place and context of the error', (done) => {
         const manager = new XmlEntityManager();
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5,
            new EntityLocation('theSystem', 'thePublic'));
         manager.addEntity(new tokens.EntityDeclaration('l1', '<ch>&level2;</ch>', undefined, undefined, TEST_CHUNKS));
         manager.addEntity(new tokens.EntityDeclaration('level2', '<!--bugNoEnd', undefined, undefined, TEST_CHUNKS));

         pipeAndTest('<?xml version="1.0"?><root>&l1;</root>', done, evaluate, {
            manager: manager,
            entityMd: entityMd
         });

         function evaluate(results) {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.EntityStart,
               tokens.ElementStart,
               tokens.EntityStart,
               SyntaxError,
               tokens.Comment,
               tokens.EntityEnd,
               tokens.ElementEnd,
               tokens.EntityEnd,
               tokens.ElementEnd
            ]);

            const token = results[5];
            expect(token.place).toEqual(new Offset(0, 12, 12));   // location of the point of the error after bugNoEnd
            expect(token.context).toEqual([ {
               offset: new Offset(0, 0, 0),  // location of start of comment in level2
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 4, 4),  // location of level2 reference in l1
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 27, 27),   // location of the l2 reference in document
               location: new EntityLocation('theSystem', 'thePublic')
            } ]);
         }
      });

      it('reports the place and context of the error in start of an entity reference', (done) => {
         const manager = new XmlEntityManager();
         manager.addEntity(new tokens.EntityDeclaration('l1', '<ch>&level2;</ch>', undefined, undefined, TEST_CHUNKS));
         manager.addEntity(new tokens.EntityDeclaration('level2', 'stuff&badRef;', undefined, undefined, TEST_CHUNKS));
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5,
            new EntityLocation('theSystem2', 'thePublic2'));
         pipeAndTest('<?xml version="1.0"?><root>&l1;</root>', done, evaluate, {
            manager: manager,
            entityMd: entityMd
         });

         function evaluate(results) {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.EntityStart,
               tokens.ElementStart,
               tokens.EntityStart,
               tokens.CharData,
               SyntaxError,
               tokens.EntityStart,
               tokens.EntityEnd,
               tokens.EntityEnd,
               tokens.ElementEnd,
               tokens.EntityEnd,
               tokens.ElementEnd
            ]);

            const token = results[6];
            expect(token.place).toEqual(new Offset(0, 5, 5));   // location of the point of the error after bugNoEnd
            expect(token.context).toEqual([ {
               offset: new Offset(0, 5, 5),  // location of start of comment in level2
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 4, 4),  // location of level2 reference in l1
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 27, 27),   // location of the l2 reference in document
               location: new EntityLocation('theSystem2', 'thePublic2')
            } ]);
         }
      });

      it('reports the place and context of the error in start of an element', (done) => {
         const manager = new XmlEntityManager();
         manager.addEntity(new tokens.EntityDeclaration('l1', '<ch>&level2;</ch>', undefined, undefined, TEST_CHUNKS));
         manager.addEntity(new tokens.EntityDeclaration('level2', 'stuff<bo\u0014gus>foo</bo\u0014gus>',
            undefined, undefined, TEST_CHUNKS));
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5,
            new EntityLocation('theSystem2', 'thePublic2'));
         pipeAndTest('<?xml version="1.0"?><root>&l1;</root>', done, evaluate, {
            manager: manager,
            entityMd: entityMd
         });

         function evaluate(results) {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.EntityStart,
               tokens.ElementStart,
               tokens.EntityStart,
               tokens.CharData,
               SyntaxError,
               tokens.ElementStart,
               tokens.CharData,
               SyntaxError,
               tokens.ElementEnd,
               tokens.EntityEnd,
               tokens.ElementEnd,
               tokens.EntityEnd,
               tokens.ElementEnd
            ]);

            const token = results[6];
            expect(token.place).toEqual(new Offset(0, 6, 6));   // location of the point of the error in the name
            expect(token.context).toEqual([ {
               offset: new Offset(0, 5, 5),  // location of start of comment in level2
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 4, 4),  // location of level2 reference in l1
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 27, 27),   // location of the l2 reference in document
               location: new EntityLocation('theSystem2', 'thePublic2')
            } ]);
         }
      });

   });

   describe('entity expansion in attributes', () => {

      it('does nothing when attribute is just text', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="bar"></one>', done, (results) => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            expect(results[1].attributes[0].value).toEqual([ new tokens.Text('bar', tokens.ATTR_NO_CHUNKS) ]);
         });
      });

      it('inserts text from entity', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&amp;"></one>', done, (results) => {
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
         });
      });

      it('does not mark the EntityStart token as having data if it is not found', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&bogus2;"></one>', done, (results) => {
            expect(results[2].attributes[0].value[0].haveEntityData).toEqual(false);
         });
      });

      it('adds an error to the stream if the entity is not found', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&bogus3;"></one>', done, (results) => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               SyntaxError,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            expect(results[1].id).toEqual(SyntaxError.ID.REFERENCE_NO_DECLARATION);
            expect(results[1].message).toEqual('Missing declaration for entity "bogus3".');
         });
      });

      it('reports an error to the error handler in strict mode', (done) => {
         let gotError = false;
         pipeAndTest('<?xml version="1.0"?><root foo="&bogus99;"></root>', done, evaluate, {
            errorHandler: errorHandler,
            strictMode: true
         });

         function errorHandler(error) {
            gotError = true;
            expect(error.id).toEqual(SyntaxError.ID.REFERENCE_NO_DECLARATION);
            expect(error.message).toEqual('Missing declaration for entity "bogus99".');
         }

         function evaluate(results) {
            expectTokenTypes(results, [
               tokens.XmlDeclaration
            ]);
            expect(gotError).toEqual(true);
         }
      });

      it('marks entity start as having data when the entity is defined', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&amp;"></one>', done, (results) => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            expect(results[1].attributes[0].value[0].haveEntityData).toEqual(true);
         });
      });

      it('inserts text from multiple entities in one attribute', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&amp;&amp;"></one>', done, (results) => {
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
         });
      });

      it('inserts text from multiple attributes', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&amp;&quot;" bar="&quot;&amp;"></one>', done, (results) => {
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
         });

      });

      it('recognizes entities within entities', (done) => {
         const manager = new XmlEntityManager();
         manager.addEntity(new tokens.EntityDeclaration('level1', '(&level2;)', undefined, undefined, TEST_CHUNKS));
         manager.addEntity(new tokens.EntityDeclaration('level2', '&quot;&#x41;', undefined, undefined, TEST_CHUNKS));

         pipeAndTest('<?xml version="1.0"?><root attr="&level1;">one</root>', done, evaluate, { manager: manager });

         function evaluate(results) {
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
         }
      });

      it('recognizes entities within entities inside of an empty element', (done) => {
         const manager = new XmlEntityManager();
         manager.addEntity(new tokens.EntityDeclaration('level1', '(&level2;)', undefined, undefined, TEST_CHUNKS));
         manager.addEntity(new tokens.EntityDeclaration('level2', '&quot;&#x41;', undefined, undefined, TEST_CHUNKS));

         pipeAndTest('<?xml version="1.0"?><root attr="&level1;"/>', done, evaluate, { manager: manager });

         function evaluate(results) {
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
         }
      });

      it('reports the place and context of the error', (done) => {
         const manager = new XmlEntityManager();
         manager.addEntity(new tokens.EntityDeclaration('l1', 'stuff&level2;', undefined, undefined, TEST_CHUNKS));
         manager.addEntity(new tokens.EntityDeclaration('level2', 'foo&badRef;', undefined, undefined, TEST_CHUNKS));

         pipeAndTest('<?xml version="1.0"?><root attr="&l1;"></root>', done, evaluate, {
            manager: manager,
            entityMd: new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 5, new EntityLocation('sys3', 'pub3'))
         });

         function evaluate(results) {
            const token = results[1];

            expect(token.place).toEqual(new Offset(0, 3, 3));   // location of the point of the error at &badRef;
            expect(token.context).toEqual([ {
               offset: new Offset(0, 3, 3),  // location of start of the bad ref in level2
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 5, 5),  // location of level2 reference in l1
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 21, 21),   // location of the root element start
               location: new EntityLocation('sys3', 'pub3')
            } ]);
         }
      });

   });

});
