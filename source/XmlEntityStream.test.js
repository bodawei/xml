/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlEntityManager = require('./XmlEntityManager.js');
const XmlEntityStream = require('./XmlEntityStream.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const XmlToken = require('./XmlToken.js');

const makeStrictStream = require('./XmlTokenStream-util.test.js').makeStrictStream;
const makeStrictExternalEntityStream = require('./XmlTokenStream-util.test.js').makeStrictExternalEntityStream;
const makeLaxExternalEntityStream = require('./XmlTokenStream-util.test.js').makeLaxExternalEntityStream;

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

   describe('on()', () => {
      let token;
      let errorObject;

      beforeEach(() => {
         token = undefined;
         errorObject = undefined;
      });

      it('registers a "data" callback', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         es.on('data', (error, data) => {
            if (count === 0) {
               errorObject = error;
               token = data;
            }
            count++;
         });
         jasmine.clock().tick(1);

         expect(token.type).toEqual(XmlToken.ELEMENT_START);
         expect(errorObject).toBeUndefined();
      });

      it('registers a "token" callback', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         es.on('token', (error, data) => {
            if (count === 0) {
               errorObject = error;
               token = data;
            }
            count++;
         });
         jasmine.clock().tick(1);

         expect(token.type).toEqual(XmlToken.ELEMENT_START);
         expect(errorObject).toBeUndefined();
      });

      it('registers an "error" callback', () => {
         const ts = makeLaxExternalEntityStream('<?XML ?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         es.on('error', (error, data) => {
            if (count === 0) {
               errorObject = error;
               token = data;
            }
            count++;
         });
         jasmine.clock().tick(1);

         expect(token).toBeUndefined();
         expect(errorObject.code).toEqual(XmlErrorToken.ERROR.XMLDECL_TARGET_INVALID_CASE);
      });

      it('will not register the same callback multiple times', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         function callback() {
            count++;
         }

         es.on('data', callback);
         es.on('data', callback);
         jasmine.clock().tick(1);

         expect(count).toEqual(3);
      });

      it('throws an exception if an unknown event is registered', () => {
         const ts = makeLaxExternalEntityStream('<?XML ?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         expect(() => {
            es.on('bogus', () => {});
         }).toThrowError('Event "bogus" is not known. Must be one of: error, token, data.');
      });

      it('throws an exception if no callback is provided', () => {
         const ts = makeLaxExternalEntityStream('<?XML ?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         expect(() => {
            es.on('data');
         }).toThrowError('Callback must be a function with signature "function(error, data)".');
      });

   });

   describe('off()', () => {

      it('removes a "data" event handler', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         function remove() {
            es.off('data', callback);
         }

         function callback() {
            count++;
            remove();
         }

         es.on('data', callback);

         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('registers a "token" callback', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         function remove() {
            es.off('token', callback);
         }

         function callback() {
            count++;
            remove();
         }

         es.on('token', callback);

         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('registers an "error" callback', () => {
         const ts = makeLaxExternalEntityStream('<?XML ?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         function remove() {
            es.off('error', callback);
         }

         function callback() {
            count++;
            remove();
         }

         es.on('error', callback);

         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('throws no error if a there are no callbacks for the specified event', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         expect(() => {
            es.off('data', () => {});
         }).not.toThrow();

      });

      it('throws no error if a callback that is not there is removed', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         es.on('data', () => {});

         expect(() => {
            es.off('data', () => {});
         }).not.toThrow();

      });

      it('can remove one handler without removing all (very whitebox)', () => {
         const ts = makeStrictExternalEntityStream('<one>foo</one>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());
         let count = 0;

         function callback1() {
            count++;
         }
         function callback2() {
            count += 10;
         }

         es.on('data', callback1);
         es.on('data', callback2);

         es.off('data', callback2);

         jasmine.clock().tick(1);

         expect(count).toEqual(3);
      });

      it('throws an exception if an unknown event tries to be turned off', () => {
         const ts = makeLaxExternalEntityStream('<?XML ?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         expect(() => {
            es.off('bogus', () => {});
         }).toThrowError('Event "bogus" is not known. Must be one of: error, token, data.');
      });

      it('throws an exception if no callback is provided', () => {
         const ts = makeLaxExternalEntityStream('<?XML ?>');
         const es = new XmlEntityStream(ts, new XmlEntityManager());

         expect(() => {
            es.off('data');
         }).toThrowError('Callback must be a function with signature "function(error, data)".');
      });

   });

});
