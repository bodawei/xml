/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./Offset.js');
const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./TextChunk.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlToken = require('./XmlToken.js');
const XmlTokenStream = require('./XmlTokenStream.js');
const EntityStart = XmlToken.EntityStart;

const testUtils = require('./XmlTokenStream-util.test.js');
const makeLaxStream = testUtils.makeLaxStream;
const makeStrictStream = testUtils.makeStrictStream;
const makeLaxExternalSubsetStream = testUtils.makeLaxExternalSubsetStream;
const makeStrictExternalSubsetStream = testUtils.makeStrictExternalSubsetStream;
const makeLaxExternalEntityStream = testUtils.makeLaxExternalEntityStream;
const makeStrictExternalEntityStream = testUtils.makeStrictExternalEntityStream;
const expectSyntaxError = testUtils.expectSyntaxError;
const expectTokenType = testUtils.expectTokenType;
const expectError = testUtils.expectError;
const ignoreError = testUtils.ignoreError;
const ignoreToken = testUtils.ignoreToken;
const ENTITY_TYPE = testUtils.ENTITY_TYPES;

const makeStringTokenArray = testUtils.makeStringTokenArray;

describe('XmlTokenStream', () => {

   function makeStream(str, entityManager, options) {
      return new XmlTokenStream(new XmlStringCursor(str), entityManager, options);
   }

   function compareXmlDeclAttribute(attr, name, value) {
      expect(attr.name).toEqual(name);
      if (value) {
         expect(attr.value).toEqual(value);
      } else {
         expect(attr.value).toBeUndefined();
      }
   }

   function compareAttribute(attr, name, value) {
      expect(attr.name).toEqual(name);
      expect(attr.value).toEqual(value ? [ new XmlToken.Text(value) ] : []);
   }

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
            'lax:allowOpenAngleBracketsInAttributeValues': false,
            entityType: 'DOCUMENT_ENTITY'
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
      let count;

      beforeEach(() => {
         jasmine.clock().install();
         count = 0;
      });

      afterEach(() => {
         jasmine.clock().uninstall();
      });

      it('delivers all tokens', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');

         s.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(XmlToken.ElementStart);
                  break;
               case 1:
                  expect(data).toBeInstanceOf(XmlToken.CharData);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(XmlToken.ElementEnd);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }

            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(3);
      });

      it('can have a read done while in the handler', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');

         s.on('data', (error, data) => {
            if (count === 0) {
               const next = s.getNext();
               expect(next instanceof XmlToken.CharData).toEqual(true);
               count += 10;
            }

            switch (count) {
               case 10:
                  expect(data).toBeInstanceOf(XmlToken.ElementStart);
                  break;
               case 11:
                  expect(data).toBeInstanceOf(XmlToken.ElementEnd);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }

            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(12);
      });

      it('delivers only errors to "error" handler', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');

         s.on('error', (error) => {
            switch (count) {
               case 0:
                  expect(error.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               default:
                  expect(error).toEqual('this should not happen');
            }

            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(1);
      });

      it('delivers only tokens to "token" handler', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');

         s.on('token', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(XmlToken.ElementStart);
                  break;
               case 1:
                  expect(data).toBeInstanceOf(XmlToken.CharData);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(XmlToken.ElementEnd);
                  break;
               case 3:
                  expect(data).toBeInstanceOf(XmlToken.TextDeclaration);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }
            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(4);
      });

      it('delivers tokens and errors to "data" handler in a lax stream', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');

         s.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(XmlToken.ElementStart);
                  break;
               case 1:
                  expect(data).toBeInstanceOf(XmlToken.CharData);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(XmlToken.ElementEnd);
                  break;
               case 3:
                  expect(error.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               case 4:
                  expect(data).toBeInstanceOf(XmlToken.TextDeclaration);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }
            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(5);
      });

      it('delivers tokens and errors to "data" handler in a strict stream without throwing an exception', () => {
         const s = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');

         s.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(XmlToken.ElementStart);
                  break;
               case 1:
                  expect(data).toBeInstanceOf(XmlToken.CharData);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(XmlToken.ElementEnd);
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

      it('delivers no data after an error token with a strit stream', () => {
         const s = makeStrictExternalEntityStream('foo<?xml encoding="utf-8"?>');

         s.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(XmlToken.CharData);
                  break;
               case 1:
                  expect(error.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }
            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(2);
      });

      it('delivers data after an error token with a lax stream', () => {
         const s = makeLaxExternalEntityStream('foo<?xml encoding="utf-8"?>');

         s.on('data', (error, data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(XmlToken.CharData);
                  break;
               case 1:
                  expect(error.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  break;
               case 2:
                  expect(data).toBeInstanceOf(XmlToken.TextDeclaration);
                  break;
               default:
                  expect(data).toEqual('this should not happen');
            }
            count++;
         });
         jasmine.clock().tick(1);

         expect(count).toEqual(3);
      });

      describe('end', () => {

         it('delivers an "end" event when all tokens consumed', () => {
            const s = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');
            let endCount = 0;

            s.on('data', () => {
               count++;
            });
            s.on('end', () => {
               expect(count).toEqual(4);
               endCount++;
            });
            jasmine.clock().tick(1);

            expect(count).toEqual(4);
            expect(endCount).toEqual(1);
         });

         it('delivers an "end" event after "error" in a strict stream', () => {
            const s = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');
            let endCount = 0;

            s.on('error', () => {
               count++;
            });
            s.on('end', () => {
               expect(count).toEqual(1);
               endCount++;
            });
            jasmine.clock().tick(1);

            expect(count).toEqual(1);
            expect(endCount).toEqual(1);
         });

         it('delivers an "end" event after throwing an exception in a getNext()', () => {
            const s = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');
            let endCount = 0;

            s.on('data', () => {
               s.getNext();   // consume foo
               s.getNext();   // consume </one>
               try {
                  s.getNext();   // get the error
               } catch (e) {
                  // do nothing.
               }
               count++;
               expect(endCount).toEqual(0);
            });
            s.on('end', () => {
               expect(count).toEqual(1);
               endCount++;
            });
            jasmine.clock().tick(1);

            expect(count).toEqual(1);
            expect(endCount).toEqual(1);
         });

      });

   });

   describe('getNext()', () => {

      it('retrieves all tokens', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');

         expectTokenType(s, XmlToken.ElementStart);
         expectTokenType(s, XmlToken.CharData);
         expectTokenType(s, XmlToken.ElementEnd);
         expect(s.getNext()).toBeUndefined();
      });

      it('will not start a subsequent async call if one is already in progress (whitebox)', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');
         // We have to fake async behavior because the stream isn't fully async-capable yet.
         spyOn(s, '_innerNext');
         spyOn(s, '_setEnded');

         const token = s.getNext();
         expect(token).toBeUndefined();

         s.getNext();
         expect(s._innerNext.calls.count()).toEqual(1);
      });

      it('throws an error if an error is found in a strict stream', () => {
         const s = makeStrictExternalEntityStream('foo<?XML encoding="ff"?>');

         ignoreToken(s, XmlToken.CharData);

         expect(() => {
            s.getNext();
         }).toThrowError('"xml" must be lower case. Found "XML".');
      });

      it('throws no error if an error is found in a lax stream', () => {
         const s = makeLaxExternalEntityStream('foo<?XML encoding="ff"?>');

         ignoreToken(s, XmlToken.CharData);

         expect(() => {
            s.getNext();
         }).not.toThrow();
      });

      it('will deliver no other data after an exception in a strict stream', () => {
         const s = makeStrictExternalEntityStream('foo<?XML encoding="ff"?>');

         ignoreToken(s, XmlToken.CharData);
         expect(() => {
            s.getNext();
         }).toThrowError('"xml" must be lower case. Found "XML".');

         expect(s.getNext()).toBeUndefined();
      });

      it('will deliver other data after an exception in a lax stream', () => {
         const s = makeLaxExternalEntityStream('foo<?xml encoding="ff"?>');

         ignoreToken(s, XmlToken.CharData);
         ignoreError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT);

         expectTokenType(s, XmlToken.TextDeclaration);
      });

      it('will deliver no other data after an exception in a strict stream with an error in the dtd', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE foo  [] ');

         ignoreToken(s, XmlToken.XmlDeclaration);
         ignoreToken(s, XmlToken.DocTypeStart);
         expect(() => {
            s.getNext();
         }).toThrowError('Missing closing ">" for in the document type.');

         expect(s.getNext()).toBeUndefined();
      });

   });

   describe('parsing whitespace', () => {

      it('retrieves a token of type SPACE', () => {
         const s = makeStrictStream('<?xml version="1.0"?> \n  ');
         ignoreToken(s, XmlToken.XmlDeclaration);

         expectTokenType(s, XmlToken.Space);
      });

      it('retrieves a token of type SPACE in a DTD context', () => {
         const s = makeStrictExternalSubsetStream(' \n  ');

         expectTokenType(s, XmlToken.Space);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream(' \t ');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.WithSpaceChunk(' \t ', ' \t ')
         ]));
      });

      describe('state transitions', () => {

         it('throws an error if at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               ' \t ',
               SyntaxError.ID.SPACE_INVALID_CONTEXT,
               'The XML Declaration must appear before any content in the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream(' \t ');

            expectTokenType(s, XmlToken.Space);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream(' \t ');

            expectTokenType(s, XmlToken.Space);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?> \t ');
            ignoreToken(s, XmlToken.XmlDeclaration);

            expectTokenType(s, XmlToken.Space);
         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?> \t ');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.Space);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?> \t ');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.Space);
         });

      });

   });

   describe('parsing CharData', () => {

      it('retrieves a token of type CHARDATA', () => {
         const s = makeStrictExternalEntityStream('wow zowie ');

         expectTokenType(s, XmlToken.CharData);
      });

      it('retrieves a token with the specified data', () => {
         const s = makeStrictExternalEntityStream('wow zowie ');

         const t = s.getNext();
         expect(t.text).toEqual('wow zowie ');
      });

      it('retrieves a token with the specified data up to the markup', () => {
         const s = makeStrictExternalEntityStream('wow <zowie> ');

         const t = s.getNext();
         expect(t.text).toEqual('wow ');
         expectTokenType(s, XmlToken.ElementStart);
      });

      it('retrieves a token with the specified data up to a reference', () => {
         const s = makeStrictExternalEntityStream('wow &amp; ');

         const t = s.getNext();
         expect(t.text).toEqual('wow ');
      });

      it('throws an error token if there is a ]]> in the CharData', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            'testing testing ]]> testing',
            SyntaxError.ID.CHARDATA_INVALID_TEXT,
            '"]]>" must not appear in in character data.');
      });

      it('includes the "]]>" as char data in lax mode', () => {
         const s = makeLaxExternalEntityStream('testing testing ]]>testing');
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_TEXT);

         expect(s.getNext().text).toEqual('testing testing ');
         expect(s.getNext().text).toEqual(']]>');
         expect(s.getNext().text).toEqual('testing');
      });

      it('includes the "]]>" as char data in lax mode, even when there are no preceeding data', () => {
         const s = makeLaxExternalEntityStream(']]>testing');
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_TEXT);

         expect(s.getNext().text).toEqual(']]>');
         expect(s.getNext().text).toEqual('testing');
      });

      it('can read CharData not at the beginning of the cursor', () => {
         const s = makeStrictStream('<?xml version="1.0"?><start>testing testing </start>');
         ignoreToken(s, XmlToken.XmlDeclaration);
         ignoreToken(s, XmlToken.ElementStart);

         const t = s.getNext();
         expect(t.text).toEqual('testing testing ');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('wow zowie ');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.WithSpaceChunk('wow zowie ', 'wow zowie ')
         ]));
      });

      describe('state transitions', () => {

         it('throws an error if at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               'xxx',
               SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT,
               'CharData must not be outside the content of the document entity. Found "xxx".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               'xxx',
               SyntaxError.ID.CHARDATA_INVALID_SUBSET_CONTEXT,
               'CharData must not be in the external subset. Found "xxx".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('xxx');

            expectTokenType(s, XmlToken.CharData);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('xxx<?xml encoding="usascii"?>');
            ignoreToken(s, XmlToken.CharData);

            expect(() => {
               s.getNext();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>xxx');
            ignoreToken(s, XmlToken.XmlDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('CharData must not be outside the content of the document entity. Found "xxx".');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>xxx');
            ignoreToken(s, XmlToken.TextDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('CharData must not be in the external subset. Found "xxx".');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>xxx');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.CharData);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>xxx</one>');
            ignoreToken(s, XmlToken.XmlDeclaration);
            ignoreToken(s, XmlToken.ElementStart);

            expectTokenType(s, XmlToken.CharData);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('xx<?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.CharData);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

         // Whitebox: don't check all the other possible cases, aside from below, since the report logic is common.
         it('throws an error if found along with "]]>" at the start of the document entity', () => {
            const s = makeLaxStream('xxx]]>');
            ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_TEXT);

            expectError(s, SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT,
               'CharData must not be outside the content of the document entity. Found "xxx".');
            ignoreToken(s, XmlToken.CharData);

            expectError(s, SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT,
               'CharData must not be outside the content of the document entity. Found "]]>".');
            ignoreToken(s, XmlToken.CharData);
         });

         it('retrieves the expected chunks when it finds "]]>"', () => {
            const s = makeLaxExternalEntityStream('wow]]>');

            ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_TEXT);
            ignoreToken(s, XmlToken.CharData);
            const t = s.getNext();
            expect(t.chunks).toEqual(makeStringTokenArray([
               new TextChunk.PlainChunk(']]>', ']]>')
            ], 3));
         });
      });

   });

   describe('parsing character reference', () => {

      it('retrieves a token of type CharRef', () => {
         const s = makeStrictExternalEntityStream('&#65;');

         expectTokenType(s, XmlToken.CharRef);
      });

      it('produces a token with the specified character using a decimal reference', () => {
         const s = makeStrictExternalEntityStream('&#65;');

         const t = s.getNext();
         expect(t.text).toEqual('A');
      });

      it('produces a token with the specified character using a hex reference', () => {
         const s = makeStrictExternalEntityStream('&#x4E;');

         const t = s.getNext();
         expect(t.text).toEqual('N');
      });

      it('throws an error if there is a space after the &', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '& #65;',
            SyntaxError.ID.REFERENCE_XTRA_SPACE,
            'Must not have space in an entity reference.');
      });

      it('reports an error if there is a space after the #', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&# 65;',
            SyntaxError.ID.CHARREF_XTRA_SPACE,
            'Must not have a space after the "#" in a character reference.');
      });

      it('throws an error if the "x" in a hex reference is the wrong case', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#X41;',
            SyntaxError.ID.CHARREF_INVALID_HEX_CASE,
            '"x" in a hexadecimal character reference must be lower case.');
      });

      it('reports an error if a space is found after the  "x" in a hex reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#x 41;',
            SyntaxError.ID.CHARREF_XTRA_SPACE_BEFORE_DIGITS,
            'Must not have spaces before digits in a character reference.');
      });

      it('reports an error if no digits found in a character reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#;',
            SyntaxError.ID.CHARREF_NO_DIGITS,
            'Missing digits in a character reference.');
      });

      it('throws an error if space is found after digits in a character reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#12 ;',
            SyntaxError.ID.CHARREF_XTRA_SPACE_AFTER_DIGITS,
            'Must not have spaces after digits in a character reference.');
      });

      it('throws an error if no semicolon is found after digits in a character reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#12</end>',
            SyntaxError.ID.CHARREF_NO_SEMICOLON,
            'Must have a ";" after a character reference.');
      });

      it('reports an error if hex digits found in a decimal character reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#4e;',
            SyntaxError.ID.CHARREF_INVALID_BASE,
            'A decimal character reference must not contain hex digits. Found "4e".');
      });

      it('recognizes hex digits even if specified as decimal', () => {
         const s = makeLaxExternalEntityStream('&#4e;');
         ignoreError(s, SyntaxError.ID.CHARREF_INVALID_BASE);

         expect(s.getNext().text).toEqual('N');
      });

      it('can read when not at the beginning of the cursor', () => {
         const s = makeStrictExternalEntityStream('<start>&#65;</start>');
         ignoreToken(s, XmlToken.ElementStart);

         const t = s.getNext();
         expect(t.text).toEqual('A');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('&#x42;');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.PlainChunk('#'),
            new TextChunk.PlainChunk('x'),
            new TextChunk.DigitChunk('42', true),
            new TextChunk.PlainChunk(';')
         ]));
      });

      describe('state transitions', () => {

         it('throws an error if at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '&#50;',
               SyntaxError.ID.CHARREF_INVALID_DOC_CONTEXT,
               'A character reference must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '&#50;',
               SyntaxError.ID.CHARREF_INVALID_SUBSET_CONTEXT,
               'A character reference must not be in the external subset.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&#50;');

            expectTokenType(s, XmlToken.CharRef);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&#50;<?xml encoding="usascii"?>');
            ignoreToken(s, XmlToken.CharRef);

            expect(() => {
               s.getNext();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>&#50;');
            ignoreToken(s, XmlToken.XmlDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('A character reference must not be outside the content of the document entity.');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>&#50;');
            ignoreToken(s, XmlToken.TextDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('A character reference must not be in the external subset.');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>&#50;');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.CharRef);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>&#50;</one>');
            ignoreToken(s, XmlToken.XmlDeclaration);
            ignoreToken(s, XmlToken.ElementStart);

            expectTokenType(s, XmlToken.CharRef);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('&#50;<?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.CharRef);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('parsing entity reference', () => {

      it('throws an error if there is no entity name', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
            '&;',
            SyntaxError.ID.REFERENCE_NO_NAME,
            'Missing name in entity reference.');
      });

      it('throws an error if there is a space after the entity name', () => {
         expectSyntaxError('&frog ;',
            SyntaxError.ID.REFERENCE_XTRA_TRAILING_SPACE,
            'Must not have a space after the entity reference "frog".');
      });

      it('throws an error if there is no closing semicolon', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
            '&frog',
            SyntaxError.ID.REFERENCE_NO_SEMICOLON,
            'Missing semicolon after entity reference "frog".');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('&lt;');

         let t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.WordChunk('lt', true, true),
            new TextChunk.PlainChunk(';')
         ]));

         // end entity has no chunks
         t = s.getNext();
         expect(t.chunks).toEqual([]);
      });

      describe('state transitions', () => {

         it('throws an error if at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '&amp;',
               SyntaxError.ID.REFERENCE_INVALID_DOC_CONTEXT,
               'An entity reference must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '&amp;',
               SyntaxError.ID.REFERENCE_INVALID_SUBSET_CONTEXT,
               'An entity reference must not be in the external subset.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&amp;');

            expectTokenType(s, XmlToken.EntityStart);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&amp;<?xml encoding="usascii"?>');
            ignoreToken(s, XmlToken.EntityStart);
            ignoreToken(s, XmlToken.EntityEnd);

            expect(() => {
               s.getNext();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>&amp;');
            ignoreToken(s, XmlToken.XmlDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('An entity reference must not be outside the content of the document entity.');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>&amp;');
            ignoreToken(s, XmlToken.TextDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('An entity reference must not be in the external subset.');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>&amp;');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.EntityStart);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>&amp;</one>');
            ignoreToken(s, XmlToken.XmlDeclaration);
            ignoreToken(s, XmlToken.ElementStart);

            expectTokenType(s, XmlToken.EntityStart);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('&amp;<?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.EntityStart);
            ignoreToken(s, XmlToken.EntityEnd);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('parsing CDATA', () => {

      it('retrieves a token of type CDATA', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ blah ]]>');

         expectTokenType(s, XmlToken.CData);
      });

      it('retrieves the content of the CDATA ', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ test data ]]>');

         expect(s.getNext().text).toEqual(' test data ');
      });

      it('retrieves the content of the CDATA, ignoring any embedded markup', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ test <?foo bar?> <!-- data --> <start></end> ]]>');

         expect(s.getNext().text).toEqual(' test <?foo bar?> <!-- data --> <start></end> ');
      });

      it('retrieves undefined as the value for an empty CDATA block', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[]]>');

         expect(s.getNext().text).toBeUndefined();
      });

      it('throws an error if EOF found in middle', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![CDATA[junk comment',
            SyntaxError.ID.CDATA_NO_CLOSE,
            'Missing closing "]]>" in CDATA section.');
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeLaxExternalEntityStream('<![CDATA[ junk cdata');
         ignoreError(s, SyntaxError.ID.CDATA_NO_CLOSE);

         expect(s.getNext().text).toEqual(' junk cdata');
      });

      it('throws an error if space found before first square bracket', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<! [CDATA[junk comment ]]>',
            SyntaxError.ID.BRACKETITEM_XTRA_SPACE_BEFORE,
            'Must not have space before opening "[".');
      });

      it('throws an error if space found before CDATA', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![   CDATA[junk comment ]]>',
            SyntaxError.ID.CDATA_XTRA_SPACE_BEFORE,
            'Must not have space before CDATA.');
      });

      it('throws an error if space found after CDATA', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![CDATA    [junk comment ]]>',
            SyntaxError.ID.CDATA_XTRA_SPACE_AFTER,
            'Must not have space after CDATA.');
      });

      it('throws an error if CDATA has wrong case', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![cDaTa[junk comment ]]>',
            SyntaxError.ID.CDATA_INVALID_CASE,
            '"CDATA" must be capitalized. Found "cDaTa".');
      });

      it('generates an error token in lax mode if space found after CDATA', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![cdata[junk comment ]]>',
            SyntaxError.ID.CDATA_INVALID_CASE,
            '"CDATA" must be capitalized. Found "cdata".');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ one ]]>');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!'),
            new TextChunk.PlainChunk('['),
            new TextChunk.WordChunk('CDATA', true, true),
            new TextChunk.PlainChunk('['),
            new TextChunk.WithSpaceChunk(' one ', ' one '),
            new TextChunk.PlainChunk(']]>')
         ]));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '<![CDATA[ test ]]>',
               SyntaxError.ID.CDATA_INVALID_DOC_CONTEXT,
               'A CDATA must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '<![CDATA[ test ]]>',
               SyntaxError.ID.CDATA_INVALID_SUBSET_CONTEXT,
               'A CDATA must not be in the external subset.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<![CDATA[ test ]]>');

            expectTokenType(s, XmlToken.CData);
         });

         it('can appear with element content in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><name><![CDATA[ test ]]></name>');
            ignoreToken(s, XmlToken.XmlDeclaration);
            ignoreToken(s, XmlToken.ElementStart);

            expectTokenType(s, XmlToken.CData);

         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="foo"?><![CDATA[ test ]]>');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectError(s, SyntaxError.ID.CDATA_INVALID_SUBSET_CONTEXT,
               'A CDATA must not be in the external subset.');
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="foo"?><![CDATA[ test ]]>');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.CData);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<![CDATA[ test ]]><?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.CData);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('parsing BangItem', () => {

      it('reports an error if an unknown bang item found', () => {
         expectSyntaxError('<!FISH ',
            SyntaxError.ID.BANGITEM_UNKNOWN,
            'Unkown "<!" item.');
      });

      it('throws an error if an unknown name appears in a <![xxx[ construction', () => {
         expectSyntaxError('<![Test[ ]]',
            SyntaxError.ID.BRACKETITEM_UNKNOWN,
            'Unknown "<![" item. Found "Test".');
      });

      it('reports an error if there is no name provided', () => {
         expectSyntaxError('<![[',
            SyntaxError.ID.BRACKETITEM_NO_NAME,
            'Missing name in a "<![" item.');
      });

      it('generates an error token in lax mode if there is no name provided', () => {
         expectSyntaxError('<![[ ]]>',
            SyntaxError.ID.BRACKETITEM_NO_NAME,
            'Missing name in a "<![" item.');
      });

      it('generates an error token in lax mode if EOF in the middle of the constructon', () => {
         expectSyntaxError('<![',
            SyntaxError.ID.BRACKETITEM_NO_NAME,
            'Missing name in a "<![" item.');
      });

      it('reports an error if there is no second square bracket', () => {
         expectSyntaxError('<![Name ]]>',
            SyntaxError.ID.BRACKETITEM_NO_SECOND_BRACKET,
            'Missing a second opening square bracket.');
      });

      it('generates an error token in lax mode if there is no second square bracket', () => {
         expectSyntaxError('<![Testing]]>',
            SyntaxError.ID.BRACKETITEM_NO_SECOND_BRACKET,
            'Missing a second opening square bracket.');
      });

      it('generates an error token in lax mode if there is an EOF before the second [', () => {
         expectSyntaxError('<![Testing',
            SyntaxError.ID.BRACKETITEM_NO_SECOND_BRACKET,
            'Missing a second opening square bracket.');
      });

      it('reports an error if a space is found before the name', () => {
         expectSyntaxError('<! NAME>',
            SyntaxError.ID.BANGITEM_NAME_XTRA_SPACE_BEFORE,
            'Must not have space before the name in a "<!" item.');
      });

      it('throws an error if there is no name for the bang item', () => {
         expectSyntaxError('<!>',
            SyntaxError.ID.BANGITEM_NO_NAME,
            'Must have a name for a "<!" item.');
      });

      it('throws an error if the type name is the wrong case', () => {
         expectSyntaxError('<!docType >',
            SyntaxError.ID.BANGITEM_NAME_INVALID_CASE,
            '"DOCTYPE" must be upper case. Found "docType".');
      });

      it('throws a syntax error if no space after the declaration name', () => {
         expectSyntaxError('<!DOCTYPE>',
            SyntaxError.ID.BANGITEM_NAME_XTRA_SPACE_AFTER,
            'Must not have space after "DOCTYPE" of a "<!" item.');
      });

   });

   describe('parsing comments', () => {

      it('retrieves a token of type COMMENT', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         expectTokenType(s, XmlToken.Comment);
      });

      it('retrieves the content of the comment', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         expect(s.getNext().content).toEqual(' one ');
      });

      it('retrieves undefined as the value for an empty comment', () => {
         const s = makeStrictExternalEntityStream('<!---->');

         expect(s.getNext().content).toBeUndefined();
      });

      it('throws an error if no --> found', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<!--junk comment',
            SyntaxError.ID.COMMENT_NO_CLOSE,
            'Missing closing --> in a comment.',
            new Offset(0, 16, 16),
            [ new Offset(0, 0, 0) ]);
      });

      it('throws an error if no --> found immediately after the opening', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<!--',
            SyntaxError.ID.COMMENT_NO_CLOSE,
            'Missing closing --> in a comment.',
            new Offset(0, 4, 4),
            [ new Offset(0, 0, 0) ]);
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeLaxExternalEntityStream('<!--junk comment');
         ignoreError(s, SyntaxError.ID.COMMENT_NO_CLOSE);

         expect(s.getNext().content).toEqual('junk comment');
      });

      it('throws an error if comment ends with a -', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<!--junk comment--->',
            SyntaxError.ID.COMMENT_ENDS_WITH_HYPHEN,
            'Must not have a hyphen at end of a comment.',
            new Offset(0, 16, 16),
            [ new Offset(0, 0, 0) ]);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!--'),
            new TextChunk.WithSpaceChunk(' one ', ' one '),
            new TextChunk.PlainChunk('-->')
         ]));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '<!-- testComment -->',
               SyntaxError.ID.COMMENT_INVALID_CONTEXT,
               'A comment must not be the first thing in the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!-- testComment -->');

            expectTokenType(s, XmlToken.Comment);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<!-- testComment -->');

            expectTokenType(s, XmlToken.Comment);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!-- testComment -->');
            ignoreToken(s, XmlToken.XmlDeclaration);

            expectTokenType(s, XmlToken.Comment);

         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="foo"?><!-- testComment -->');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.Comment);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="foo"?><!-- testComment -->');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.Comment);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<!-- testComment --><?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.Comment);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes state in an external subset to be in the DTD', () => {
            const s = makeLaxExternalSubsetStream('<!-- testComment --><name>');
            ignoreToken(s, XmlToken.Comment);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".');
         });

      });

   });

   describe('parsing processing instruction', () => {

      it('retrieves a token of type PI', () => {
         const s = makeStrictExternalEntityStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         expectTokenType(s, XmlToken.ProcessingInstruction);
      });

      it('retrieves a token with the right target name', () => {
         const s = makeStrictExternalEntityStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         const t = s.getNext();
         expect(t.target).toEqual('foo');
      });

      it('retrieves a token with the right target content', () => {
         const s = makeStrictExternalEntityStream('<?foo blah blah boo boo !@#$%^&^*()_+ ?>');

         const t = s.getNext();
         expect(t.content).toEqual('blah blah boo boo !@#$%^&^*()_+ ');
      });

      it('retrieves one with no content', () => {
         const s = makeStrictExternalEntityStream('<?foo?>');

         const t = s.getNext();
         expect(t.content).toBeUndefined();
      });

      it('allows whitespace but no content', () => {
         const s = makeStrictExternalEntityStream('<?foo    ?>');

         const t = s.getNext();
         expect(t.content).toBeUndefined();
      });

      it('throws an error if no ?> found', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?frog glorky',
            SyntaxError.ID.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 13, 13));
      });

      it('throws an error if no ?> found after space after target', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?frog ',
            SyntaxError.ID.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 7, 7));
      });

      it('throws an error if no ?> found after target', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?frog',
            SyntaxError.ID.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 6, 6));
      });

      it('sets the right offset when finding no ?> found after opening', () => {
         const s = makeLaxExternalEntityStream('<?');
         ignoreError(s, SyntaxError.ID.PI_NO_TARGET);

         const t = s.getNext();
         expect(t.place).toEqual(new Offset(0, 2, 2));
      });

      it('returns the content up to EOF if no ?> found in lax mode', () => {
         const s = makeLaxExternalEntityStream('<?foo glorky');
         ignoreError(s, SyntaxError.ID.PI_NO_CLOSE);

         expect(s.getNext().content).toEqual('glorky');
      });

      it('throws an error if a space is between the <? and the target', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<? foo glorky?>',
            SyntaxError.ID.PI_SPACE_BEFORE_TARGET,
            'Must not have a space before the target name.',
            new Offset(0, 2, 2));
      });

      it('throws an error if the name does not match the name syntax', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?frog$ glorky?>',
            SyntaxError.ID.PI_TARGET_NAME_INVALID,
            'The target name must match the syntax for names. Found: "frog$".',
            new Offset(0, 2, 2));
      });

      it('throws an error if there is no target', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<??>',
            SyntaxError.ID.PI_NO_TARGET,
            'Missing target name in a processing instruction.',
            new Offset(0, 2, 2));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '<?foo bar?>',
               SyntaxError.ID.PI_INVALID_CONTEXT,
               'A processing instruction must not be the first thing in the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?foo bar?>');

            expectTokenType(s, XmlToken.ProcessingInstruction);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?foo bar?>');

            expectTokenType(s, XmlToken.ProcessingInstruction);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><?foo bar?>');
            ignoreToken(s, XmlToken.XmlDeclaration);

            expectTokenType(s, XmlToken.ProcessingInstruction);

         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="foo"?><?foo bar?>');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.ProcessingInstruction);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="foo"?><?foo bar?>');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.ProcessingInstruction);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<?foo bar?><?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.ProcessingInstruction);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes state in an external subset to be in the DTD', () => {
            const s = makeLaxExternalSubsetStream('<?foo bar?><name>');
            ignoreToken(s, XmlToken.ProcessingInstruction);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".');
         });

      });

   });

   describe('parsing XML Declaration', () => {

      it('can get a syntactically correct one', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         expect(t).toBeInstanceOf(XmlToken.XmlDeclaration);
      });

      it('retrieves the number of parameters in the declaration', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         expect(t.params.length).toEqual(3);
      });

      it('retrieves parameters in order', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         compareXmlDeclAttribute(t.params[1], 'encoding', 'usascii');
         compareXmlDeclAttribute(t.params[2], 'standalone', 'yes');
      });

      it('does not do attribute value normalization on values', () => {
         const s = makeLaxStream('<?xml version="1.1" encoding="usas\ncii" standalone="yes"?>');
         ignoreError(s, SyntaxError.ID.XMLDECL_ENCODING_INVALID);

         const t = s.getNext();
         compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         compareXmlDeclAttribute(t.params[1], 'encoding', 'usas\ncii');
         compareXmlDeclAttribute(t.params[2], 'standalone', 'yes');
      });

      it('allows a space between the <? and the target if in lax mode', () => {
         const s = makeLaxStream('<? xml version="1.1"?>');

         let t = s.getNext();
         expect(t).toBeInstanceOf(SyntaxError);
         t = s.getNext();
         expect(t).toBeInstanceOf(XmlToken.XmlDeclaration);
      });

      it('throws an error if a space is between the <? and the target', () => {
         expectSyntaxError('<? xml version="1.1"?>',
            SyntaxError.ID.PI_SPACE_BEFORE_TARGET,
            'Must not have a space before the target name.',
            new Offset(0, 2, 2));
      });

      it('throws an error the xml after <? is in mixed case if in strict mode', () => {
         expectSyntaxError('<?XmL version="1.1"?>',
            SyntaxError.ID.XMLDECL_TARGET_INVALID_CASE,
            '"xml" must be lower case. Found "XmL".',
            new Offset(0, 2, 2));
      });

      it('allows < in a values even if lax:allowOpenAngleBracketsInAttributeValues is false', () => {
         const s = makeStream('<?xml version="1.1" encoding="frog<"?>', new XmlEntityManager(), {
            lax: true,
            'lax:allowOpenAngleBracketsInAttributeValues': false
         });

         expect(s.getNext().id).toEqual(SyntaxError.ID.XMLDECL_ENCODING_INVALID);
      });

      describe('"attribute" equal signs', () => {

         it('accepts spaces around the equal signs, as per the spec', () => {
            const s = makeStrictStream('<?xml version =         "1.1"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('throws an error if there is no equal sign', () => {
            const s = makeStrictStream('<?xml version "1.1"?>');

            expect(() => {
               s.getNext();
            }).toThrowError('"version" must be followed by an "=".');
         });

         it('accepts the lack of an equal sign in lax mode', () => {
            const s = makeLaxStream('<?xml version "1.1"?>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

      });

      describe('"attribute" quotes', () => {

         it('accepts single quotes', () => {
            const s = makeStrictStream('<?xml version =\'1.1\'?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('accepts double quotes', () => {
            const s = makeStrictStream('<?xml version ="1.1"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('throws an error if there is no quote', () => {
            const s = makeStrictStream('<?xml version=1.1 ?>');

            expect(() => {
               s.getNext();
            }).toThrowError('The value for "version" must be quoted.');
         });

         it('throws no error in lax mode', () => {
            const s = makeLaxStream('<?xml version=1.1 ?>');

            const t = s.getNext();

            expect(t.id).toEqual(SyntaxError.ID.ATTRIBUTE_NO_QUOTE);
         });

         it('makes the best guess for the attr value if no quotes', () => {
            const s = makeLaxStream('<?xml version=1.1 ?>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no quotes', () => {
            const s = makeLaxStream('<?xml version=1.1?>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no equal and no quotes', () => {
            const s = makeLaxStream('<?xml version 1.1?>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.XMLDECL_VERSION_INVALD);
            ignoreError(s, SyntaxError.ID.XMLDECL_ATTR_UNKNOWN);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', undefined);
         });

      });

      it('throws an error if there is no space after a value', () => {
         expectSyntaxError('<?xml version="1.1"encoding="usascii" standalone="yes"?>',
            SyntaxError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            '"encoding" must have a space before it.',
            new Offset(0, 19, 19));
      });

      it('throws an error if no parameters are included', () => {
         expectSyntaxError('<?xml ?>',
            SyntaxError.ID.XMLDECL_NO_ATTRIBUTES,
            'Missing version in an XML or Text Declaration.');
      });

      it('throws an error if an unknown parameter is provided', () => {
         const s = makeStrictStream('<?xml bogus="frog"?>');

         expect(() => {
            s.getNext();
         }).toThrowError('Unknown XML Declaration parameter "bogus".');
      });

      it('throws an error if the close is missing', () => {
         expectSyntaxError('<?xml version="1.0"',
            SyntaxError.ID.XMLDECL_NO_CLOSE,
            'Missing closing "?>" in an XML or Text Declaration.');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii"  ?>');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<?'),
            new TextChunk.WordChunk('xml', true, true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.WordChunk('version', true, true),
            new TextChunk.PlainChunk('='),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('1.1', '1.1'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.WordChunk('encoding', true, true),
            new TextChunk.PlainChunk('='),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('usascii', 'usascii'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('  ', '  '),
            new TextChunk.PlainChunk('?>')
         ]));
      });

      describe('version parameter', () => {

         it('accepts a value of "1.0"', () => {
            const s = makeStrictStream('<?xml version="1.0"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.0');
         });

         it('accepts a value of "1.1"', () => {
            const s = makeStrictStream('<?xml version="1.1"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('throws a syntax error if version is not a supported value', () => {
            expectSyntaxError('<?xml version="1.2" ?>',
               SyntaxError.ID.XMLDECL_VERSION_INVALD,
               '"version" must be "1.0" or "1.1". Found "1.2".');
         });

         it('reports a syntax error if version in wrong position', () => {
            const s = makeLaxStream('<?xml encoding="usascii" version="1.1"?>');
            ignoreError(s, SyntaxError.ID.XMLDECL_ENCODING_INVALID_ORDER);

            const t = s.getNext();
            expect(t.id).toEqual(SyntaxError.ID.XMLDECL_VERSION_INVALID_ORDER);
            expect(t.message).toEqual('"version" must be the first attribute. Found as #1.');
         });

         it('throws a syntax error if version is not the right case', () => {
            expectSyntaxError('<?xml VeRsIoN="1.1" ?>',
               SyntaxError.ID.XMLDECL_ATTR_INVALID_CASE,
               '"version" must be lower case. Found "VeRsIoN".');
         });

      });

      describe('encoding parameter', () => {

         it('accepts a value of "usascii0"', () => {
            const s = makeStrictStream('<?xml version="1.1"   encoding="usascii0"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[1], 'encoding', 'usascii0');
         });

         it('throws a syntax error if encoding is not rightly encoded', () => {
            expectSyntaxError('<?xml version="1.1" encoding="bogus$"?>',
               SyntaxError.ID.XMLDECL_ENCODING_INVALID,
               '"encoding" must be alphanumeric. Found "bogus$".');
         });

         it('throws a syntax error if encoding starts with a bad character', () => {
            expectSyntaxError('<?xml version="1.1" encoding="0usascii"?>',
               SyntaxError.ID.XMLDECL_ENCODING_INVALID,
               '"encoding" must be alphanumeric. Found "0usascii".');
         });

         it('throws an error if encoding found in the wrong position', () => {
            expectSyntaxError('<?xml encoding="frog" version="1.1" ?>',
               SyntaxError.ID.XMLDECL_ENCODING_INVALID_ORDER,
               '"encoding" must be after "version" and before "standalone".');
         });

         it('throws a syntax error if is not the right case', () => {
            expectSyntaxError('<?xml version="1.1" EnCoDiNG="bogys" ?>',
               SyntaxError.ID.XMLDECL_ATTR_INVALID_CASE,
               '"encoding" must be lower case. Found "EnCoDiNG".');
         });

      });

      describe('standalone parameter', () => {

         it('accepts a value of "no"', () => {
            const s = makeStrictStream('<?xml version="1.1" standalone="no"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[1], 'standalone', 'no');
         });

         it('accepts a value of "yes"', () => {
            const s = makeStrictStream('<?xml version="1.1" standalone="yes"?>');

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[1], 'standalone', 'yes');
         });

         it('throws an error if standalone in the wrong position', () => {
            expectSyntaxError('<?xml standalone="frog" ?>',
               SyntaxError.ID.XMLDECL_STANDALONE_INVALID_ORDER,
               '"standalone" must come after "version".');
         });

         it('throws a syntax error if standalone is not yes or no', () => {
            expectSyntaxError('<?xml version="1.1" standalone="bogus" ?>',
               SyntaxError.ID.XMLDECL_STANDALONE_INVALID,
               '"standalone" must be "yes" or "no". Found "bogus".');
         });

         it('throws a syntax error if is not the right case', () => {
            expectSyntaxError('<?xml version="1.1" STANDaLoNE="yes" ?>',
               SyntaxError.ID.XMLDECL_ATTR_INVALID_CASE,
               '"standalone" must be lower case. Found "STANDaLoNE".');
         });

         it('accepts the wrong case if lax', () => {
            expectSyntaxError('<?xml  version="1.1" STANDALONE="no" ?>',
               SyntaxError.ID.XMLDECL_ATTR_INVALID_CASE,
               '"standalone" must be lower case. Found "STANDALONE".');
         });

         it('returns the expected standalone value, even when wrong case used', () => {
            const s = makeLaxStream('<?xml  version="1.1" standalone="NO" ?>');
            ignoreError(s, SyntaxError.ID.XMLDECL_STANDALONE_INVALID_CASE);

            compareXmlDeclAttribute(s.getNext().params[1], 'standalone', 'no');
         });

         it('reports error if standalone value is wrong case', () => {
            expectSyntaxError('<?xml  version="1.1" standalone="NO" ?>',
               SyntaxError.ID.XMLDECL_STANDALONE_INVALID_CASE,
               '"no" must be lower case. Found "NO".');
         });

      });

      describe('state transition', () => {

         it('can be placed first in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?>');

            expectTokenType(s, XmlToken.XmlDeclaration);
         });

         it('can be placed after illegal content, but errors will be thrown', () => {
            const s = makeLaxStream('<test></test><?xml version="1.1" encoding="usascii"?>');
            ignoreError(s, SyntaxError.ID.ELEMENT_INVALID_DOC_CONTEXT);
            ignoreToken(s, XmlToken.ElementStart);
            ignoreError(s, SyntaxError.ID.ELEMENT_INVALID_DOC_CONTEXT);
            ignoreToken(s, XmlToken.ElementEnd);

            expectTokenType(s, XmlToken.XmlDeclaration);
         });

         it('changes the state to being in a the prolog', () => {
            const s = makeStrictStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE foo>');
            ignoreToken(s, XmlToken.XmlDeclaration);

            expectTokenType(s, XmlToken.DocTypeStart);
         });

      });

   });

   describe('parsing TextDecl', () => {

      it('can get a syntactically correct one', () => {
         const s = makeStrictExternalEntityStream('<?xml version="1.1" encoding="usascii"?>');

         expectTokenType(s, XmlToken.TextDeclaration);
      });

      it('retrieves the number of parameters in the declaration', () => {
         const s = makeStrictExternalEntityStream('<?xml version="1.1" encoding="usascii"?>');

         const t = s.getNext();
         expect(t.params.length).toEqual(2);
      });

      it('retrieves parameters in order', () => {
         const s = makeStrictExternalEntityStream('<?xml version="1.1" encoding="usascii"?>');

         const t = s.getNext();
         compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         compareXmlDeclAttribute(t.params[1], 'encoding', 'usascii');
      });

      it('understands no version in the declaration', () => {
         const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>');

         expectTokenType(s, XmlToken.TextDeclaration);
      });

      it('throws an error if a standalone value is present', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?xml version="1.1" standalone="NO" ?>',
            SyntaxError.ID.TEXTDECL_XTRA_STANDALONE,
            '"standalone" must not be in a Text Declaration.');
      });

      it('throws an error if a encoding is not present', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?xml version="1.1" ?>',
            SyntaxError.ID.TEXTDECL_NO_ENCODING,
            '"encoding" must be in a Text Declaration.',
            new Offset(0, 0, 0),
            [ new Offset(0, 0, 0) ]);
      });

      describe('state transition', () => {

         it('can be placed first in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?><!NOTATION x PUBLIC "x">');

            expectTokenType(s, XmlToken.TextDeclaration);
            ignoreToken(s, XmlToken.NotationDeclaration);
         });

         it('can be placed first in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?><name>');

            expectTokenType(s, XmlToken.TextDeclaration);
            ignoreToken(s, XmlToken.ElementStart);
         });

         it('throws an error if the Text Declaration is not the first thing in the external entity', () => {
            const s = makeStrictExternalEntityStream('<test></test><?xml version="1.1" encoding="usascii"?>');
            ignoreToken(s, XmlToken.ElementStart);
            ignoreToken(s, XmlToken.ElementEnd);

            expect(() => {
               s.getNext(); // start element
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if the Text Declaration is not the first thing in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!ENTITY foo "bar"><?xml version="1.1" encoding="usascii"?>');
            ignoreToken(s, XmlToken.EntityDeclaration);

            expect(() => {
               s.getNext(); // start element
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes the state to being in a DTD in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml version="1.1" encoding="usascii"?><name>');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".');
         });

         it('changes the state to being in content in an external entity', () => {
            const s = makeLaxExternalEntityStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE foo>');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_EXTERNAL_CONTEXT,
               'A DOCTYPE must not be declared in an external entity.');
         });

      });

   });

   describe('parsing start element tags', () => {

      it('retrieves a token of type START_ELEMENT', () => {
         const s = makeStrictExternalEntityStream('<name>');

         expectTokenType(s, XmlToken.ElementStart);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictExternalEntityStream('<name>');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves the name with a slash in it in lax mode', () => {
         const s = makeLaxExternalEntityStream('<n/ame>');
         ignoreError(s, SyntaxError.ID.ELEMENT_NAME_INVALID);

         const t = s.getNext();
         expect(t.name).toEqual('n/ame');
      });

      it('retrieves an empty name if there is no name in the start tag', () => {
         const s = makeLaxExternalEntityStream('<>');
         ignoreError(s, SyntaxError.ID.ELEMENT_NO_NAME);

         const t = s.getNext();
         expect(t.name).toEqual('');
      });

      it('allows S after the name', () => {
         const s = makeStrictExternalEntityStream('<name     >');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('throws an error if a space is found after the <', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '< name>',
            SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<9name>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".');
      });

      it('throws an error token if > is missing', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<name',
            SyntaxError.ID.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('throws an error if name is missing', () => {
         expectSyntaxError('<>',
            SyntaxError.ID.ELEMENT_NO_NAME,
            'Missing name in element tag.');
      });

      describe('with attributes', () => {

         it('can parse basic attributes', () => {
            const s = makeLaxExternalEntityStream('<elemName attr1="one" attr2="two">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken.Text('one') ],
               quoteType: '"'
            }, {
               name: 'attr2',
               value: [ new XmlToken.Text('two') ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes using single quotes', () => {
            const s = makeLaxExternalEntityStream('<elemName attr1=\'one\' attr2=\'two\'>');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken.Text('one') ],
               quoteType: '\''
            }, {
               name: 'attr2',
               value: [ new XmlToken.Text('two') ],
               quoteType: '\''
            } ]);
         });

         it('can parse attributes with whitespace around the equals', () => {
            const s = makeLaxExternalEntityStream('<elemName\n\tattr1\t\n=   \'one\' attr2   =\r\n\t "two">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken.Text('one') ],
               quoteType: '\''
            }, {
               name: 'attr2',
               value: [ new XmlToken.Text('two') ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference in the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&#x41;o">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken.Text('tw'),
                  new XmlToken.CharRef('A'),
                  new XmlToken.Text('o')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference at the start of the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="&#x41; test">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [
                  new XmlToken.CharRef('A'),
                  new XmlToken.Text(' test')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference at the end of the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&#x41;">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken.Text('tw'),
                  new XmlToken.CharRef('A')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with an entity reference in the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&quot;o">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken.Text('tw'),
                  new EntityStart('quot', false),
                  new XmlToken.EntityEnd('quot'),
                  new XmlToken.Text('o')
               ],
               quoteType: '"'
            } ]);
         });

         it('will accept a reference to an unknown entity', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&test;o">');
            const t = s.getNext();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken.Text('tw'),
                  new EntityStart('test', false),
                  new XmlToken.EntityEnd('test'),
                  new XmlToken.Text('o')
               ],
               quoteType: '"'
            } ]);
         });

         it('throws an error if there is a < in the attribute value', () => {
            expectSyntaxError('<elementName attr1="value<">',
               SyntaxError.ID.ATTRIBUTE_INVALID_VALUE,
               'The value of attribute "attr1" must not contain "<".');
         });

         it('throws an error if the attribute name is not a legal XML name', () => {
            expectSyntaxError('<elementName 1attr="value">',
               SyntaxError.ID.ATTRIBUTE_INVALID_NAME,
               'The attribute name must match the syntax for names. Found: "1attr".');
         });

         it('throws an error if there is no space between attributes', () => {
            expectSyntaxError('<elementName attr1="value"attr2="value2">',
               SyntaxError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
               '"attr2" must have a space before it.');
         });

         it('throws an error if there is no quote around the attribute value', () => {
            expectSyntaxError('<elementName attr1=value>',
               SyntaxError.ID.ATTRIBUTE_NO_QUOTE,
               'The value for "attr1" must be quoted.');
         });

         it('reads a single word if there is no quote', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1= value>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1', 'value');
         });

         it('throws an error if there is no equal sign', () => {
            expectSyntaxError('<elementName attr1 "value">',
               SyntaxError.ID.ATTRIBUTE_NO_EQUAL,
               '"attr1" must be followed by an "=".');
         });

         it('throws an error if there is no value', () => {
            expectSyntaxError('<elementName attr1= >',
               SyntaxError.ID.ATTRIBUTE_NO_VALUE,
               '"attr1" must have a value.');
         });

         it('throws an error if there is no closing quote', () => {
            expectSyntaxError('<elementName attr1="one>',
               SyntaxError.ID.ATTRIBUTE_NO_CLOSE_QUOTE,
               'The value for "attr1" must close with a quote.');
         });

         it('infers an equal sign and reads the value if in lax mode and equal missing', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1 "value one">');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1', 'value one');
         });

         it('reads a new name if both equal and quote are missing', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1  value one>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1', undefined);
            compareAttribute(t.attributes[1], 'value', undefined);
            compareAttribute(t.attributes[2], 'one', undefined);
         });

         it('returns undefined for values when they are not present', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1  value>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1', undefined);
            compareAttribute(t.attributes[1], 'value', undefined);
         });

         it('considers quotes in a name to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1"boo"  two=value>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1"boo"', undefined);
            compareAttribute(t.attributes[1], 'two', 'value');
         });

         it('does not consider a close angle bracket to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName one>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'one', undefined);
         });

         it('does not consider a close angle bracket to be part of the value in a bad value', () => {
            const s = makeLaxExternalEntityStream('<elementName one=two>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'one', 'two');
         });

         it('does not consider a close angle bracket to be part of the value when no equal', () => {
            const s = makeLaxExternalEntityStream('<elementName one >');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'one', undefined);
         });

         it('considers quotes at the start of the name to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName "one="vone"  \'two=vtwo>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], '"one', 'vone');
            compareAttribute(t.attributes[1], '\'two', 'vtwo');
         });

         it('handles eof in middle of name', () => {
            const s = makeLaxExternalEntityStream('<elementName nam');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'nam', undefined);
         });

         it('handles eof after equal', () => {
            const s = makeLaxExternalEntityStream('<elementName name=');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'name', undefined);
         });

         it('handles eof in value', () => {
            const s = makeLaxExternalEntityStream('<elementName name="one');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_CLOSE_QUOTE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'name', 'one');
         });

         it('handles eof at start of value', () => {
            const s = makeLaxExternalEntityStream('<elementName name="');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_CLOSE_QUOTE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'name', undefined);
         });

         it('throws an error if a < is found in an attribute', () => {
            expectSyntaxError('<elementName name="myvalue<one">',
               SyntaxError.ID.ATTRIBUTE_INVALID_VALUE,
               'The value of attribute "name" must not contain "<".');
         });

         it('terminates start tag and continues processing if an < in an attribute value in lax mode', () => {
            const s = makeLaxExternalEntityStream('<elementName name="one<two">');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_VALUE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            let t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
            ignoreError(s, SyntaxError.ID.ELEMENT_NAME_INVALID);

            t = s.getNext();
            expect(t.name).toEqual('two"');
         });

         it('considers < part of attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeLaxExternalEntityStream('<elementName name="one<two">', {
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one<two');
         });

         it('terminates start tag if an < in a quoteless attribute value in lax mode', () => {
            const s = makeLaxExternalEntityStream('<elementName name=one<two">');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_VALUE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            let t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
            ignoreError(s, SyntaxError.ID.ELEMENT_NAME_INVALID);

            t = s.getNext();
            expect(t.name).toEqual('two"');
         });

         it('terminates gracefully even when EOF at end of quoteless attribute value', () => {
            const s = makeLaxExternalEntityStream('<elementName name=one');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
         });

         it('considers < part of quoteless attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeLaxExternalEntityStream('<elementName name=one<two">', {
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'name', 'one<two"');
         });

         describe('basic (CDATA) normalization', () => {

            it('will replace spaces, newlines and tabs in ordinary text with spaces', () => {
               const s = makeStrictExternalEntityStream('<elemName attr1="space: , tab:\t, newline:\n, cr:\r">');
               const t = s.getNext();

               expect(t.attributes).toEqual([ {
                  name: 'attr1',
                  value: [ new XmlToken.Text('space: , tab: , newline: , cr: ') ],
                  quoteType: '"'
               } ]);
            });

            it('will not replace characters in character references', () => {
               const s = makeStrictExternalEntityStream('<el attr1="space:&#32;, tab:&#9;, newline:&#10;, cr:&#13;">');
               const t = s.getNext();

               expect(t.attributes).toEqual([ {
                  name: 'attr1',
                  value: [
                     new XmlToken.Text('space:'),
                     new XmlToken.CharRef(' '),
                     new XmlToken.Text(', tab:'),
                     new XmlToken.CharRef('\t'),
                     new XmlToken.Text(', newline:'),
                     new XmlToken.CharRef('\n'),
                     new XmlToken.Text(', cr:'),
                     new XmlToken.CharRef('\r')
                  ],
                  quoteType: '"'
               } ]);
            });

         });

      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<one >');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<'),
            new TextChunk.WordChunk('one', true, true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('>')
         ]));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '<name>',
               SyntaxError.ID.ELEMENT_INVALID_DOC_CONTEXT,
               'An element must not be before the Xml Declaration. Found "name".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '<name>',
               SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<name> ');

            expectTokenType(s, XmlToken.ElementStart);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><name> ');
            ignoreToken(s, XmlToken.XmlDeclaration);

            expectTokenType(s, XmlToken.ElementStart);
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="usascii"?><name>');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".');
         });

         it('can appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?><name>');
            ignoreToken(s, XmlToken.TextDeclaration);

            expectTokenType(s, XmlToken.ElementStart);
         });

         it('can not appear inside the internal subset', () => {
            const s = makeLaxStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE one [<one>]>');
            ignoreToken(s, XmlToken.XmlDeclaration);
            ignoreToken(s, XmlToken.DocTypeStart);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "one".');
         });

         it('can appear after the DOCTYPE in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE name><name> ');
            ignoreToken(s, XmlToken.XmlDeclaration);
            ignoreToken(s, XmlToken.DocTypeStart);
            ignoreToken(s, XmlToken.DocTypeEnd);

            expectTokenType(s, XmlToken.ElementStart);
         });

         it('can appear after the DOCTYPE with an internal subset in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE name [<!ENTITY entName "f">]><name> ');
            ignoreToken(s, XmlToken.XmlDeclaration);
            ignoreToken(s, XmlToken.DocTypeStart);
            ignoreToken(s, XmlToken.EntityDeclaration);
            ignoreToken(s, XmlToken.DocTypeEnd);

            expectTokenType(s, XmlToken.ElementStart);
         });

         it('changes state in an external entity so that the Text Declaration can not then be used', () => {
            const s = makeLaxExternalEntityStream('<name><?xml encoding="usascii"?>');
            ignoreToken(s, XmlToken.ElementStart);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes state in a document entity so that the DOCTYPE can not then be used', () => {
            const s = makeLaxStream('<?xml version="1.0"?><name><!DOCTYPE one>');
            ignoreToken(s, XmlToken.XmlDeclaration);
            ignoreToken(s, XmlToken.ElementStart);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_DOC_CONTEXT,
               'A DOCTYPE must be declared once between the XML Declaration and the content.');
         });

      });

   });

   describe('parsing empty element tags', () => {

      it('retrieves a token of type empty element', () => {
         const s = makeStrictExternalEntityStream('<name/>');

         expectTokenType(s, XmlToken.EmptyElement);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictExternalEntityStream('<name/>');

         expect(s.getNext().name).toEqual('name');
      });

      it('allows space after the name', () => {
         const s = makeStrictExternalEntityStream('<name     />');

         expect(s.getNext().name).toEqual('name');
      });

      it('retrieves attributes, if present', () => {
         const s = makeStrictExternalEntityStream('<name attr="one">');

         expect(s.getNext().attributes[0].name).toEqual('attr');
      });

      it('throws an error if a space is found after the <', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '< name/>',
            SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<9name/>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".');
      });

      it('throws an error if /> is missing', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<name',
            SyntaxError.ID.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('generates an error token if name is missing', () => {
         const s = makeLaxExternalEntityStream('< />'); // </> looks like a malformed end tag!
         ignoreError(s, SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE);

         expectError(s, SyntaxError.ID.ELEMENT_NO_NAME,
            'Missing name in element tag.');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<one />');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<'),
            new TextChunk.WordChunk('one', true, true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('/>')
         ]));
      });

      describe('state transitions', () => {

         // Whitebox: Most tests are not done here, as the code for open and empty tags is the same

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '<name/>',
               SyntaxError.ID.ELEMENT_INVALID_DOC_CONTEXT,
               'An element must not be before the Xml Declaration. Found "name".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '<name/>',
               SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<name/>');

            expectTokenType(s, XmlToken.EmptyElement);
         });

      });

   });

   describe('parsing end element tags', () => {

      it('retrieves a token of type ElementEnd', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name>');
         ignoreToken(s, XmlToken.XmlDeclaration);
         ignoreToken(s, XmlToken.ElementStart);

         expectTokenType(s, XmlToken.ElementEnd);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name>');
         ignoreToken(s, XmlToken.XmlDeclaration);
         ignoreToken(s, XmlToken.ElementStart);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves an empty name if there is no name in the end tag', () => {
         const s = makeLaxStream('<?xml version="1.0"?><name></>');
         ignoreToken(s, XmlToken.XmlDeclaration);
         ignoreToken(s, XmlToken.ElementStart);
         ignoreError(s, SyntaxError.ID.ELEMENT_NO_NAME);
         ignoreError(s, SyntaxError.ID.ELEMENT_UNBALANCED);

         const t = s.getNext();
         expect(t.name).toEqual('');
      });

      it('allows space after the name', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name     >');
         ignoreToken(s, XmlToken.XmlDeclaration);
         ignoreToken(s, XmlToken.ElementStart);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('throws an error if attributs found in the tag', () => {
         const s = makeLaxExternalEntityStream('<name></name attr1="one">');
         ignoreToken(s, XmlToken.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('throws an error if a space is found after the </', () => {
         const s = makeLaxExternalEntityStream('<name></ name>');
         ignoreToken(s, XmlToken.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error token if a space is found after the </', () => {
         const s = makeLaxExternalEntityStream('<name></ name>');
         ignoreToken(s, XmlToken.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error if a it finds the wrong close', () => {
         const s = makeLaxExternalEntityStream('<name></name/>');
         ignoreToken(s, XmlToken.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_END_INVALID_CLOSE,
            'End element tag must close with ">". Found "/>".');
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(
            ENTITY_TYPE.EXTERNAL_ENTITY,
            '</9name>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".'
         );
      });

      it('throws an error token if the name is not a name', () => {
         expectSyntaxError(
            ENTITY_TYPE.EXTERNAL_ENTITY,
            '</name',
            SyntaxError.ID.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('throws an error if name is missing', () => {
         expectSyntaxError('</>',
            SyntaxError.ID.ELEMENT_NO_NAME,
            'Missing name in element tag.');
      });

      it('throws no error if the tag names match', () => {
         const s = makeStrictExternalEntityStream('<one><two></two></one>');
         ignoreToken(s, XmlToken.ElementStart);
         ignoreToken(s, XmlToken.ElementStart);
         ignoreToken(s, XmlToken.ElementEnd);

         expect(() => {
            s.getNext();
         }).not.toThrowError();
      });

      it('throws an error if the end element name does not match the start', () => {
         const s = makeStrictExternalEntityStream('<one></two>');
         ignoreToken(s, XmlToken.ElementStart);

         expect(() => {
            s.getNext();
         }).toThrowError('Expected end tag "one". Found "two".');
      });

      it('throws an error if the end element name does not match the start, even on deeper trees', () => {
         const s = makeStrictExternalEntityStream('<one><two><one></one></one></one>');
         ignoreToken(s, XmlToken.ElementStart);
         ignoreToken(s, XmlToken.ElementStart);
         ignoreToken(s, XmlToken.ElementStart);
         ignoreToken(s, XmlToken.ElementEnd);

         expect(() => {
            s.getNext();
         }).toThrowError('Expected end tag "two". Found "one".');
      });

      it('generates an error token if the end element name does not match the start', () => {
         const s = makeLaxExternalEntityStream('<one></two>');
         ignoreToken(s, XmlToken.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_UNBALANCED,
            'Expected end tag "one". Found "two".');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<one></one >');
         ignoreToken(s, XmlToken.ElementStart);

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('</'),
            new TextChunk.WordChunk('one', true, true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('>')
         ], 5));
      });

      describe('state transitions', () => {

         // Whitebox: Most tests are not done here, as the code for open and close tags is the same

         it('can appear at the start of an external entity', () => {
            const s = makeLaxExternalEntityStream('</name>');
            ignoreError(s, SyntaxError.ID.ELEMENT_UNBALANCED);

            expectTokenType(s, XmlToken.ElementEnd);
         });

      });

   });

   describe('_reportSyntaxError()', () => {

      it('includes an error token in the error', () => {
         const s = makeStrictStream('');
         const expected = new SyntaxError(SyntaxError.ID.BANGITEM_UNKNOWN);
         expected.message = 'Unkown "<!" item.';

         s._reportSyntaxError(SyntaxError.ID.BANGITEM_UNKNOWN, []);

         try {
            s.getNext();
         } catch (error) {
            expect(error.details).toEqual(expected);
         }
      });

      it('queues a syntax error token', () => {
         const s = makeLaxStream('');
         const expected = new SyntaxError(SyntaxError.ID.BANGITEM_UNKNOWN,
            'Unkown "<!" item.');

         s._reportSyntaxError(SyntaxError.ID.BANGITEM_UNKNOWN);

         expect(s.getNext()).toEqual(expected);
      });

      it('replaces parameters', () => {
         const s = makeLaxStream('');

         s._reportSyntaxError(SyntaxError.ID.BANGITEM_NAME_INVALID_CASE, [ 'one', 'two' ]);

         expect(s.getNext().message).toEqual('"one" must be upper case. Found "two".');
      });

      it('replaces only the parameters provided', () => {
         const s = makeLaxStream('');

         s._reportSyntaxError(SyntaxError.ID.BANGITEM_NAME_INVALID_CASE, [ 'one' ]);

         expect(s.getNext().message).toEqual('"one" must be upper case. Found "{1}".');
      });

   });

   describe('general parsing()', () => {

      it('does not generate a S token between tags', () => {
         const s = makeStrictStream('<?xml version="1.1"?> <one> UNO </one> ');
         ignoreToken(s, XmlToken.XmlDeclaration);

         expectTokenType(s, XmlToken.Space);
         expectTokenType(s, XmlToken.ElementStart);
         expectTokenType(s, XmlToken.CharData);
         expectTokenType(s, XmlToken.ElementEnd);
         expectTokenType(s, XmlToken.Space);
      });

   });

});
