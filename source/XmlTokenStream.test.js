/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityMetaData = require('./shared/EntityMetaData.js');
const EntityLocation = require('./shared//EntityLocation.js');
const SyntaxError = require('./error/SyntaxError.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const tokens = require('./XmlToken.js');
const XmlTokenStream = require('./XmlTokenStream.js');

const testUtils = require('./XmlTokenStream-util.test.js');
const makeLaxStream = testUtils.makeLaxStream;
const makeStrictStream = testUtils.makeStrictStream;
const makeLaxExternalEntityStream = testUtils.makeLaxExternalEntityStream;
const makeStrictExternalEntityStream = testUtils.makeStrictExternalEntityStream;
const expectTokenType = testUtils.expectTokenType;
const ignoreError = testUtils.ignoreError;
const ignoreToken = testUtils.ignoreToken;

describe('XmlTokenStream', () => {

   describe('construction', () => {

      it('can be constructed with a cursor', () => {
         expect(() => {
            new XmlTokenStream(new XmlStringCursor('hi'), new XmlEntityManager());
         }).not.toThrow();
      });

      it('throws an error if called with no entity manager', () => {
         expect(() => {
            new XmlTokenStream(new XmlStringCursor('hi'));
         }).toThrowError('Must provide an XmlEntityManager instance.');
      });

      it('if passed no options, the defaults are used (whitebox)', () => {
         const s = new XmlTokenStream(new XmlStringCursor('hi'), new XmlEntityManager());

         expect(s._options).toEqual({
            lax: false,
            ignoreDocumentVersion: false,
            ignoreDocumentEncoding: false
         });
      });

      it('stores the option if passed an option', () => {
         const s = new XmlTokenStream(new XmlStringCursor('hi'), new XmlEntityManager(), { lax: true });

         expect(s._options.lax).toEqual(true);

      });

      it('throws an error if passed an unknown option', () => {
         expect(() => {
            new XmlTokenStream(new XmlStringCursor('hi'), new XmlEntityManager(), { fish: true });
         }).toThrowError('"fish" is not a supported option name.');

      });

   });

   describe('event delivery', () => {

      it('delivers all tokens', (done) => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');
         let count = 0;

         s.on('data', (data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(tokens.ElementStart);
                  break;
               case 1:
                  expect(data).toBeInstanceOf(tokens.CharData);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(tokens.ElementEnd);
                  done();
                  break;
               default:
                  throw new Error('Got an extra call in test. ' + JSON.stringify(data));
            }

            count++;
         });
      });

      it('delivers tokens and errors to "data" handler in a lax stream', (done) => {
         const s = makeLaxExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');
         let count = 0;

         s.on('data', (data) => {
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
                  expect(data.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               case 4:
                  expect(data).toBeInstanceOf(tokens.TextDeclaration);
                  done();
                  break;
               default:
                  throw new Error('Got an extra call in test. Call #' + count + ' ' + JSON.stringify(data));
            }
            count++;
         });
      });

      it('delivers no data after an error token with a strict stream', (done) => {
         const s = makeStrictExternalEntityStream('foo<?xml encoding="utf-8"?>');
         let count = 0;

         s.on('error', (error) => {
            expect(error.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
            done();
         });

         s.on('data', (data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(tokens.CharData);
                  break;
               default:
                  throw new Error('Got an extra call in test. Call #' + count + ' ' + JSON.stringify(data));
            }
            count++;
         });
      });

      it('delivers data after an error token with a lax stream', (done) => {
         const s = makeLaxExternalEntityStream('foo<?xml encoding="utf-8"?>');
         s.on('error', () => {}); // silence immediate error reporting
         let count = 0;

         s.on('data', (data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(tokens.CharData);
                  break;
               case 1:
                  expect(data.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(tokens.TextDeclaration);
                  done();
                  break;
               default:
                  throw new Error('Got an extra call in test. Call #' + count + ' ' + JSON.stringify(data));
            }
            count++;
         });
      });

      describe('end', () => {

         it('delivers an "end" event when all tokens consumed', (done) => {
            const s = makeStrictExternalEntityStream('<?xml encoding="utf-8"?><one>foo</one>');
            let count = 0;

            s.on('data', () => {
               count++;
            });
            s.on('end', () => {
               expect(count).toEqual(4);
               done();
            });
         });

         it('delivers an "end" event after "error" in a strict stream', (done) => {
            const s = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');
            let count = 0;

            s.on('error', () => {
               count++;
            });
            s.on('data', () => {});
            s.on('end', () => {
               expect(count).toEqual(1);
               done();
            });
         });

      });

   });

   describe('read()', () => {

      it('retrieves all tokens', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');

         expectTokenType(s, tokens.ElementStart);
         expectTokenType(s, tokens.CharData);
         expectTokenType(s, tokens.ElementEnd);
         expect(s.read()).toBeNull();
      });

      it('will not start a subsequent async call if one is already in progress (whitebox)', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');
         // We have to fake async behavior because the stream isn't fully async-capable yet.
         spyOn(s, '_read');

         const token = s.read();
         expect(token).toBeNull();

         s.read();
         expect(s._read.calls.count()).toEqual(1);
      });

      it('throws an error if an error is found in a strict stream', () => {
         const s = makeStrictExternalEntityStream('foo<?XML encoding="UTF-8"?>');

         ignoreToken(s, tokens.CharData);

         expect(() => {
            s.read();
         }).toThrowError('"xml" must be lower case. Found "XML".');
      });

      it('throws no error if an error is found in a lax stream', () => {
         const s = makeLaxExternalEntityStream('foo<?XML encoding="UTF-8"?>');

         ignoreToken(s, tokens.CharData);

         expect(() => {
            s.read();
         }).not.toThrow();
      });

      it('will deliver no other data after an exception in a strict stream', () => {
         const s = makeStrictExternalEntityStream('foo<?XML encoding="UTF-8"?>');

         ignoreToken(s, tokens.CharData);
         expect(() => {
            s.read();
         }).toThrowError('"xml" must be lower case. Found "XML".');

         expect(s.read()).toBeNull();
      });

      it('will deliver other data after an exception in a lax stream', () => {
         const s = makeLaxExternalEntityStream('foo<?xml encoding="UTF-8"?>');

         ignoreToken(s, tokens.CharData);
         ignoreError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT);

         expectTokenType(s, tokens.TextDeclaration);
      });

      it('will deliver no other data after an exception in a strict stream with an error in the dtd', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE foo  [] ');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.DocTypeStart);

         expect(() => {
            s.read();
         }).toThrowError('Missing closing ">" for in the document type.');

         ignoreToken(s, tokens.InternalSubsetStart);
         ignoreToken(s, tokens.InternalSubsetEnd);

         expect(s.read()).toBeNull();
      });

   });

   describe('cursor interaction', () => {

      it('sets the version on the cursor when the XmlDeclaration is found', () => {
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 4, new EntityLocation());
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>', entityMd);
         const s = new XmlTokenStream(cursor, new XmlEntityManager());

         s.read();

         expect(s._cursor.entityMd).toEqual(new EntityMetaData(
            EntityMetaData.TYPE.DOCUMENT,
            1.1,
            2
         ));
      });

      it('does not set the version on the cursor if ignoreDocumentVersion flag is set to true', () => {
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 4, new EntityLocation());
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>', entityMd);
         const s = new XmlTokenStream(cursor, new XmlEntityManager(), { ignoreDocumentVersion: true });

         s.read();

         expect(s._cursor.entityMd).toEqual(entityMd);
      });

      it('sets the document encoding on the cursor by default', () => {
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>');
         const s = new XmlTokenStream(cursor, new XmlEntityManager());

         s.read();

         expect(s._cursor._encoding.specifiedEncoding).toEqual('usascii');
      });

      it('does not set the document encoding on the cursor if the cursor was created with an encoding', () => {
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>', undefined,
            { encoding: 'UTF-8' });
         const s = new XmlTokenStream(cursor, new XmlEntityManager());

         s.read();

         expect(s._cursor._encoding.specifiedEncoding).toEqual('UTF-8');
      });

      it('does not set the document encoding on the cursor if the ignoreDocumentEncoding flag is set', () => {
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>');
         const s = new XmlTokenStream(cursor, new XmlEntityManager(), { ignoreDocumentEncoding: true });

         s.read();

         expect(s._cursor._encoding.specifiedEncoding).toBeUndefined();
      });

   });

   describe('character set validation', () => {

      it('reports an error if given a UTF-16 stream without a BOM', () => {
         // The following is UTF16 version of '<?xml version="1.1"?>' without a BOM
         const cursor = new XmlStringCursor('\u0000\u003c\u0000\u003f\u0000\u0078\u0000\u006d\u0000\u006c\u0000\u0020' +
            '\u0000\u0076\u0000\u0065\u0000\u0072\u0000\u0073\u0000\u0069\u0000\u006f\u0000\u006e\u0000\u003d' +
            '\u0000\u0022\u0000\u0031\u0000\u002e\u0000\u0031\u0000\u0022\u0000\u003f\u0000\u003e');
         const s = new XmlTokenStream(cursor, new XmlEntityManager());

         expect(() => {
            s.read();
         }).toThrowError('Missing BOM in UTF-16 input.');
      });

      it('reports no error if given a UTF-16 stream with a BOM', () => {
         // The following is UTF16 version of '<?xml version="1.1"?>' WITH a BOM
         const cursor = new XmlStringCursor('\u00FE\u00FF\u0000\u003c\u0000\u003f\u0000\u0078\u0000\u006d\u0000\u006c' +
            '\u0000\u0020\u0000\u0076\u0000\u0065\u0000\u0072\u0000\u0073\u0000\u0069\u0000\u006f\u0000\u006e' +
            '\u0000\u003d\u0000\u0022\u0000\u0031\u0000\u002e\u0000\u0031\u0000\u0022\u0000\u003f\u0000\u003e');
         const s = new XmlTokenStream(cursor, new XmlEntityManager());

         expect(() => {
            s.read();
         }).not.toThrow();
      });

   });

   describe('_report()', () => {

      it('includes an error token in the error', () => {
         const s = makeStrictStream('');
         const expected = new SyntaxError(SyntaxError.ID.BANGITEM_UNKNOWN);
         expected.message = 'Unkown "<!" item.';
         s.on('error', () => {}); // silence immediate error reporting

         s._report(SyntaxError.ID.BANGITEM_UNKNOWN, []);

         try {
            s.read();
         } catch (error) {
            expect(error.details).toEqual(expected);
         }
      });

      it('queues a syntax error token', () => {
         const s = makeLaxStream('');
         const expected = new SyntaxError(SyntaxError.ID.BANGITEM_UNKNOWN,
            'Unkown "<!" item.');

         s._report(SyntaxError.ID.BANGITEM_UNKNOWN);

         expect(s.read()).toEqual(expected);
      });

      it('replaces parameters', () => {
         const s = makeLaxStream('');

         s._report(SyntaxError.ID.BANGITEM_NAME_INVALID_CASE, [ 'one', 'two' ]);

         expect(s.read().message).toEqual('"one" must be upper case. Found "two".');
      });

      it('replaces only the parameters provided', () => {
         const s = makeLaxStream('');

         s._report(SyntaxError.ID.BANGITEM_NAME_INVALID_CASE, [ 'one' ]);

         expect(s.read().message).toEqual('"one" must be upper case. Found "{1}".');
      });

   });

   describe('general parsing()', () => {

      it('does not generate a S token between tags', () => {
         const s = makeStrictStream('<?xml version="1.1"?> <one> UNO </one> ');
         ignoreToken(s, tokens.XmlDeclaration);

         expectTokenType(s, tokens.Space);
         expectTokenType(s, tokens.ElementStart);
         expectTokenType(s, tokens.CharData);
         expectTokenType(s, tokens.ElementEnd);
         expectTokenType(s, tokens.Space);
      });

   });

});
