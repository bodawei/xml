/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const EntityLocation = require('./shared//EntityLocation.js');
const SyntaxError = require('./error/SyntaxError.js');
const XmlWarning = require('./error/XmlWarning.js');
const WellFormednessError = require('./error/WellFormednessError.js');
const TextChunk = require('./shared/TextChunk.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const tokens = require('./XmlToken.js');
const XmlTokenStream = require('./XmlTokenStream.js');
const EntityStart = tokens.EntityStart;

const testUtils = require('./XmlTokenStream-util.test.js');
const makeLaxStream = testUtils.makeLaxStream;
const makeStrictStream = testUtils.makeStrictStream;
const makeLaxExternalSubsetStream = testUtils.makeLaxExternalSubsetStream;
const makeStrictExternalSubsetStream = testUtils.makeStrictExternalSubsetStream;
const makeLaxExternalEntityStream = testUtils.makeLaxExternalEntityStream;
const makeStrictExternalEntityStream = testUtils.makeStrictExternalEntityStream;
const expectSyntaxError = testUtils.expectSyntaxError;
const expectXmlWarning = testUtils.expectXmlWarning;
const expectTokenType = testUtils.expectTokenType;
const expectError = testUtils.expectError;
const ignoreError = testUtils.ignoreError;
const ignoreToken = testUtils.ignoreToken;

const makeStringTokenArray = testUtils.makeStringTokenArray;

describe('XmlTokenStream', () => {

   function compareAttribute(attr, name, value) {
      expect(attr.name).toEqual(name);
      expect(attr.value).toEqual(value ? [ new tokens.Text(value, tokens.ATTR_NO_CHUNKS) ] : []);
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

      it('delivers tokens and errors to "data" handler in a strict stream without throwing an exception', (done) => {
         const s = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');
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

      it('delivers no data after an error token with a strit stream', (done) => {
         const s = makeStrictExternalEntityStream('foo<?xml encoding="utf-8"?>');
         let count = 0;

         s.on('data', (data) => {
            switch (count) {
               case 0:
                  expect(data).toBeInstanceOf(tokens.CharData);
                  break;
               case 1:
                  expect(data.id).toEqual(SyntaxError.ID.XMLDECL_INVALID_CONTEXT);
                  done();
                  break;
               case 2:
                  expect(data instanceof tokens.TextDeclaration).toEqual(true);
                  done();
                  break;
               default:
                  throw new Error('Got an extra call in test. Call #' + count + ' ' + JSON.stringify(data));
            }
            count++;
         });
      });

      it('delivers data after an error token with a lax stream', (done) => {
         const s = makeLaxExternalEntityStream('foo<?xml encoding="utf-8"?>');
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

         xit('delivers an "end" event after "error" in a strict stream', (done) => {
            const s = makeStrictExternalEntityStream('<one>foo</one><?xml encoding="utf-8"?>');
            let count = 0;

            s.on('error', () => {
               count++;
            });
            s.on('end', () => {
               expect(count).toEqual(1);
               done();
            });
         });

      });

   });

   describe('getNext()', () => {

      it('retrieves all tokens', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');

         expectTokenType(s, tokens.ElementStart);
         expectTokenType(s, tokens.CharData);
         expectTokenType(s, tokens.ElementEnd);
         expect(s.getNext()).toEqual(null);
      });

      it('will not start a subsequent async call if one is already in progress (whitebox)', () => {
         const s = makeLaxExternalEntityStream('<one>foo</one>');
         // We have to fake async behavior because the stream isn't fully async-capable yet.
         spyOn(s, '_read');

         const token = s.getNext();
         expect(token).toEqual(null);

         s.getNext();
         expect(s._read.calls.count()).toEqual(1);
      });

      it('throws an error if an error is found in a strict stream', () => {
         const s = makeStrictExternalEntityStream('foo<?XML encoding="UTF-8"?>');

         ignoreToken(s, tokens.CharData);

         expect(() => {
            s.getNext();
         }).toThrowError('"xml" must be lower case. Found "XML".');
      });

      it('throws no error if an error is found in a lax stream', () => {
         const s = makeLaxExternalEntityStream('foo<?XML encoding="UTF-8"?>');

         ignoreToken(s, tokens.CharData);

         expect(() => {
            s.getNext();
         }).not.toThrow();
      });

      it('will deliver no other data after an exception in a strict stream', () => {
         const s = makeStrictExternalEntityStream('foo<?XML encoding="UTF-8"?>');

         ignoreToken(s, tokens.CharData);
         expect(() => {
            s.getNext();
         }).toThrowError('"xml" must be lower case. Found "XML".');

         expect(s.getNext()).toBeUndefined();
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
            s.getNext();
         }).toThrowError('Missing closing ">" for in the document type.');

         expect(s.getNext()).toBeUndefined();
      });

   });

   describe('cursor interaction', () => {

      it('sets the version on the cursor when the XmlDeclaration is found', () => {
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.DOCUMENT, 1.0, 4, new EntityLocation());
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>', entityMd);
         const s = new XmlTokenStream(cursor, new XmlEntityManager());

         s.getNext();

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

         s.getNext();

         expect(s._cursor.entityMd).toEqual(entityMd);
      });

      it('sets the document encoding on the cursor by default', () => {
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>');
         const s = new XmlTokenStream(cursor, new XmlEntityManager());

         s.getNext();

         expect(s._cursor._encoding.specifiedEncoding).toEqual('usascii');
      });

      it('does not set the document encoding on the cursor if the cursor was created with an encoding', () => {
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>', undefined,
            { encoding: 'UTF-8' });
         const s = new XmlTokenStream(cursor, new XmlEntityManager());

         s.getNext();

         expect(s._cursor._encoding.specifiedEncoding).toEqual('UTF-8');
      });

      it('does not set the document encoding on the cursor if the ignoreDocumentEncoding flag is set', () => {
         const cursor = new XmlStringCursor('<?xml version="1.1" encoding="usascii" standalone="yes"?>');
         const s = new XmlTokenStream(cursor, new XmlEntityManager(), { ignoreDocumentEncoding: true });

         s.getNext();

         expect(s._cursor._encoding.specifiedEncoding).toBeUndefined();
      });

   });

   describe('parsing character reference', () => {

      it('retrieves a token of type CharRef', () => {
         const s = makeStrictExternalEntityStream('&#65;');

         expectTokenType(s, tokens.CharRef);
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

      it('throws no errors when an invalid character is referenced', () => {
         const s = makeStrictExternalEntityStream('&#x08;');

         const t = s.getNext();
         expect(t.text).toEqual(String.fromCharCode(8));
      });

      it('throws an error if there is a space after the &', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '& #65;',
            SyntaxError.ID.REFERENCE_XTRA_SPACE,
            'Must not have space in an entity reference.');
      });

      it('reports an error if there is a space after the #', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '&# 65;',
            SyntaxError.ID.CHARREF_XTRA_SPACE,
            'Must not have a space after the "#" in a character reference.');
      });

      it('throws an error if the "x" in a hex reference is the wrong case', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '&#X41;',
            SyntaxError.ID.CHARREF_INVALID_HEX_CASE,
            '"x" in a hexadecimal character reference must be lower case.');
      });

      it('reports an error if a space is found after the  "x" in a hex reference', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '&#x 41;',
            SyntaxError.ID.CHARREF_XTRA_SPACE_BEFORE_DIGITS,
            'Must not have spaces before digits in a character reference.');
      });

      it('reports an error if no digits found in a character reference', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '&#;',
            SyntaxError.ID.CHARREF_NO_DIGITS,
            'Missing digits in a character reference.');
      });

      it('throws an error if space is found after digits in a character reference', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '&#12 ;',
            SyntaxError.ID.CHARREF_XTRA_SPACE_AFTER_DIGITS,
            'Must not have spaces after digits in a character reference.');
      });

      it('throws an error if no semicolon is found after digits in a character reference', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '&#12</end>',
            SyntaxError.ID.CHARREF_NO_SEMICOLON,
            'Must have a ";" after a character reference.');
      });

      it('reports an error if hex digits found in a decimal character reference', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
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
         ignoreToken(s, tokens.ElementStart);

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
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '&#50;',
               SyntaxError.ID.CHARREF_INVALID_DOC_CONTEXT,
               'A character reference must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
               '&#50;',
               SyntaxError.ID.CHARREF_INVALID_SUBSET_CONTEXT,
               'A character reference must not be in the external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&#50;');

            expectTokenType(s, tokens.CharRef);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&#50;<?xml encoding="usascii"?>');
            ignoreToken(s, tokens.CharRef);

            expect(() => {
               s.getNext();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>&#50;');
            ignoreToken(s, tokens.XmlDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('A character reference must not be outside the content of the document entity.');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>&#50;');
            ignoreToken(s, tokens.TextDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('A character reference must not be in the external subset.');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>&#50;');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.CharRef);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>&#50;</one>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.ElementStart);

            expectTokenType(s, tokens.CharRef);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('&#50;<?xml encoding="UTF-8"?>');
            ignoreToken(s, tokens.CharRef);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('parsing entity reference', () => {

      it('throws an error if there is no entity name', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
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
         expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
            '&frog',
            SyntaxError.ID.REFERENCE_NO_SEMICOLON,
            'Missing semicolon after entity reference "frog".');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('&lt;');

         let t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.PlainChunk('lt'),
            new TextChunk.PlainChunk(';')
         ]));

         // end entity has no chunks
         t = s.getNext();
         expect(t.chunks).toEqual([]);
      });

      describe('state transitions', () => {

         it('throws an error if at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '&amp;',
               SyntaxError.ID.REFERENCE_INVALID_DOC_CONTEXT,
               'An entity reference must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
               '&amp;',
               SyntaxError.ID.REFERENCE_INVALID_SUBSET_CONTEXT,
               'An entity reference must not be in the external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&amp;');

            expectTokenType(s, tokens.EntityStart);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&amp;<?xml encoding="usascii"?>');
            ignoreToken(s, tokens.EntityStart);
            ignoreToken(s, tokens.EntityEnd);

            expect(() => {
               s.getNext();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>&amp;');
            ignoreToken(s, tokens.XmlDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('An entity reference must not be outside the content of the document entity.');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>&amp;');
            ignoreToken(s, tokens.TextDeclaration);

            expect(() => {
               s.getNext();
            }).toThrowError('An entity reference must not be in the external subset.');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>&amp;');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.EntityStart);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>&amp;</one>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.ElementStart);

            expectTokenType(s, tokens.EntityStart);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('&amp;<?xml encoding="UTF-8"?>');
            ignoreToken(s, tokens.EntityStart);
            ignoreToken(s, tokens.EntityEnd);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('parsing start element tags', () => {

      it('retrieves a token of type START_ELEMENT', () => {
         const s = makeStrictExternalEntityStream('<name>');

         expectTokenType(s, tokens.ElementStart);
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
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '< name>',
            SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<9name>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".');
      });

      it('throws an error token if > is missing', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<name',
            SyntaxError.ID.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('throws an error if name is missing', () => {
         expectSyntaxError('<>',
            SyntaxError.ID.ELEMENT_NO_NAME,
            'Missing name in element tag.');
      });

      it('reports a warning if the name starts with xml- in 1.0/5', () => {
         expectXmlWarning(EntityMetaData.TYPE.EXTERNAL,
            '<xml-foo></xml-foo>',
            XmlWarning.ID.ELEMENT_NAME_XMLDASH_RESERVED,
            'Element names should not start with "xml-". Found "xml-foo".');
      });

      it('allows a name to start with "XML-" if this is 1.0/5', () => {
         const s = makeStrictStream('<XML-Foo></XML-Foo>',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5, new EntityLocation()));
         expectTokenType(s, tokens.ElementStart);

         const t = s.getNext();
         expect(t.name).toEqual('XML-Foo');
      });

      it('allows a name to start with just "xml" if this is 1.0/5', () => {
         const s = makeStrictStream('<xmlFoo></xmlFoo>',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5, new EntityLocation()));
         expectTokenType(s, tokens.ElementStart);

         const t = s.getNext();
         expect(t.name).toEqual('xmlFoo');
      });

      it('does not allow a name to start with just "xml" if this is 1.0/4', () => {
         expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4, new EntityLocation()),
            '<xmlFoo></xmlFoo>',
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED,
            'Element names should not start with [Xx][Mm][Ll]. Found "xmlFoo".');
      });

      it('does not allow a name to start with just "xml" if this is 1.1/2', () => {
         expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2, new EntityLocation()),
            '<xmlFoo></xmlFoo>',
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED,
            'Element names should not start with [Xx][Mm][Ll]. Found "xmlFoo".');
      });

      it('does not allow a name to start with just "XMl" if this is 1.1/2', () => {
         expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2, new EntityLocation()),
            '<XMlFoo></XMlFoo>',
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED,
            'Element names should not start with [Xx][Mm][Ll]. Found "XMlFoo".');
      });

      describe('with attributes', () => {

         it('can parse basic attributes', () => {
            const s = makeLaxExternalEntityStream('<elemName attr1="one" attr2="two">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('one', tokens.ATTR_NO_CHUNKS) ],
               quoteType: '"'
            }, {
               name: 'attr2',
               value: [ new tokens.Text('two', tokens.ATTR_NO_CHUNKS) ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes using single quotes', () => {
            const s = makeLaxExternalEntityStream('<elemName attr1=\'one\' attr2=\'two\'>');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('one', tokens.ATTR_NO_CHUNKS) ],
               quoteType: '\''
            }, {
               name: 'attr2',
               value: [ new tokens.Text('two', tokens.ATTR_NO_CHUNKS) ],
               quoteType: '\''
            } ]);
         });

         it('can parse attributes with whitespace around the equals', () => {
            const s = makeLaxExternalEntityStream('<elemName\n\tattr1\t\n=   \'one\' attr2   =\r\n\t "two">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('one', tokens.ATTR_NO_CHUNKS) ],
               quoteType: '\''
            }, {
               name: 'attr2',
               value: [ new tokens.Text('two', tokens.ATTR_NO_CHUNKS) ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference in the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&#x41;o">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('tw', tokens.ATTR_NO_CHUNKS),
                  new tokens.CharRef('A', tokens.ATTR_NO_CHUNKS),
                  new tokens.Text('o', tokens.ATTR_NO_CHUNKS)
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
                  new tokens.CharRef('A', tokens.ATTR_NO_CHUNKS),
                  new tokens.Text(' test', tokens.ATTR_NO_CHUNKS)
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference at the end of the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&#x41;">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('tw', tokens.ATTR_NO_CHUNKS),
                  new tokens.CharRef('A', tokens.ATTR_NO_CHUNKS)
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference to an invalid value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&#x8;">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('tw', tokens.ATTR_NO_CHUNKS),
                  new tokens.CharRef(String.fromCharCode(8), tokens.ATTR_NO_CHUNKS)
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with an entity reference in the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&quot;o">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('tw', tokens.ATTR_NO_CHUNKS),
                  new EntityStart('quot', false, tokens.ATTR_NO_CHUNKS),
                  new tokens.EntityEnd('quot', tokens.ATTR_NO_CHUNKS),
                  new tokens.Text('o', tokens.ATTR_NO_CHUNKS)
               ],
               quoteType: '"'
            } ]);
         });

         it('will accept a reference to an unknown entity', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&test;o">');
            const t = s.getNext();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('tw', tokens.ATTR_NO_CHUNKS),
                  new EntityStart('test', false, tokens.ATTR_NO_CHUNKS),
                  new tokens.EntityEnd('test', tokens.ATTR_NO_CHUNKS),
                  new tokens.Text('o', tokens.ATTR_NO_CHUNKS)
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
                  value: [ new tokens.Text('space: , tab: , newline: , cr: ', tokens.ATTR_NO_CHUNKS) ],
                  quoteType: '"'
               } ]);
            });

            it('will not replace characters in character references', () => {
               const s = makeStrictExternalEntityStream('<el attr1="space:&#32;, tab:&#9;, newline:&#10;, cr:&#13;">');
               const t = s.getNext();

               expect(t.attributes).toEqual([ {
                  name: 'attr1',
                  value: [
                     new tokens.Text('space:', tokens.ATTR_NO_CHUNKS),
                     new tokens.CharRef(' ', tokens.ATTR_NO_CHUNKS),
                     new tokens.Text(', tab:', tokens.ATTR_NO_CHUNKS),
                     new tokens.CharRef('\t', tokens.ATTR_NO_CHUNKS),
                     new tokens.Text(', newline:', tokens.ATTR_NO_CHUNKS),
                     new tokens.CharRef('\n', tokens.ATTR_NO_CHUNKS),
                     new tokens.Text(', cr:', tokens.ATTR_NO_CHUNKS),
                     new tokens.CharRef('\r', tokens.ATTR_NO_CHUNKS)
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
            new TextChunk.PlainChunk('one'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('>')
         ]));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<name>',
               SyntaxError.ID.ELEMENT_INVALID_DOC_CONTEXT,
               'An element must not be before the Xml Declaration. Found "name".',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
               '<name>',
               SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<name> ');

            expectTokenType(s, tokens.ElementStart);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><name> ');
            ignoreToken(s, tokens.XmlDeclaration);

            expectTokenType(s, tokens.ElementStart);
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="usascii"?><name>');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".');
         });

         it('can appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?><name>');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.ElementStart);
         });

         it('can not appear inside the internal subset', () => {
            const s = makeLaxStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE one [<one>]>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "one".');
         });

         it('can appear after the DOCTYPE in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE name><name> ');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);
            ignoreToken(s, tokens.DocTypeEnd);

            expectTokenType(s, tokens.ElementStart);
         });

         it('can appear after the DOCTYPE with an internal subset in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE name [<!ENTITY entName "f">]><name> ');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);
            ignoreToken(s, tokens.EntityDeclaration);
            ignoreToken(s, tokens.DocTypeEnd);

            expectTokenType(s, tokens.ElementStart);
         });

         it('changes state in an external entity so that the Text Declaration can not then be used', () => {
            const s = makeLaxExternalEntityStream('<name><?xml encoding="usascii"?>');
            ignoreToken(s, tokens.ElementStart);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes state in a document entity so that the DOCTYPE can not then be used', () => {
            const s = makeLaxStream('<?xml version="1.0"?><name><!DOCTYPE one>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.ElementStart);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_DOC_CONTEXT,
               'A DOCTYPE must be declared once between the XML Declaration and the content.');
         });

      });

   });

   describe('parsing empty element tags', () => {

      it('retrieves a token of type empty element', () => {
         const s = makeStrictExternalEntityStream('<name/>');

         expectTokenType(s, tokens.EmptyElement);
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
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '< name/>',
            SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<9name/>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".');
      });

      it('throws an error if /> is missing', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
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

      it('reports a warning if the name starts with xml- in 1.0/5', () => {
         expectXmlWarning(EntityMetaData.TYPE.EXTERNAL,
            '<xml-foo/>',
            XmlWarning.ID.ELEMENT_NAME_XMLDASH_RESERVED,
            'Element names should not start with "xml-". Found "xml-foo".');
      });

      it('allows a name to start with "XML-" if this is 1.0/5', () => {
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5, new EntityLocation());
         const s = new XmlTokenStream(new XmlStringCursor('<XML-Foo/>', entityMd), new XmlEntityManager());

         expectTokenType(s, tokens.EmptyElement);
      });

      it('allows a name to start with just "xml" if this is 1.0/5', () => {
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5, new EntityLocation());
         const s = new XmlTokenStream(new XmlStringCursor('<xmlFoo/>', entityMd), new XmlEntityManager());

         expectTokenType(s, tokens.EmptyElement);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<one />');

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<'),
            new TextChunk.PlainChunk('one'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('/>')
         ]));
      });

      describe('state transitions', () => {

         // Whitebox: Most tests are not done here, as the code for open and empty tags is the same

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<name/>',
               SyntaxError.ID.ELEMENT_INVALID_DOC_CONTEXT,
               'An element must not be before the Xml Declaration. Found "name".',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
               '<name/>',
               SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<name/>');

            expectTokenType(s, tokens.EmptyElement);
         });

      });

   });

   describe('parsing end element tags', () => {

      it('retrieves a token of type ElementEnd', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name>');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.ElementStart);

         expectTokenType(s, tokens.ElementEnd);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name>');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.ElementStart);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves an empty name if there is no name in the end tag', () => {
         const s = makeLaxStream('<?xml version="1.0"?><name></>');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.ElementStart);
         ignoreError(s, SyntaxError.ID.ELEMENT_NO_NAME);
         ignoreError(s, WellFormednessError.ID.ELEMENT_UNBALANCED);

         const t = s.getNext();
         expect(t.name).toEqual('');
      });

      it('allows space after the name', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name     >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.ElementStart);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('throws an error if attributs found in the tag', () => {
         const s = makeLaxExternalEntityStream('<name></name attr1="one">');
         ignoreToken(s, tokens.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('throws an error if a space is found after the </', () => {
         const s = makeLaxExternalEntityStream('<name></ name>');
         ignoreToken(s, tokens.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error token if a space is found after the </', () => {
         const s = makeLaxExternalEntityStream('<name></ name>');
         ignoreToken(s, tokens.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error if a it finds the wrong close', () => {
         const s = makeLaxExternalEntityStream('<name></name/>');
         ignoreToken(s, tokens.ElementStart);

         expectError(s, SyntaxError.ID.ELEMENT_END_INVALID_CLOSE,
            'End element tag must close with ">". Found "/>".');
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(
            EntityMetaData.TYPE.EXTERNAL,
            '</9name>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".'
         );
      });

      it('throws an error token if the name is not a name', () => {
         expectSyntaxError(
            EntityMetaData.TYPE.EXTERNAL,
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
         ignoreToken(s, tokens.ElementStart);
         ignoreToken(s, tokens.ElementStart);
         ignoreToken(s, tokens.ElementEnd);

         expect(() => {
            s.getNext();
         }).not.toThrowError();
      });

      it('throws an error if the end element name does not match the start', () => {
         const s = makeStrictExternalEntityStream('<one></two>');
         ignoreToken(s, tokens.ElementStart);

         expect(() => {
            s.getNext();
         }).toThrowError('Expected end tag "one". Found "two".');
      });

      it('throws an error if the end element name does not match the start, even on deeper trees', () => {
         const s = makeStrictExternalEntityStream('<one><two><one></one></one></one>');
         ignoreToken(s, tokens.ElementStart);
         ignoreToken(s, tokens.ElementStart);
         ignoreToken(s, tokens.ElementStart);
         ignoreToken(s, tokens.ElementEnd);

         expect(() => {
            s.getNext();
         }).toThrowError('Expected end tag "two". Found "one".');
      });

      it('generates an error token if the end element name does not match the start', () => {
         const s = makeLaxExternalEntityStream('<one></two>');
         ignoreToken(s, tokens.ElementStart);

         expectError(s, WellFormednessError.ID.ELEMENT_UNBALANCED,
            'Expected end tag "one". Found "two".');
      });

      // do not report warnings. If this balances, they already got a warning on start
      it('reports no warning if the name starts with xml- in 1.0/5', () => {
         const entityMd = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5, new EntityLocation());
         const s = new XmlTokenStream(new XmlStringCursor('<xmlFoo></xml-foo>', entityMd), new XmlEntityManager(),
            { lax: true });
         expectTokenType(s, tokens.ElementStart);
         expectError(s, WellFormednessError.ID.ELEMENT_UNBALANCED,
            'Expected end tag "xmlFoo". Found "xml-foo".');
         const t = s.getNext();

         expect(t.name).toEqual('xml-foo');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<one></one >');
         ignoreToken(s, tokens.ElementStart);

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('</'),
            new TextChunk.PlainChunk('one'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('>')
         ], 5));
      });

      describe('state transitions', () => {

         // Whitebox: Most tests are not done here, as the code for open and close tags is the same

         it('can appear at the start of an external entity', () => {
            const s = makeLaxExternalEntityStream('</name>');
            ignoreError(s, WellFormednessError.ID.ELEMENT_UNBALANCED);

            expectTokenType(s, tokens.ElementEnd);
         });

      });

   });

   describe('_report()', () => {

      it('includes an error token in the error', () => {
         const s = makeStrictStream('');
         const expected = new SyntaxError(SyntaxError.ID.BANGITEM_UNKNOWN);
         expected.message = 'Unkown "<!" item.';

         s._report(SyntaxError.ID.BANGITEM_UNKNOWN, []);

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

         s._report(SyntaxError.ID.BANGITEM_UNKNOWN);

         expect(s.getNext()).toEqual(expected);
      });

      it('replaces parameters', () => {
         const s = makeLaxStream('');

         s._report(SyntaxError.ID.BANGITEM_NAME_INVALID_CASE, [ 'one', 'two' ]);

         expect(s.getNext().message).toEqual('"one" must be upper case. Found "two".');
      });

      it('replaces only the parameters provided', () => {
         const s = makeLaxStream('');

         s._report(SyntaxError.ID.BANGITEM_NAME_INVALID_CASE, [ 'one' ]);

         expect(s.getNext().message).toEqual('"one" must be upper case. Found "{1}".');
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
