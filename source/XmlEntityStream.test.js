/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlEntityManager = require('./XmlEntityManager.js');
const XmlEntityStream = require('./XmlEntityStream.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const XmlToken = require('./XmlToken.js');

const makeStrictStream = require('./XmlTokenStream-util.test.js').makeStrictStream;
const makeStrictExternalEntityStream = require('./XmlTokenStream-util.test.js').makeStrictExternalEntityStream;

function ignoreToken(newStream, type) {
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

   });

});
