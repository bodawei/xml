/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./shared/TextChunk.js');
const XmlStream = require('./XmlStream.js');
const XmlToken = require('./XmlToken.js');

const TEST_CHUNKS = [ new TextChunk.PlainChunk('from test') ];

describe('XmlStream', () => {
   let dataItem;

   function makeStream(options) {
      const stream = new XmlStream(options);
      stream._innerGetNext = function innerGetNext() {
         return dataItem;
      };

      return stream;
   }

   beforeEach(() => {
      dataItem = undefined;
   });

   describe('construction', () => {

      it('can be constructed without error', () => {
         expect(() => {
            new XmlStream();
         }).not.toThrow();
      });

      it('if passed no options, the defaults are used (whitebox)', () => {
         const s = new XmlStream();

         expect(s._options).toEqual({
            lax: false
         });
      });

      it('stores the option if passed an option', () => {
         const s = new XmlStream({ lax: true });

         expect(s._options.lax).toEqual(true);

      });

   });

   describe('getNext()', () => {

      it('will not return a value if called after ended', () => {
         const s = makeStream();
         s._setEnded();
         dataItem = new XmlToken.ElementStart('test', [], TEST_CHUNKS);

         expect(s.getNext()).toBeUndefined();
      });

   });

   describe('on()', () => {
      let count;

      beforeEach(() => {
         jasmine.clock().install();
         count = 0;
      });

      afterEach(() => {
         jasmine.clock().uninstall();
      });

      it('registers a "data" callback', () => {
         const s = makeStream();
         dataItem = new XmlToken.ElementStart('test', [], TEST_CHUNKS);
         s.on('data', (error, data) => {
            if (count === 0) {
               expect(data).toBeInstanceOf(XmlToken.ElementStart);
               expect(error).toBeUndefined();
            }
            dataItem = undefined;
            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('registers a "token" callback', () => {
         const s = makeStream();
         dataItem = new XmlToken.ElementStart('test', [], TEST_CHUNKS);
         s.on('token', (error, data) => {
            if (count === 0) {
               expect(data).toBeInstanceOf(XmlToken.ElementStart);
               expect(error).toBeUndefined();
            }
            dataItem = undefined;
            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('registers an "error" callback', () => {
         const s = makeStream();
         dataItem = new SyntaxError(SyntaxError.ID.XMLDECL_TARGET_INVALID_CASE);
         s.on('error', (error, data) => {
            if (count === 0) {
               expect(data).toBeUndefined();
               expect(error.id).toEqual(SyntaxError.ID.XMLDECL_TARGET_INVALID_CASE);
            }
            dataItem = undefined;
            count++;
         });
         jasmine.clock().tick(1);

      });

      it('will not register the same callback multiple times', () => {
         const s = makeStream();
         dataItem = new XmlToken.ElementStart('test', [], TEST_CHUNKS);
         function callback() {
            count++;
            if (count === 2) {
               dataItem = undefined;
            }
         }

         s.on('data', callback);
         s.on('data', callback);
         jasmine.clock().tick(1);

         expect(count).toEqual(2);
      });

      it('registers an "end" callback (whitebox)', () => {
         const s = makeStream();
         let result;
         s.on('end', (error, data) => {
            result = data;
            count++;
         });
         s._setEnded();

         expect(count).toEqual(1);
         expect(result).toBeUndefined();
      });

      it('throws an exception if an unknown event is registered', () => {
         const s = makeStream();

         expect(() => {
            s.on('bogus', () => {});
         }).toThrowError('Event "bogus" is not known. Must be one of: data, end, error, token.');
      });

      it('throws an exception if no callback is provided', () => {
         const s = makeStream();

         expect(() => {
            s.on('data');
         }).toThrowError('Callback must be a function with signature "function(error, data)".');
      });

   });

   describe('off()', () => {
      let count;

      beforeEach(() => {
         jasmine.clock().install();
         count = 0;
      });

      afterEach(() => {
         jasmine.clock().uninstall();
      });

      it('removes a "data" event handler', () => {
         const s = makeStream();
         dataItem = new XmlToken.ElementStart('test', [], TEST_CHUNKS);

         function remove() {
            s.off('data', callback);
            dataItem = undefined;
         }

         function callback() {
            count++;
            remove();
         }

         s.on('data', callback);

         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('removes a "token" callback', () => {
         const s = makeStream();
         dataItem = new XmlToken.ElementStart('test', [], TEST_CHUNKS);

         function remove() {
            s.off('token', callback);
         }

         function callback() {
            count++;
            remove();
         }

         s.on('token', callback);

         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('removes an "error" callback', () => {
         const s = makeStream();
         dataItem = new SyntaxError(SyntaxError.ID.XMLDECL_TARGET_INVALID_CASE);

         function remove() {
            s.off('error', callback);
         }

         function callback() {
            count++;
            remove();
         }

         s.on('error', callback);

         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('removes an "end" callback (whitebox)', () => {
         const s = makeStream();
         let result;
         function callback(error, data) {
            result = data;
            count++;
         }
         s.on('end', callback);
         s.off('end', callback);

         s._setEnded();

         expect(count).toEqual(0);
         expect(result).toBeUndefined();
      });

      it('throws no error if a there are no callbacks for the specified event', () => {
         const s = makeStream();

         expect(() => {
            s.off('data', () => {});
         }).not.toThrow();

      });

      it('throws no error if a callback that is not there is removed', () => {
         const s = makeStream();
         dataItem = new XmlToken.ElementStart('test', [], TEST_CHUNKS);
         s.on('data', () => {});

         expect(() => {
            s.off('data', () => {}); // note different function than that above
         }).not.toThrow();

      });

      it('can remove one handler without removing all (very whitebox)', () => {
         const s = makeStream();
         dataItem = new XmlToken.ElementStart('test', [], TEST_CHUNKS);
         let count = 0;

         function callback1() {
            count++;
            dataItem = undefined;
         }
         function callback2() {
            count += 10;
         }

         s.on('data', callback1);
         s.on('data', callback2);

         s.off('data', callback2);

         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('throws an exception if an unknown event tries to be turned off', () => {
         const s = makeStream();

         expect(() => {
            s.off('bogus', () => {});
         }).toThrowError('Event "bogus" is not known. Must be one of: data, end, error, token.');
      });

      it('throws an exception if no callback is provided', () => {
         const s = makeStream();

         expect(() => {
            s.off('data');
         }).toThrowError('Callback must be a function with signature "function(error, data)".');
      });

   });

   describe('_setEnded()', () => {

      it('will not send multiple notifications if called multiple times (whitebox)', () => {
         const s = makeStream();
         let count = 0;
         s.on('end', () => {
            count++;
         });

         s._setEnded();
         s._setEnded();
         s._setEnded();

         expect(count).toEqual(1);
      });

   });

});
