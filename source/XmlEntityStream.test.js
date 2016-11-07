/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./Offset.js');
const TextChunk = require('./TextChunk.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlEntityStream = require('./XmlEntityStream.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const XmlToken = require('./XmlToken.js');
const EntityToken = XmlToken.EntityToken;

const testUtils = require('./XmlTokenStream-util.test.js');
const makeStrictStream = testUtils.makeStrictStream;
const makeLaxStream = testUtils.makeLaxStream;
const makeStrictExternalEntityStream = testUtils.makeStrictExternalEntityStream;
const makeStringTokenArray = testUtils.makeStringTokenArray;

function ignoreToken(newStream, type) {
   const token = newStream.getNext();

   expect(token.type).toEqual(type);
}

function expectToken(newStream, type) {
   const token = newStream.getNext();

   expect(token.type).toEqual(type);
}

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

         ignoreToken(es, XmlToken.XMLDECL);
         ignoreToken(es, XmlToken.ELEMENT_START);
         ignoreToken(es, XmlToken.CHARDATA);
         ignoreToken(es, XmlToken.ELEMENT_END);

      });

   });

   describe('entity expansion', () => {

      it('marks entity start as having data when the entity is defined', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&amp;data</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         ignoreToken(es, XmlToken.XMLDECL);
         ignoreToken(es, XmlToken.ELEMENT_START);

         const token = es.getNext();
         expect(token.haveEntityData).toEqual(true);

      });

      it('inserts entity data after start and before end', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&quot;data</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         ignoreToken(es, XmlToken.XMLDECL);
         ignoreToken(es, XmlToken.ELEMENT_START);
         ignoreToken(es, XmlToken.ENTITY_START);
         jasmine.clock().tick(1); // Give the inner on()'s a chance to kick in
         const token = es.getNext();

         expect(token.data).toEqual('"');
         ignoreToken(es, XmlToken.ENTITY_END);
         ignoreToken(es, XmlToken.CHARDATA);
         ignoreToken(es, XmlToken.ELEMENT_END);
      });

      it('delivers all tokens across both the outer and inner streams', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><one>&quot;data</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         expectToken(es, XmlToken.XMLDECL);
         expectToken(es, XmlToken.ELEMENT_START);
         expectToken(es, XmlToken.ENTITY_START);
         jasmine.clock().tick(1);
         expectToken(es, XmlToken.CHARDATA);
         expectToken(es, XmlToken.ENTITY_END);
         expectToken(es, XmlToken.CHARDATA);
         expectToken(es, XmlToken.ELEMENT_END);
      });

      it('recognizes entities within entities', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><root>&level1;</root>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         es._entityManager.addEntity(new EntityToken('level1', '<child>&level2;</child>'));
         es._entityManager.addEntity(new EntityToken('level2', '&quot;&#x41;'));
         jasmine.clock().tick(1);

         let token = es.getNext();
         expect(token.type).toEqual(XmlToken.XMLDECL);

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_START);
         expect(token.name).toEqual('root');

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('level1');
         jasmine.clock().tick(1);

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_START);
         expect(token.name).toEqual('child');

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('level2');
         jasmine.clock().tick(1);

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('quot');
         jasmine.clock().tick(1);

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.CHARDATA);
         expect(token.data).toEqual('"');

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('quot');

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.CHAR_REF);
         expect(token.data).toEqual('A');

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('level2');

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_END);
         expect(token.name).toEqual('child');

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('level1');

         token = es.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_END);
         expect(token.name).toEqual('root');
      });

      it('retrieves the expected chunks', () => {
         const ts = makeStrictStream('<?xml version="1.0"?><root>&lt;</root>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         jasmine.clock().tick(1);

         ignoreToken(es, XmlToken.XMLDECL);
         ignoreToken(es, XmlToken.ELEMENT_START);
         ignoreToken(es, XmlToken.ENTITY_START);
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

         ignoreToken(es, XmlToken.XMLDECL);
         ignoreToken(es, XmlToken.ELEMENT_START);
         ignoreToken(es, XmlToken.ENTITY_START);
         jasmine.clock().tick(1);

         const t = es.getNext();
         expect(t).toEqualProps({
            code: XmlErrorToken.ERROR.REFERENCE_NO_DECLARATION,
            message: 'Missing declaration for entity "bogus".'
         });
      });

      it('reports the place and context of the error', () => {
         const ts = makeLaxStream('<?xml version="1.0"?><root>&level1;</root>');
         const es = new XmlEntityStream(ts, new XmlEntityManager(), {
            lax: true
         });
         es._entityManager.addEntity(new EntityToken('level1', '<child>&level2;</child>'));
         es._entityManager.addEntity(new EntityToken('level2', '<!--bug'));
         jasmine.clock().tick(1);

         ignoreToken(es, XmlToken.XMLDECL);
         ignoreToken(es, XmlToken.ELEMENT_START);   // root
         ignoreToken(es, XmlToken.ENTITY_START); // level1
         jasmine.clock().tick(1);
         ignoreToken(es, XmlToken.ELEMENT_START); // child
         ignoreToken(es, XmlToken.ENTITY_START); // level2
         jasmine.clock().tick(1);

         const token = es.getNext();
         expect(token.place).toEqual(new Offset(0, 7, 7));
         expect(token.context).toEqual([ new Offset(0, 0, 0), new Offset(0, 7, 7), new Offset(0, 27, 27) ]);
      });

   });

   describe('event delivery', () => {

      it('delivers all tokens, including errors', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="usascii"?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         es.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data.type).toEqual(XmlToken.ELEMENT_START);
                  break;
               case 1:
                  expect(data.type).toEqual(XmlToken.CHARDATA);
                  break;
               case 2:
                  expect(data.type).toEqual(XmlToken.ELEMENT_END);
                  break;
               case 3:
                  expect(error.code).toEqual(XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT);
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
                  expect(data.type).toEqual(XmlToken.ELEMENT_START);
                  break;
               case 1:
                  expect(data.type).toEqual(XmlToken.CHARDATA);
                  break;
               case 2:
                  expect(data.type).toEqual(XmlToken.ELEMENT_END);
                  break;
               case 3:
                  expect(error.code).toEqual(XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT);
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
                  expect(data.type).toEqual(XmlToken.ELEMENT_START);
                  // force annother call to _tokenLoop, which is what we're really after in this strange test
                  es.on('data', () => {});
                  jasmine.clock().tick(1);
                  break;
               case 1:
                  expect(data.type).toEqual(XmlToken.CHARDATA);
                  break;
               case 2:
                  expect(data.type).toEqual(XmlToken.ELEMENT_END);
                  break;
               case 3:
                  expect(error.code).toEqual(XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT);
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
