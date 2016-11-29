/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

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

describe('XmlEntityStream', () => {
   let count;

   beforeEach(() => {
      jasmine.clock().install();
      count = 0;
   });

   afterEach(() => {
      jasmine.clock().uninstall();
   });

   describe('construction', () => {

      it('throws an error if not passed an entity manager', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&amp;</one>');

         expect(() => {
            new XmlEntityStream(ts);
         }).toThrowError('Must provide an XmlEntityManager instance.');
      });

      it('throws an error if not passed an object with a getNextToken() function', () => {

         expect(() => {
            new XmlEntityStream({}, new XmlEntityManager());
         }).toThrowError('The tokenStream must have an on() function.');
      });

   });

   describe('getNext()', () => {

      it('retrieves all the tokens from the underlying stream', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>data</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         ignoreToken(es, tokens.XmlDeclaration);
         ignoreToken(es, tokens.ElementStart);
         ignoreToken(es, tokens.CharData);
         ignoreToken(es, tokens.ElementEnd);

      });

   });

   describe('entity expansion in content', () => {

      it('marks entity start as having data when the entity is defined', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&amp;data</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         ignoreToken(es, tokens.XmlDeclaration);
         ignoreToken(es, tokens.ElementStart);

         const token = es.getNext();
         expect(token.haveEntityData).toEqual(true);

      });

      it('inserts entity data after start and before end', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&quot;data</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         ignoreToken(es, tokens.XmlDeclaration);
         ignoreToken(es, tokens.ElementStart);
         ignoreToken(es, tokens.EntityStart);
         jasmine.clock().tick(1); // Give the inner on()'s a chance to kick in
         const token = es.getNext();

         expect(token.text).toEqual('"');
         ignoreToken(es, tokens.EntityEnd);
         ignoreToken(es, tokens.CharData);
         ignoreToken(es, tokens.ElementEnd);
      });

      it('delivers all tokens across both the outer and inner streams', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&quot;data</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         expectToken(es, tokens.XmlDeclaration);
         expectToken(es, tokens.ElementStart);
         expectToken(es, tokens.EntityStart);
         jasmine.clock().tick(1);
         expectToken(es, tokens.CharData);
         expectToken(es, tokens.EntityEnd);
         expectToken(es, tokens.CharData);
         expectToken(es, tokens.ElementEnd);
      });

      it('recognizes entities within entities', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><root>&level1;</root>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level1', '<child>&level2;</child>', undefined, undefined, TEST_CHUNKS));
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level2', '&quot;&#x41;', undefined, undefined, TEST_CHUNKS));
         jasmine.clock().tick(1);

         let token = es.getNext();
         expect(token).toBeInstanceOf(tokens.XmlDeclaration);

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.ElementStart);
         expect(token.name).toEqual('root');

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.EntityStart);
         expect(token.name).toEqual('level1');
         jasmine.clock().tick(1);

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.ElementStart);
         expect(token.name).toEqual('child');

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.EntityStart);
         expect(token.name).toEqual('level2');
         jasmine.clock().tick(1);

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.EntityStart);
         expect(token.name).toEqual('quot');
         jasmine.clock().tick(1);

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.CharData);
         expect(token.text).toEqual('"');

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.EntityEnd);
         expect(token.name).toEqual('quot');

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.CharRef);
         expect(token.text).toEqual('A');

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.EntityEnd);
         expect(token.name).toEqual('level2');

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.ElementEnd);
         expect(token.name).toEqual('child');

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.EntityEnd);
         expect(token.name).toEqual('level1');

         token = es.getNext();
         expect(token).toBeInstanceOf(tokens.ElementEnd);
         expect(token.name).toEqual('root');
      });

      it('retrieves the expected chunks', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><root>&lt;</root>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         ignoreToken(es, tokens.XmlDeclaration);
         ignoreToken(es, tokens.ElementStart);
         ignoreToken(es, tokens.EntityStart);
         jasmine.clock().tick(1);

         let t = es.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.PlainChunk('#'),
            new TextChunk.DigitChunk('60', true),
            new TextChunk.PlainChunk(';')
         ]));

         t = es.getNext();
         expect(t.chunks).toEqual([]);
      });

      it('reports an error if the entity is not found', () => {
         const ts = makeLaxStream('<?xml version="1.0"?><root>&bogus;</root>');
         const es = new XmlEntityStream(ts, new XmlEntityManager(), { lax: true });
         jasmine.clock().tick(1);

         ignoreToken(es, tokens.XmlDeclaration);
         ignoreToken(es, tokens.ElementStart);
         ignoreToken(es, tokens.EntityStart);
         jasmine.clock().tick(1);

         expectError(es, SyntaxError.ID.REFERENCE_NO_DECLARATION,
            'Missing declaration for entity "bogus".');
      });

      it('reports the place and context of the error', () => {
         const ts = makeLaxStream('<?xml version="1.0"?><root>&level1;</root>');
         const es = new XmlEntityStream(ts, new XmlEntityManager(), {
            lax: true
         });
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level1', '<child>&level2;</child>', undefined, undefined, TEST_CHUNKS));
         es._entityManager.addEntity(
            new tokens.EntityDeclaration('level2', '<!--bug', undefined, undefined, TEST_CHUNKS));
         jasmine.clock().tick(1);

         ignoreToken(es, tokens.XmlDeclaration);
         ignoreToken(es, tokens.ElementStart);   // root
         ignoreToken(es, tokens.EntityStart); // level1
         jasmine.clock().tick(1);
         ignoreToken(es, tokens.ElementStart); // child
         ignoreToken(es, tokens.EntityStart); // level2
         jasmine.clock().tick(1);

         const token = es.getNext();
         expect(token.place).toEqual(new Offset(0, 7, 7));
         expect(token.context).toEqual([ new Offset(0, 0, 0), new Offset(0, 7, 7), new Offset(0, 27, 27) ]);
      });

   });

   describe('entity expansion in attributes', () => {

      it('does nothing when attribute is just text', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one foo="bar"></one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         ignoreToken(es, tokens.XmlDeclaration);

         const token = es.getNext();
         expect(token.attributes[0].value).toEqual([ new tokens.Text('bar', tokens.ATTR_NO_CHUNKS) ]);
      });

      it('inserts text from entity', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one foo="&amp;"></one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);
         ignoreToken(es, tokens.XmlDeclaration);

         es.getNext();
         jasmine.clock().tick(1);
         const token = es.getNext();
         clearChunks(token.attributes[0].value);
         expect(token.attributes[0].value).toEqual([
            new tokens.EntityStart('amp', true, tokens.ATTR_NO_CHUNKS),
            new tokens.CharRef('&', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityEnd('amp', tokens.ATTR_NO_CHUNKS)
         ]);
      });

       // @@@ WHY
      function clearChunks(item) {
         for (let index = 0; index < item.length; index++) {
            item[index].chunks = undefined;
         }
      }

      it('reports an error if an entity is not found', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one foo="&frog;"></one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);
         ignoreToken(es, tokens.XmlDeclaration);

         es.getNext();
         jasmine.clock().tick(1);
         const token = es.getNext();
         clearChunks(token.attributes[0].value);
         expect(token.attributes[0].value).toEqual([
            new tokens.EntityStart('frog', false, tokens.ATTR_NO_CHUNKS),
            new tokens.EntityEnd('frog', tokens.ATTR_NO_CHUNKS)
         ]);
      });

      it('marks entity start as having data when the entity is defined', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one foo="&amp;"></one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);
         ignoreToken(es, tokens.XmlDeclaration);

         es.getNext();
         jasmine.clock().tick(1);
         const token = es.getNext();
         expect(token.attributes[0].value[0].haveEntityData).toEqual(true);

      });

      it('delivers all tokens across both the outer and inner streams', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one foo="&amp;"></one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         expectToken(es, tokens.XmlDeclaration);
         es.getNext();
         jasmine.clock().tick(1);
         expectToken(es, tokens.ElementStart);
         expectToken(es, tokens.ElementEnd);
      });

      it('inserts text from multiple entities in one attribute', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one foo="&amp;&amp;"></one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);
         ignoreToken(es, tokens.XmlDeclaration);
         es.getNext();
         jasmine.clock().tick(1);

         const token = es.getNext();
         clearChunks(token.attributes[0].value);
         expect(token.attributes[0].value).toEqual([
            new tokens.EntityStart('amp', true, tokens.ATTR_NO_CHUNKS),
            new tokens.CharRef('&', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityEnd('amp', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityStart('amp', true, tokens.ATTR_NO_CHUNKS),
            new tokens.CharRef('&', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityEnd('amp', tokens.ATTR_NO_CHUNKS)
         ]);
      });

      it('inserts text from multiple attributes', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one ' +
            'foo="&amp;&quot;" bar="&quot;&amp;"></one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);
         ignoreToken(es, tokens.XmlDeclaration);
         es.getNext();
         jasmine.clock().tick(1);

         const token = es.getNext();
         clearChunks(token.attributes[0].value);
         clearChunks(token.attributes[1].value);
         expect(token.attributes[0].value).toEqual([
            new tokens.EntityStart('amp', true, tokens.ATTR_NO_CHUNKS),
            new tokens.CharRef('&', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityEnd('amp', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityStart('quot', true, tokens.ATTR_NO_CHUNKS),
            new tokens.CharData('"', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityEnd('quot', tokens.ATTR_NO_CHUNKS)
         ]);
         expect(token.attributes[1].value).toEqual([
            new tokens.EntityStart('quot', true, tokens.ATTR_NO_CHUNKS),
            new tokens.CharData('"', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityEnd('quot', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityStart('amp', true, tokens.ATTR_NO_CHUNKS),
            new tokens.CharRef('&', tokens.ATTR_NO_CHUNKS),
            new tokens.EntityEnd('amp', tokens.ATTR_NO_CHUNKS)
         ]);
      });

      // it('recognizes entities within entities', () => {
      //    const ts = makeStrictStream('<?xml version="1.0"?><root attr="&level1;">one</root>');
      //    const es = new XmlEntityStream(ts, new XmlEntityManager());
      //    es._entityManager.addEntity(new tokens.EntityDeclaration('level1', '(&level2;)'));
      //    es._entityManager.addEntity(new tokens.EntityDeclaration('level2', '&quot;&#x41;'));
      //    jasmine.clock().tick(1);

      //    ignoreToken(es, tokens.XmlDeclaration);
      //    let token = es.getNext();
      //    jasmine.clock().tick(1);

      //    token = es.getNext();
      //    expect(token).toBeInstanceOf(tokens.ElementStart);
      //    expect(token.name).toEqual('root');
      //    clearChunks(token.attributes[0].value);
      //    expect(token.attributes[0].value).toEqual([
      //       new tokens.EntityStart('level1', true),
      //       new tokens.CharData('('),
      //       new tokens.EntityStart('level2', true),
      //       new tokens.EntityStart('quot', true),
      //       new tokens.CharData('"', TEST_CHUNKS),
      //       new tokens.CharRef('A'),
      //       new tokens.EntityEnd('quot'),
      //       new tokens.EntityEnd('level2'),
      //       new tokens.CharData(')'),
      //       new tokens.EntityEnd('level1')
      //    ]);

      //    token = es.getNext();
      //    expect(token).toBeInstanceOf(tokens.CharData);
      //    expect(token.data).toEqual('one');

      //    token = es.getNext();
      //    expect(token).toBeInstanceOf(tokens.ElementEnd);
      //    expect(token.name).toEqual('root');
      // });

   });

   describe('event delivery', () => {

      it('delivers all tokens, including errors', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="usascii"?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         es.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(tokens.ElementStart);
                  break;
               case 1:
                  expect(data).toBeInstanceOf(tokens.CharData);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(tokens.ElementEnd);
                  break;
               case 3:
                  expect(error.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }

            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(4);
      });

      it('delivers all tokens, including errors to multiple callbacks', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="usascii"?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         let count2 = 0;

         es.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(tokens.ElementStart);
                  break;
               case 1:
                  expect(data).toBeInstanceOf(tokens.CharData);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(tokens.ElementEnd);
                  break;
               case 3:
                  expect(error.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }

            count++;
         });
         es.on('data', () => {
            count2++;
         });
         jasmine.clock().tick(1);

         expect(count + count2).toEqual(8);
      });

      it('copes with an underlying stream delivering a new token while we are handling an event', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="usascii"?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         es.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(tokens.ElementStart);
                  // force annother call to _tokenLoop, which is what we're really after in this strange test
                  es.on('data', () => {});
                  jasmine.clock().tick(1);
                  break;
               case 1:
                  expect(data).toBeInstanceOf(tokens.CharData);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(tokens.ElementEnd);
                  break;
               case 3:
                  expect(error.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }

            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(4);
      });

      it('delivers an "end" event when all tokens delivered', () => {
         const ts = makeStrictExternalEntityStream('<?xml encoding="usascii"?><one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         let endCount = 0;
         es.on('data', () => {
            count++;
         });
         es.on('end', () => {
            endCount++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(4);
         expect(endCount).toEqual(1);
      });

   });

});
