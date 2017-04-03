/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const Offset = require('./shared/Offset.js');
const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./shared/TextChunk.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const EntityExpandingStream = require('./EntityExpandingStream.js');
const tokens = require('./XmlToken.js');

const testUtils = require('./XmlTokenStream-util.test.js');
const makeStrictStream = testUtils.makeStrictStream;
const makeLaxStream = testUtils.makeLaxStream;
const makeStringTokenArray = testUtils.makeStringTokenArray;

const TEST_CHUNKS = [ new TextChunk.PlainChunk('from test') ];

function expectLengthsMatch(fnName, aName, bName, actual, expected) {
   if (expected === actual) {
      return;
   }

   const expectedMsg = `Lengths in ${fnName}(): ${aName}.length=${expected}, ${bName}.length=${expected}`;
   const actualMsg = `Lengths in ${fnName}(): ${aName}.length=${actual}, ${bName}.length=${expected}`;

   expect(expectedMsg).toEqual(actualMsg);
}

function expectTokenTypes(tokenArray, expectedTypes) {
   expectLengthsMatch('expectTokenTypes', 'expectedTypes', 'actualTypes', expectedTypes.length, expectedTypes.length);

   for (let index = 0; index < tokenArray.length; index++) {
      const expectedDescription = `index ${index} (${expectedTypes[index].name})`;
      const actualDescription = `index ${index} (${tokenArray[index].constructor.name})`;

      expect(actualDescription).toEqual(expectedDescription);
   }
}

function expectTokenDetails(tokenArray, detailsArray) {
   expectLengthsMatch('expectTokenDetails', 'tokenArray', 'detailsArray', tokenArray.length, detailsArray.length);

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
   const es = new EntityExpandingStream({
      manager: manager,
      lax: !strictMode
   });
   const results = [];

   es.on('data', (token) => {
      results.push(token);
   });
   es.on('error', errorHandler || function errHandler(error) { throw error; });
   es.on('end', () => {
      try {
         endHandler(results);
      } finally {
         done();
      }
   });

   ts.pipe(es);
}

function makeToken(name, text, location, notationName) {
   return new tokens.EntityDeclaration(name, [ new tokens.Text(text, tokens.ATTR_NO_CHUNKS) ], location, notationName,
      TEST_CHUNKS);
}

describe('EntityExpandingStream', () => {

   describe('construction', () => {

      it('throws an error if not passed an entity manager', () => {
         expect(() => {
            new EntityExpandingStream({ manager: {} });
         }).toThrowError('Must provide an XmlEntityManager instance.');
      });

      it('does not care if no entity manager is passed at all', () => {
         expect(() => {
            new EntityExpandingStream();
         }).not.toThrow();
      });

      // tests below implicitly test whether the passed in manager is used at all
      it('does not throw an error if an entity manager is passed', () => {
         expect(() => {
            new EntityExpandingStream({ manager: new XmlEntityManager() });
         }).not.toThrow();
      });

   });

   describe('read()', () => {

      it('retrieves all the tokens from the underlying stream', (done) => {
         const ts = makeLaxStream('<?xml version="1.0"?><one>data</one>');
         const es = new EntityExpandingStream({
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
         const es = new EntityExpandingStream();
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
         const es = new EntityExpandingStream();
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
         const es = new EntityExpandingStream();
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

      it('replaces an entity reference with an entity start', (done) => {
         pipeAndTest('<?xml version="1.0"?><one>&amp;data</one>', done, (results) => {
            expect(results[2] instanceof tokens.EntityStart).toEqual(true);
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
         manager.addEntity(makeToken('l1', '<ch>&level2;</ch>'));
         manager.addEntity(makeToken('level2', '&quot;&#x41;'));

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
               tokens.EntityReference,
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
         manager.addEntity(makeToken('l1', '<ch>&level2;</ch>'));
         manager.addEntity(makeToken('level2', '<!--bugNoEnd'));

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
         manager.addEntity(makeToken('l1', '<ch>&level2;</ch>'));
         manager.addEntity(makeToken('level2', 'stuff&badRef;'));
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
               tokens.EntityReference,
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
         manager.addEntity(makeToken('l1', '<ch>&level2;</ch>'));
         manager.addEntity(makeToken('level2', 'stuff<bo\u0014gus>foo</bo\u0014gus>'));
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

      it('does not change the entity reference to an entity start if the data is not found', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&bogus2;"></one>', done, (results) => {
            expect(results[2].attributes[0].value[0] instanceof tokens.EntityReference).toEqual(true);
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

      it('does not replace the entity reference with an entity start/end pair if entity not found', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&bogus3;"></one>', done, (results) => {
            expectTokenTypes(results[2].attributes[0].value, [
               tokens.EntityReference
            ]);
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

      it('changes the entity reference to an entity start', (done) => {
         pipeAndTest('<?xml version="1.0"?><one foo="&amp;"></one>', done, (results) => {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.ElementStart,
               tokens.ElementEnd
            ]);

            expect(results[1].attributes[0].value[0] instanceof tokens.EntityStart).toEqual(true);
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
         manager.addEntity(makeToken('level1', '(&level2;)'));
         manager.addEntity(makeToken('level2', '&quot;&#x41;'));

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
         manager.addEntity(makeToken('level1', '(&level2;)'));
         manager.addEntity(makeToken('level2', '&quot;&#x41;'));

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
         manager.addEntity(makeToken('l1', 'stuff&level2;'));
         manager.addEntity(makeToken('level2', 'foo&badRef;'));

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

   describe('entities from internal subset', () => {

      it('replaces an entity reference with an entity start', (done) => {
         const input = `<?xml version="1.0"?>
            <!DOCTYPE one [<!ENTITY testEntity "testValue">]><one>&testEntity;data</one>`;

         pipeAndTest(input, done, (results) => {
            expect(results[9].text).toEqual('testValue');
         });
      });

      it('ignores entity declarations outside the DTD', (done) => {
         const input = '<?xml version="1.0"?><!ENTITY testEntity "testValue"><one>&testEntity;data</one>';

         pipeAndTest(input, done, (results) => {
            expect(results[5] instanceof tokens.EntityReference).toEqual(true);
         });
      });

   });

   describe('parameter entity expansion in entity values', () => {

      it('does nothing when entity value is just text', (done) => {
         const manager = new XmlEntityManager();
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5,
            new EntityLocation('theSystem', 'thePublic'));
         pipeAndTest('<!ENTITY myEntity "bar">', done, checkResults, {
            manager: manager,
            entityMd: entityMd
         });

         function checkResults(results) {
            expectTokenTypes(results, [
               tokens.EntityDeclaration
            ]);

            expect(results[0].value).toEqual([ new tokens.Text('bar', tokens.ATTR_NO_CHUNKS) ]);
         }
      });

      it('does not expand general entity references in the entity value', (done) => {
         const manager = new XmlEntityManager();
         manager.addEntity(makeToken('l1', 'this is a test'));
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5,
            new EntityLocation('theSystem', 'thePublic'));
         pipeAndTest('<!ENTITY myEntity "&l1;">', done, checkResults, {
            manager: manager,
            entityMd: entityMd
         });

         function checkResults(results) {
            expectTokenTypes(results, [
               tokens.EntityDeclaration
            ]);

            expect(results[0].value).toEqual([ new tokens.Text('&l1;', tokens.ATTR_NO_CHUNKS) ]);
         }
      });

      it('expands parameter entity references', (done) => {
         const manager = new XmlEntityManager();
         manager.addParameterEntity(makeToken('pe', 'I am a parameter entity'));
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5,
            new EntityLocation('theSystem', 'thePublic'));
         pipeAndTest('<!ENTITY myEntity "%pe;">', done, checkResults, {
            manager: manager,
            entityMd: entityMd
         });

         function checkResults(results) {
            expectTokenTypes(results, [
               tokens.EntityDeclaration
            ]);

            expectTokenTypes(results[0].value, [
               tokens.EntityStart,
               tokens.CharData,
               tokens.EntityEnd
            ]);

            expect(results[0].value[1].text).toEqual('I am a parameter entity');
         }
      });

      it('reports errors found when expanding parameter entity references', (done) => {
         const manager = new XmlEntityManager();
         manager.addParameterEntity(makeToken('pe', 'I am a parameter entity with an error &# 65;'));
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5,
            new EntityLocation('theSystem', 'thePublic'));
         pipeAndTest('<!ENTITY myEntity "%pe;">', done, checkResults, {
            manager: manager,
            entityMd: entityMd
         });

         function checkResults(results) {
            expectTokenTypes(results, [
               SyntaxError,
               tokens.EntityDeclaration
            ]);

            expectTokenTypes(results[1].value, [
               tokens.EntityStart,
               tokens.CharData,
               tokens.CharRef,
               tokens.EntityEnd
            ]);
         }
      });

//      it('expands parameter entity references insider of references', (done) => {
//         const manager = new XmlEntityManager();
//         manager.addParameterEntity(makeToken('pe1', 'First level entity %pe2;'));
//         manager.addParameterEntity(makeToken('pe2', '(second level entity)'));
//         const entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5,
//            new EntityLocation('theSystem', 'thePublic'));
//         pipeAndTest('<!ENTITY myEntity "%pe;">', done, checkResults, {
//            manager: manager,
//            entityMd: entityMd
//         });
//
//         function checkResults(results) {
//            expectTokenTypes(results, [
//               tokens.EntityDeclaration
//            ]);
//
//            expectTokenTypes(results[0].value, [
//               tokens.EntityStart,
//               tokens.CharData,
//               tokens.EntityEnd
//            ]);
//
//            expect(results[0].value[1].text).toEqual('I am a parameter entity');
//         };
//      });

   });

   describe('entity expansion in attribute lists', () => {
      let entityMd;

      beforeEach(() => {
         entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5,
            new EntityLocation('', undefined));
      });

      it('does nothing when attribute defaults are just text', (done) => {
         pipeAndTest('<!ATTLIST one attr CDATA "one">', done, checkResults, { entityMd });

         function checkResults(results) {
            expectTokenTypes(results, [
               tokens.AttrListDeclaration
            ]);

            expect(results[0].attributes[0].value).toEqual([ new tokens.Text('one', tokens.ATTR_NO_CHUNKS) ]);
         }
      });

      it('inserts a char reference from entity', (done) => {
         pipeAndTest('<!ATTLIST one attr CDATA "&amp;">', done, checkResults, { entityMd });

         function checkResults(results) {
            const attrPieces = results[0].attributes[0].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd
            ]);

            expect(results[0].attributes[0].value[1].text).toEqual('&');
         }
      });

      it('does not change the entity reference to an entity start if the data is not found', (done) => {
         pipeAndTest('<!ATTLIST one attr CDATA "&bogus;">', done, checkResults, { entityMd });

         function checkResults(results) {
            const attrPieces = results[1].attributes[0].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityReference
            ]);
         }
      });

      it('adds an error to the stream if the entity is not found', (done) => {
         pipeAndTest('<!ATTLIST one attr CDATA "&bogus3;">', done, checkResults, { entityMd });

         function checkResults(results) {
            expectTokenTypes(results, [
               SyntaxError,
               tokens.AttrListDeclaration
            ]);

            expect(results[0].id).toEqual(SyntaxError.ID.REFERENCE_NO_DECLARATION);
            expect(results[0].message).toEqual('Missing declaration for entity "bogus3".');
         }
      });

      it('inserts text from multiple entities in one attribute', (done) => {
         pipeAndTest('<!ATTLIST one attr CDATA "&amp;&amp;">', done, checkResults, { entityMd });

         function checkResults(results) {
            const attrPieces = results[0].attributes[0].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd,
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd
            ]);
         }
      });

      it('inserts text from multiple attributes', (done) => {
         pipeAndTest('<!ATTLIST one attr CDATA "&amp;" attr2 CDATA "&quot;">', done, checkResults, { entityMd });

         function checkResults(results) {
            let attrPieces = results[0].attributes[0].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharRef,
               tokens.EntityEnd
            ]);
            attrPieces = results[0].attributes[1].value;
            expectTokenTypes(attrPieces, [
               tokens.EntityStart,
               tokens.CharData,
               tokens.EntityEnd
            ]);
         }
      });

      it('recognizes entities within entities', (done) => {
         const manager = new XmlEntityManager();
         manager.addEntity(makeToken('level1', '(&level2;)'));
         manager.addEntity(makeToken('level2', '&quot;&#x41;'));
         pipeAndTest('<!ATTLIST one attr CDATA "&level1;">', done, checkResults, { entityMd, manager });

         function checkResults(results) {
            const attrPieces = results[0].attributes[0].value;
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
         manager.addEntity(makeToken('l1', 'stuff&level2;'));
         manager.addEntity(makeToken('level2', 'foo&badRef;'));
         pipeAndTest('<!ATTLIST one attr CDATA "&l1;">', done, checkResults, {
            entityMd: new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5, new EntityLocation('s4', 'p4')),
            manager
         });

         function checkResults(results) {
            const token = results[0];

            expect(token.place).toEqual(new Offset(0, 3, 3));   // location of the point of the error at &badRef;
            expect(token.context).toEqual([ {
               offset: new Offset(0, 3, 3),  // location of start of the bad ref in level2
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 5, 5),  // location of level2 reference in l1
               location: new EntityLocation('', undefined)
            }, {
               offset: new Offset(0, 0, 0),   // location of the root element start
               location: new EntityLocation('s4', 'p4')
            } ]);
         }
      });

   });

   describe('expands the external subset', () => {

      it('inserts no internal or external subset if none is specified', (done) => {
         pipeAndTest('<?xml version="1.0"?><!DOCTYPE foo>', done, checkResults);

         function checkResults(results) {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.DocTypeStart,
               tokens.DocTypeEnd
            ]);
         }
      });

      it('inserts an internal subset if one is specified', (done) => {
         pipeAndTest('<?xml version="1.0"?><!DOCTYPE foo [<!ELEMENT foo ANY>]>', done, checkResults);

         function checkResults(results) {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.DocTypeStart,
               tokens.InternalSubsetStart,
               tokens.ElementDeclaration,
               tokens.InternalSubsetEnd,
               tokens.DocTypeEnd
            ]);
         }
      });

      it('inserts an external subset after the internal if both are specified', (done) => {
         const manager = new XmlEntityManager();
         // work behind the scenes with intimate knowledge of the manager
         manager.addParameterEntity(makeToken('\tEXTERNAL\tSUBSET\t', '<!ENTITY foo "bar">'));
         spyOn(manager, 'addExternalSubsetEntity');
         pipeAndTest('<?xml version="1.0"?><!DOCTYPE foo SYSTEM "foo" [<!ELEMENT foo ANY>]>', done, checkResults, {
            manager
         });

         function checkResults(results) {
            expectTokenTypes(results, [
               tokens.XmlDeclaration,
               tokens.DocTypeStart,
               tokens.InternalSubsetStart,
               tokens.ElementDeclaration,
               tokens.InternalSubsetEnd,
               tokens.ExternalSubsetStart,
               tokens.EntityDeclaration,
               tokens.ExternalSubsetEnd,
               tokens.DocTypeEnd
            ]);
         }
      });

      it('inserts the external subset location into the entity manager', (done) => {
         const manager = new XmlEntityManager();
         manager.addParameterEntity(makeToken('\tEXTERNAL\tSUBSET\t', '<!ENTITY foo "bar">'));
         spyOn(manager, 'addExternalSubsetEntity');
         pipeAndTest('<?xml version="1.0"?><!DOCTYPE foo PUBLIC "pub.xml" "sys.xml" [<!ELEMENT foo ANY>]>', done,
            checkResults, { manager });

         function checkResults() {
            expect(manager.addExternalSubsetEntity).toHaveBeenCalledWith(new EntityLocation('sys.xml', 'pub.xml'));
         }
      });

   });

   describe('stream processing', () => {

      /*
       * This tests a sitaution which is currently actually impossible to have
       * happen, but should any of the underlying semantics change so that it
       * will happen (the node doc is not precise enough to assure this won't
       * happen, though it is pretty unlikely), we want to protect ourselves.
       * Because it is impossible to happen at the moment, we must bend over
       * backwards to set up some mock code and reach into private methods to
       * get the situation to happen, which is that an additional _transform()
       * call is made after an error has occurred.
       */
      it('does not break if _treeChanged() is called repeatedly after error', (done) => {
         const es = new EntityExpandingStream({
            lax: false
         });
         spyOn(es, 'push').and.callThrough();
         es.on('data', () => {});
         es.on('error', () => {});
         es.on('end', () => {
            expect(es.push.calls.count()).toEqual(2);
            done();
         });

         es._transform(new tokens.XmlDeclaration([], []), () => {});
         es._transform(new SyntaxError(SyntaxError.ID.REFERENCE_NO_DECLARATION), () => {});
         es._baseStreamHandler._queue.push({ token: new tokens.ElementStart('one', [], []), callback: () => {} });
         es._baseStreamHandler._queue.push({ token: new tokens.ElementStart('one', [], []), callback: () => {} });
         es._treeChanged(es._baseStreamHandler);
      });

   });

});
