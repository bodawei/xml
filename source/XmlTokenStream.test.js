/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./Offset.js');
const XmlTokenStream = require('./XmlTokenStream.js');
const TextChunk = require('./TextChunk.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlToken = require('./XmlToken.js');
const EntityToken = XmlToken.EntityToken;

const makeLaxStream = require('./XmlTokenStream-util.test.js').makeLaxStream;
const makeStrictStream = require('./XmlTokenStream-util.test.js').makeStrictStream;
const makeLaxExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeLaxExternalSubsetStream;
const makeStrictExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeStrictExternalSubsetStream;
const makeLaxExternalEntityStream = require('./XmlTokenStream-util.test.js').makeLaxExternalEntityStream;
const makeStrictExternalEntityStream = require('./XmlTokenStream-util.test.js').makeStrictExternalEntityStream;
const expectSyntaxError = require('./XmlTokenStream-util.test.js').expectSyntaxError;
const expectTokenType = require('./XmlTokenStream-util.test.js').expectTokenType;
const ignoreError = require('./XmlTokenStream-util.test.js').ignoreError;
const ignoreToken = require('./XmlTokenStream-util.test.js').ignoreToken;
const ENTITY_TYPE = require('./XmlTokenStream-util.test.js').ENTITY_TYPES;

describe('XmlTokenStream', () => {

   function makeStringTokenArray(values, offset = 0) {
      const results = [];

      for (let index = 0; index < values.length; index++) {
         const length = values[index].text.length;
         values[index].startOffset = new Offset(0, offset, offset);
         values[index].endOffset = new Offset(0, offset + length, offset + length);

         results.push(values[index]);
         offset += length;
      }

      return results;
   }

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
      expect(attr.value).toEqual(value ? [ new XmlToken(XmlToken.TEXT, value) ] : []);
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

   describe('hasNext()', () => {

      it('returns true if there is a token', () => {
         const s = makeStrictExternalEntityStream('<?two?>');

         expect(s.hasNext()).toEqual(true);
      });

      it('can ask multiple times', () => {
         const s = makeStrictExternalEntityStream('<?two?> ');

         expect(s.hasNext()).toEqual(true);
         expect(s.hasNext()).toEqual(true);
      });

      it('returns false if there is none', () => {
         const s = makeStrictExternalEntityStream('');

         expect(s.hasNext()).toEqual(false);
      });

   });

   describe('parsing whitespace', () => {

      it('retrieves a token of type SPACE', () => {
         const s = makeStrictStream('<?xml version="1.0"?> \n  ');
         ignoreToken(s, XmlToken.XMLDECL);

         expectTokenType(s, XmlToken.SPACE);
      });

      it('retrieves a token of type SPACE in a DTD context', () => {
         const s = makeStrictExternalSubsetStream(' \n  ');

         expectTokenType(s, XmlToken.SPACE);
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
               XmlErrorToken.ERROR.SPACE_INVALID_CONTEXT,
               'The XML Declaration must appear before any content in the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream(' \t ');

            expectTokenType(s, XmlToken.SPACE);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream(' \t ');

            expectTokenType(s, XmlToken.SPACE);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?> \t ');
            ignoreToken(s, XmlToken.XMLDECL);

            expectTokenType(s, XmlToken.SPACE);
         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?> \t ');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.SPACE);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?> \t ');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.SPACE);
         });

      });

   });

   describe('parsing CharData', () => {

      it('retrieves a token of type CHARDATA', () => {
         const s = makeStrictExternalEntityStream('wow zowie ');

         expectTokenType(s, XmlToken.CHARDATA);
      });

      it('retrieves a token with the specified data', () => {
         const s = makeStrictExternalEntityStream('wow zowie ');

         const t = s.getNext();
         expect(t.data).toEqual('wow zowie ');
      });

      it('retrieves a token with the specified data up to the markup', () => {
         const s = makeStrictExternalEntityStream('wow <zowie> ');

         const t = s.getNext();
         expect(t.data).toEqual('wow ');
         expectTokenType(s, XmlToken.ELEMENT_START);
      });

      it('retrieves a token with the specified data up to a reference', () => {
         const s = makeStrictExternalEntityStream('wow &amp; ');

         const t = s.getNext();
         expect(t.data).toEqual('wow ');
      });

      it('throws an error token if there is a ]]> in the CharData', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            'testing testing ]]> testing',
            XmlErrorToken.ERROR.CHARDATA_INVALID_TEXT,
            '"]]>" must not appear in in character data.');
      });

      it('includes the "]]>" as char data in lax mode', () => {
         const s = makeLaxExternalEntityStream('testing testing ]]>testing');
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_TEXT);

         expect(s.getNext().data).toEqual('testing testing ');
         expect(s.getNext().data).toEqual(']]>');
         expect(s.getNext().data).toEqual('testing');
      });

      it('includes the "]]>" as char data in lax mode, even when there are no preceeding data', () => {
         const s = makeLaxExternalEntityStream(']]>testing');
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_TEXT);

         expect(s.getNext().data).toEqual(']]>');
         expect(s.getNext().data).toEqual('testing');
      });

      it('can read CharData not at the beginning of the cursor', () => {
         const s = makeStrictStream('<?xml version="1.0"?><start>testing testing </start>');
         ignoreToken(s, XmlToken.XMLDECL);
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.data).toEqual('testing testing ');
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
               XmlErrorToken.ERROR.CHARDATA_INVALID_DOC_CONTEXT,
               'CharData must not be outside the content of the document entity. Found "xxx".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               'xxx',
               XmlErrorToken.ERROR.CHARDATA_INVALID_SUBSET_CONTEXT,
               'CharData must not be in the external subset. Found "xxx".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('xxx');

            expectTokenType(s, XmlToken.CHARDATA);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('xxx<?xml encoding="usascii"?>');
            ignoreToken(s, XmlToken.CHARDATA);

            expect(() => {
               s.getNext();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>xxx');
            ignoreToken(s, XmlToken.XMLDECL);

            expect(() => {
               s.getNext();
            }).toThrowError('CharData must not be outside the content of the document entity. Found "xxx".');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>xxx');
            ignoreToken(s, XmlToken.TEXTDECL);

            expect(() => {
               s.getNext();
            }).toThrowError('CharData must not be in the external subset. Found "xxx".');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>xxx');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.CHARDATA);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>xxx</one>');
            ignoreToken(s, XmlToken.XMLDECL);
            ignoreToken(s, XmlToken.ELEMENT_START);

            expectTokenType(s, XmlToken.CHARDATA);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('xx<?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.CHARDATA);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT,
               message: 'An XML or Text Declaration must be the first thing in the entity.'
            });
         });

         // Whitebox: don't check all the other possible cases, aside from below, since the report logic is common.
         it('throws an error if found along with "]]>" at the start of the document entity', () => {
            const s = makeLaxStream('xxx]]>');
            ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_TEXT);

            let t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.CHARDATA_INVALID_DOC_CONTEXT,
               message: 'CharData must not be outside the content of the document entity. Found "xxx".'
            });
            ignoreToken(s, XmlToken.CHARDATA);

            t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.CHARDATA_INVALID_DOC_CONTEXT,
               message: 'CharData must not be outside the content of the document entity. Found "]]>".'
            });
            ignoreToken(s, XmlToken.CHARDATA);
         });

      });

   });

   describe('parsing character reference', () => {

      it('retrieves a token of type CHAR_REF', () => {
         const s = makeStrictExternalEntityStream('&#65;');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.CHAR_REF);
      });

      it('produces a token with the specified character using a decimal reference', () => {
         const s = makeStrictExternalEntityStream('&#65;');

         const t = s.getNext();
         expect(t.data).toEqual('A');
      });

      it('produces a token with the specified character using a hex reference', () => {
         const s = makeStrictExternalEntityStream('&#x4E;');

         const t = s.getNext();
         expect(t.data).toEqual('N');
      });

      it('throws an error if there is a space after the &', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '& #65;',
            XmlErrorToken.ERROR.REFERENCE_XTRA_SPACE,
            'Must not have space in an entity reference.');
      });

      it('reports an error if there is a space after the #', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&# 65;',
            XmlErrorToken.ERROR.CHARREF_XTRA_SPACE,
            'Must not have a space after the "#" in a character reference.');
      });

      it('throws an error if the "x" in a hex reference is the wrong case', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#X41;',
            XmlErrorToken.ERROR.CHARREF_INVALID_HEX_CASE,
            '"x" in a hexadecimal character reference must be lower case.');
      });

      it('reports an error if a space is found after the  "x" in a hex reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#x 41;',
            XmlErrorToken.ERROR.CHARREF_XTRA_SPACE_BEFORE_DIGITS,
            'Must not have spaces before digits in a character reference.');
      });

      it('reports an error if no digits found in a character reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#;',
            XmlErrorToken.ERROR.CHARREF_NO_DIGITS,
            'Missing digits in a character reference.');
      });

      it('throws an error if space is found after digits in a character reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#12 ;',
            XmlErrorToken.ERROR.CHARREF_XTRA_SPACE_AFTER_DIGITS,
            'Must not have spaces after digits in a character reference.');
      });

      it('throws an error if no semicolon is found after digits in a character reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#12</end>',
            XmlErrorToken.ERROR.CHARREF_NO_SEMICOLON,
            'Must have a ";" after a character reference.');
      });

      it('reports an error if hex digits found in a decimal character reference', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '&#4e;',
            XmlErrorToken.ERROR.CHARREF_INVALID_BASE,
            'A decimal character reference must not contain hex digits. Found "4e".');
      });

      it('recognizes hex digits even if specified as decimal', () => {
         const s = makeLaxExternalEntityStream('&#4e;');
         ignoreError(s, XmlErrorToken.ERROR.CHARREF_INVALID_BASE);

         expect(s.getNext().data).toEqual('N');
      });

      it('can read when not at the beginning of the cursor', () => {
         const s = makeStrictExternalEntityStream('<start>&#65;</start>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.data).toEqual('A');
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
               XmlErrorToken.ERROR.CHARREF_INVALID_DOC_CONTEXT,
               'A character reference must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '&#50;',
               XmlErrorToken.ERROR.CHARREF_INVALID_SUBSET_CONTEXT,
               'A character reference must not be in the external subset.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&#50;');

            expectTokenType(s, XmlToken.CHAR_REF);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&#50;<?xml encoding="usascii"?>');
            ignoreToken(s, XmlToken.CHAR_REF);

            expect(() => {
               s.getNext();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>&#50;');
            ignoreToken(s, XmlToken.XMLDECL);

            expect(() => {
               s.getNext();
            }).toThrowError('A character reference must not be outside the content of the document entity.');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>&#50;');
            ignoreToken(s, XmlToken.TEXTDECL);

            expect(() => {
               s.getNext();
            }).toThrowError('A character reference must not be in the external subset.');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>&#50;');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.CHAR_REF);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>&#50;</one>');
            ignoreToken(s, XmlToken.XMLDECL);
            ignoreToken(s, XmlToken.ELEMENT_START);

            expectTokenType(s, XmlToken.CHAR_REF);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('&#50;<?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.CHAR_REF);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT,
               message: 'An XML or Text Declaration must be the first thing in the entity.'
            });
         });

      });

   });

   describe('parsing entity reference', () => {

      it('throws an error if there is no entity name', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
            '&;',
            XmlErrorToken.ERROR.REFERENCE_NO_NAME,
            'Missing name in entity reference.');
      });

      it('throws an error if there is a space after the entity name', () => {
         expectSyntaxError('&frog ;',
            XmlErrorToken.ERROR.REFERENCE_XTRA_TRAILING_SPACE,
            'Must not have a space after the entity reference "frog".');
      });

      it('throws an error if there is no closing semicolon', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
            '&frog',
            XmlErrorToken.ERROR.REFERENCE_NO_SEMICOLON,
            'Missing semicolon after entity reference "frog".');
      });

      it('expands entitys', () => {
         const s = makeStrictExternalEntityStream('&quot;');
         const startToken = new XmlToken(XmlToken.ENTITY_START, 'quot');
         startToken.haveEntityData = true;

         let token = s.getNext();
         token.chunks = undefined;
         expect(token).toEqual(startToken);
         token = s.getNext();
         token.chunks = undefined;
         expect(token).toEqual(new XmlToken(XmlToken.CHARDATA, '"'));
         token = s.getNext();
         token.chunks = undefined;
         expect(token).toEqual(new XmlToken(XmlToken.ENTITY_END, 'quot'));

      });

      it('recognizes entities within entities', () => {
         const s = makeStrictExternalEntityStream('<root>&level1;</root>');
         s._entityManager.addEntity(new EntityToken('level1', '<child>&level2;</child>'));
         s._entityManager.addEntity(new EntityToken('level2', '&quot;&#x41;'));

         let token = s.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_START);
         expect(token.name).toEqual('root');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('level1');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_START);
         expect(token.name).toEqual('child');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('level2');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_START);
         expect(token.data).toEqual('quot');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.CHARDATA);
         expect(token.data).toEqual('"');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('quot');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.CHAR_REF);
         expect(token.data).toEqual('A');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('level2');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_END);
         expect(token.name).toEqual('child');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ENTITY_END);
         expect(token.data).toEqual('level1');

         token = s.getNext();
         expect(token.type).toEqual(XmlToken.ELEMENT_END);
         expect(token.name).toEqual('root');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('&lt;');

         let t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.WordChunk('lt', true, true),
            new TextChunk.PlainChunk(';')
         ]));

         t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('&'),
            new TextChunk.PlainChunk('#'),
            new TextChunk.DigitChunk('60', true),
            new TextChunk.PlainChunk(';')
         ]));

         t = s.getNext();
         expect(t.chunks).toEqual([]);
      });

      describe('state transitions', () => {

         it('throws an error if at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '&amp;',
               XmlErrorToken.ERROR.REFERENCE_INVALID_DOC_CONTEXT,
               'An entity reference must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '&amp;',
               XmlErrorToken.ERROR.REFERENCE_INVALID_SUBSET_CONTEXT,
               'An entity reference must not be in the external subset.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&amp;');

            expectTokenType(s, XmlToken.ENTITY_START);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&amp;<?xml encoding="usascii"?>');
            ignoreToken(s, XmlToken.ENTITY_START);
            ignoreToken(s, XmlToken.CHAR_REF);
            ignoreToken(s, XmlToken.ENTITY_END);

            expect(() => {
               s.getNext();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>&amp;');
            ignoreToken(s, XmlToken.XMLDECL);

            expect(() => {
               s.getNext();
            }).toThrowError('An entity reference must not be outside the content of the document entity.');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>&amp;');
            ignoreToken(s, XmlToken.TEXTDECL);

            expect(() => {
               s.getNext();
            }).toThrowError('An entity reference must not be in the external subset.');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>&amp;');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.ENTITY_START);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>&amp;</one>');
            ignoreToken(s, XmlToken.XMLDECL);
            ignoreToken(s, XmlToken.ELEMENT_START);

            expectTokenType(s, XmlToken.ENTITY_START);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('&amp;<?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.ENTITY_START);
            ignoreToken(s, XmlToken.CHAR_REF);
            ignoreToken(s, XmlToken.ENTITY_END);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT,
               message: 'An XML or Text Declaration must be the first thing in the entity.'
            });
         });

      });

   });

   describe('parsing CDATA', () => {

      it('retrieves a token of type CDATA', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ blah ]]>');

         expectTokenType(s, XmlToken.CDATA);
      });

      it('retrieves the content of the CDATA ', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ test data ]]>');

         expect(s.getNext().data).toEqual(' test data ');
      });

      it('retrieves the content of the CDATA, ignoring any embedded markup', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ test <?foo bar?> <!-- data --> <start></end> ]]>');

         expect(s.getNext().data).toEqual(' test <?foo bar?> <!-- data --> <start></end> ');
      });

      it('retrieves undefined as the value for an empty CDATA block', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[]]>');

         expect(s.getNext().data).toBeUndefined();
      });

      it('throws an error if EOF found in middle', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![CDATA[junk comment',
            XmlErrorToken.ERROR.CDATA_NO_CLOSE,
            'Missing closing "]]>" in CDATA section.');
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeLaxExternalEntityStream('<![CDATA[ junk cdata');
         ignoreError(s, XmlErrorToken.ERROR.CDATA_NO_CLOSE);

         expect(s.getNext().data).toEqual(' junk cdata');
      });

      it('throws an error if space found before first square bracket', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<! [CDATA[junk comment ]]>',
            XmlErrorToken.ERROR.BRACKETITEM_XTRA_SPACE_BEFORE,
            'Must not have space before opening "[".');
      });

      it('throws an error if space found before CDATA', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![   CDATA[junk comment ]]>',
            XmlErrorToken.ERROR.CDATA_XTRA_SPACE_BEFORE,
            'Must not have space before CDATA.');
      });

      it('throws an error if space found after CDATA', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![CDATA    [junk comment ]]>',
            XmlErrorToken.ERROR.CDATA_XTRA_SPACE_AFTER,
            'Must not have space after CDATA.');
      });

      it('throws an error if CDATA has wrong case', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![cDaTa[junk comment ]]>',
            XmlErrorToken.ERROR.CDATA_INVALID_CASE,
            '"CDATA" must be capitalized. Found "cDaTa".');
      });

      it('generates an error token in lax mode if space found after CDATA', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<![cdata[junk comment ]]>',
            XmlErrorToken.ERROR.CDATA_INVALID_CASE,
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
               XmlErrorToken.ERROR.CDATA_INVALID_DOC_CONTEXT,
               'A CDATA must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '<![CDATA[ test ]]>',
               XmlErrorToken.ERROR.CDATA_INVALID_SUBSET_CONTEXT,
               'A CDATA must not be in the external subset.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<![CDATA[ test ]]>');

            expectTokenType(s, XmlToken.CDATA);
         });

         it('can appear with element content in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><name><![CDATA[ test ]]></name>');
            ignoreToken(s, XmlToken.XMLDECL);
            ignoreToken(s, XmlToken.ELEMENT_START);

            expectTokenType(s, XmlToken.CDATA);

         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="foo"?><![CDATA[ test ]]>');
            ignoreToken(s, XmlToken.TEXTDECL);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.CDATA_INVALID_SUBSET_CONTEXT,
               message: 'A CDATA must not be in the external subset.'
            });
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="foo"?><![CDATA[ test ]]>');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.CDATA);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<![CDATA[ test ]]><?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.CDATA);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT,
               message: 'An XML or Text Declaration must be the first thing in the entity.'
            });
         });

      });

   });

   describe('parsing BangItem', () => {

      it('reports an error if an unknown bang item found', () => {
         expectSyntaxError('<!FISH ',
            XmlErrorToken.ERROR.BANGITEM_UNKNOWN,
            'Unkown "<!" item.');
      });

      it('throws an error if an unknown name appears in a <![xxx[ construction', () => {
         expectSyntaxError('<![Test[ ]]',
            XmlErrorToken.ERROR.BRACKETITEM_UNKNOWN,
            'Unknown "<![" item. Found "Test".');
      });

      it('reports an error if there is no name provided', () => {
         expectSyntaxError('<![[',
            XmlErrorToken.ERROR.BRACKETITEM_NO_NAME,
            'Missing name in a "<![" item.');
      });

      it('generates an error token in lax mode if there is no name provided', () => {
         expectSyntaxError('<![[ ]]>',
            XmlErrorToken.ERROR.BRACKETITEM_NO_NAME,
            'Missing name in a "<![" item.');
      });

      it('generates an error token in lax mode if EOF in the middle of the constructon', () => {
         expectSyntaxError('<![',
            XmlErrorToken.ERROR.BRACKETITEM_NO_NAME,
            'Missing name in a "<![" item.');
      });

      it('reports an error if there is no second square bracket', () => {
         expectSyntaxError('<![Name ]]>',
            XmlErrorToken.ERROR.BRACKETITEM_NO_SECOND_BRACKET,
            'Missing a second opening square bracket.');
      });

      it('generates an error token in lax mode if there is no second square bracket', () => {
         expectSyntaxError('<![Testing]]>',
            XmlErrorToken.ERROR.BRACKETITEM_NO_SECOND_BRACKET,
            'Missing a second opening square bracket.');
      });

      it('generates an error token in lax mode if there is an EOF before the second [', () => {
         expectSyntaxError('<![Testing',
            XmlErrorToken.ERROR.BRACKETITEM_NO_SECOND_BRACKET,
            'Missing a second opening square bracket.');
      });

      it('reports an error if a space is found before the name', () => {
         expectSyntaxError('<! NAME>',
            XmlErrorToken.ERROR.BANGITEM_NAME_XTRA_SPACE_BEFORE,
            'Must not have space before the name in a "<!" item.');
      });

      it('throws an error if there is no name for the bang item', () => {
         expectSyntaxError('<!>',
            XmlErrorToken.ERROR.BANGITEM_NO_NAME,
            'Must have a name for a "<!" item.');
      });

      it('throws an error if the type name is the wrong case', () => {
         expectSyntaxError('<!docType >',
            XmlErrorToken.ERROR.BANGITEM_NAME_INVALID_CASE,
            '"DOCTYPE" must be upper case. Found "docType".');
      });

      it('throws a syntax error if no space after the declaration name', () => {
         expectSyntaxError('<!DOCTYPE>',
            XmlErrorToken.ERROR.BANGITEM_NAME_XTRA_SPACE_AFTER,
            'Must not have space after "DOCTYPE" of a "<!" item.');
      });

   });

   describe('parsing comments', () => {

      it('retrieves a token of type COMMENT', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         expectTokenType(s, XmlToken.COMMENT);
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
            XmlErrorToken.ERROR.COMMENT_NO_CLOSE,
            'Missing closing --> in a comment.',
            new Offset(0, 16, 16),
            [ new Offset(0, 0, 0) ]);
      });

      it('throws an error if no --> found immediately after the opening', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<!--',
            XmlErrorToken.ERROR.COMMENT_NO_CLOSE,
            'Missing closing --> in a comment.',
            new Offset(0, 4, 4),
            [ new Offset(0, 0, 0) ]);
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeLaxExternalEntityStream('<!--junk comment');
         ignoreError(s, XmlErrorToken.ERROR.COMMENT_NO_CLOSE);

         expect(s.getNext().content).toEqual('junk comment');
      });

      it('throws an error if comment ends with a -', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<!--junk comment--->',
            XmlErrorToken.ERROR.COMMENT_ENDS_WITH_HYPHEN,
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
               XmlErrorToken.ERROR.COMMENT_INVALID_CONTEXT,
               'A comment must not be the first thing in the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!-- testComment -->');

            expectTokenType(s, XmlToken.COMMENT);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<!-- testComment -->');

            expectTokenType(s, XmlToken.COMMENT);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!-- testComment -->');
            ignoreToken(s, XmlToken.XMLDECL);

            expectTokenType(s, XmlToken.COMMENT);

         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="foo"?><!-- testComment -->');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.COMMENT);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="foo"?><!-- testComment -->');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.COMMENT);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<!-- testComment --><?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.COMMENT);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT,
               message: 'An XML or Text Declaration must be the first thing in the entity.'
            });
         });

         it('changes state in an external subset to be in the DTD', () => {
            const s = makeLaxExternalSubsetStream('<!-- testComment --><name>');
            ignoreToken(s, XmlToken.COMMENT);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.ELEMENT_INVALID_DTD_CONTEXT,
               message: 'An element must not be in the internal or external subset. Found "name".'
            });
         });

      });

   });

   describe('parsing processing instruction', () => {

      it('retrieves a token of type PI', () => {
         const s = makeStrictExternalEntityStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         expectTokenType(s, XmlToken.PI);
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
            XmlErrorToken.ERROR.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 13, 13));
      });

      it('throws an error if no ?> found after space after target', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?frog ',
            XmlErrorToken.ERROR.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 7, 7));
      });

      it('throws an error if no ?> found after target', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?frog',
            XmlErrorToken.ERROR.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 6, 6));
      });

      it('sets the right offset when finding no ?> found after opening', () => {
         const s = makeLaxExternalEntityStream('<?');
         ignoreError(s, XmlErrorToken.ERROR.PI_NO_TARGET);

         const t = s.getNext();
         expect(t.place).toEqual(new Offset(0, 2, 2));
      });

      it('returns the content up to EOF if no ?> found in lax mode', () => {
         const s = makeLaxExternalEntityStream('<?foo glorky');
         ignoreError(s, XmlErrorToken.ERROR.PI_NO_CLOSE);

         expect(s.getNext().content).toEqual('glorky');
      });

      it('throws an error if a space is between the <? and the target', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<? foo glorky?>',
            XmlErrorToken.ERROR.PI_SPACE_BEFORE_TARGET,
            'Must not have a space before the target name.',
            new Offset(0, 2, 2));
      });

      it('throws an error if the name does not match the name syntax', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?frog$ glorky?>',
            XmlErrorToken.ERROR.PI_TARGET_NAME_INVALID,
            'The target name must match the syntax for names. Found: "frog$".',
            new Offset(0, 2, 2));
      });

      it('throws an error if there is no target', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<??>',
            XmlErrorToken.ERROR.PI_NO_TARGET,
            'Missing target name in a processing instruction.',
            new Offset(0, 2, 2));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(ENTITY_TYPE.DOCUMENT_ENTITY,
               '<?foo bar?>',
               XmlErrorToken.ERROR.PI_INVALID_CONTEXT,
               'A processing instruction must not be the first thing in the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?foo bar?>');

            expectTokenType(s, XmlToken.PI);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?foo bar?>');

            expectTokenType(s, XmlToken.PI);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><?foo bar?>');
            ignoreToken(s, XmlToken.XMLDECL);

            expectTokenType(s, XmlToken.PI);

         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="foo"?><?foo bar?>');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.PI);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="foo"?><?foo bar?>');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.PI);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<?foo bar?><?xml encoding="foo"?>');
            ignoreToken(s, XmlToken.PI);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT,
               message: 'An XML or Text Declaration must be the first thing in the entity.'
            });
         });

         it('changes state in an external subset to be in the DTD', () => {
            const s = makeLaxExternalSubsetStream('<?foo bar?><name>');
            ignoreToken(s, XmlToken.PI);

            const t = s.getNext();
            expect(t).toEqualProps({
               code: XmlErrorToken.ERROR.ELEMENT_INVALID_DTD_CONTEXT,
               message: 'An element must not be in the internal or external subset. Found "name".'
            });
         });

      });

   });

   describe('parsing XML Declaration', () => {

      it('can get a syntactically correct one', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.XMLDECL);
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

      it('allows a space between the <? and the target if in lax mode', () => {
         const s = makeLaxStream('<? xml version="1.1"?>');

         let t = s.getNext();
         expect(t.type).toEqual(XmlToken.SYNTAX_ERROR);
         t = s.getNext();
         expect(t.type).toEqual(XmlToken.XMLDECL);
      });

      it('throws an error if a space is between the <? and the target', () => {
         expectSyntaxError('<? xml version="1.1"?>',
            XmlErrorToken.ERROR.PI_SPACE_BEFORE_TARGET,
            'Must not have a space before the target name.',
            new Offset(0, 2, 2));
      });

      it('throws an error the xml after <? is in mixed case if in strict mode', () => {
         expectSyntaxError('<?XmL version="1.1"?>',
            XmlErrorToken.ERROR.XMLDECL_TARGET_INVALID_CASE,
            '"xml" must be lower case. Found "XmL".',
            new Offset(0, 2, 2));
      });

      it('allows < in a values even if lax:allowOpenAngleBracketsInAttributeValues is false', () => {
         const s = makeStream('<?xml version="1.1" encoding="frog<"?>', new XmlEntityManager(), {
            lax: true,
            'lax:allowOpenAngleBracketsInAttributeValues': false
         });

         expect(s.getNext().code).toEqual(XmlErrorToken.ERROR.XMLDECL_ENCODING_INVALID);
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
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);

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

            expect(t.code).toEqual(XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);
         });

         it('makes the best guess for the attr value if no quotes', () => {
            const s = makeLaxStream('<?xml version=1.1 ?>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no quotes', () => {
            const s = makeLaxStream('<?xml version=1.1?>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no equal and no quotes', () => {
            const s = makeLaxStream('<?xml version 1.1?>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.XMLDECL_VERSION_INVALD);
            ignoreError(s, XmlErrorToken.ERROR.XMLDECL_ATTR_UNKNOWN);

            const t = s.getNext();
            compareXmlDeclAttribute(t.params[0], 'version', undefined);
         });

      });

      it('throws an error if there is no space after a value', () => {
         expectSyntaxError('<?xml version="1.1"encoding="usascii" standalone="yes"?>',
            XmlErrorToken.ERROR.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            '"encoding" must have a space before it.',
            new Offset(0, 19, 19));
      });

      it('throws an error if no parameters are included', () => {
         expectSyntaxError('<?xml ?>',
            XmlErrorToken.ERROR.XMLDECL_NO_ATTRIBUTES,
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
            XmlErrorToken.ERROR.XMLDECL_NO_CLOSE,
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
               XmlErrorToken.ERROR.XMLDECL_VERSION_INVALD,
               '"version" must be "1.0" or "1.1". Found "1.2".');
         });

         it('reports a syntax error if version in wrong position', () => {
            const s = makeLaxStream('<?xml encoding="usascii" version="1.1"?>');
            ignoreError(s, XmlErrorToken.ERROR.XMLDECL_ENCODING_INVALID_ORDER);

            const t = s.getNext();
            expect(t.code).toEqual(XmlErrorToken.ERROR.XMLDECL_VERSION_INVALID_ORDER);
            expect(t.message).toEqual('"version" must be the first attribute. Found as #1.');
         });

         it('throws a syntax error if version is not the right case', () => {
            expectSyntaxError('<?xml VeRsIoN="1.1" ?>',
               XmlErrorToken.ERROR.XMLDECL_ATTR_INVALID_CASE,
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
               XmlErrorToken.ERROR.XMLDECL_ENCODING_INVALID,
               '"encoding" must be alphanumeric. Found "bogus$".');
         });

         it('throws a syntax error if encoding starts with a bad character', () => {
            expectSyntaxError('<?xml version="1.1" encoding="0usascii"?>',
               XmlErrorToken.ERROR.XMLDECL_ENCODING_INVALID,
               '"encoding" must be alphanumeric. Found "0usascii".');
         });

         it('throws an error if encoding found in the wrong position', () => {
            expectSyntaxError('<?xml encoding="frog" version="1.1" ?>',
               XmlErrorToken.ERROR.XMLDECL_ENCODING_INVALID_ORDER,
               '"encoding" must be after "version" and before "standalone".');
         });

         it('throws a syntax error if is not the right case', () => {
            expectSyntaxError('<?xml version="1.1" EnCoDiNG="bogys" ?>',
               XmlErrorToken.ERROR.XMLDECL_ATTR_INVALID_CASE,
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
               XmlErrorToken.ERROR.XMLDECL_STANDALONE_INVALID_ORDER,
               '"standalone" must come after "version".');
         });

         it('throws a syntax error if standalone is not yes or no', () => {
            expectSyntaxError('<?xml version="1.1" standalone="bogus" ?>',
               XmlErrorToken.ERROR.XMLDECL_STANDALONE_INVALID,
               '"standalone" must be "yes" or "no". Found "bogus".');
         });

         it('throws a syntax error if is not the right case', () => {
            expectSyntaxError('<?xml version="1.1" STANDaLoNE="yes" ?>',
               XmlErrorToken.ERROR.XMLDECL_ATTR_INVALID_CASE,
               '"standalone" must be lower case. Found "STANDaLoNE".');
         });

         it('accepts the wrong case if lax', () => {
            expectSyntaxError('<?xml  version="1.1" STANDALONE="no" ?>',
               XmlErrorToken.ERROR.XMLDECL_ATTR_INVALID_CASE,
               '"standalone" must be lower case. Found "STANDALONE".');
         });

         it('returns the expected standalone value, even when wrong case used', () => {
            const s = makeLaxStream('<?xml  version="1.1" standalone="NO" ?>');
            ignoreError(s, XmlErrorToken.ERROR.XMLDECL_STANDALONE_INVALID_CASE);

            compareXmlDeclAttribute(s.getNext().params[1], 'standalone', 'no');
         });

         it('reports error if standalone value is wrong case', () => {
            expectSyntaxError('<?xml  version="1.1" standalone="NO" ?>',
               XmlErrorToken.ERROR.XMLDECL_STANDALONE_INVALID_CASE,
               '"no" must be lower case. Found "NO".');
         });

      });

      describe('state transition', () => {

         it('can be placed first in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?>');

            expectTokenType(s, XmlToken.XMLDECL);
         });

         it('can be placed after illegal content, but errors will be thrown', () => {
            const s = makeLaxStream('<test></test><?xml version="1.1" encoding="usascii"?>');
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_INVALID_DOC_CONTEXT);
            ignoreToken(s, XmlToken.ELEMENT_START);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_INVALID_DOC_CONTEXT);
            ignoreToken(s, XmlToken.ELEMENT_END);

            expectTokenType(s, XmlToken.XMLDECL);
         });

         it('changes the state to being in a the prolog', () => {
            const s = makeStrictStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE foo>');
            ignoreToken(s, XmlToken.XMLDECL);

            expectTokenType(s, XmlToken.DOCTYPE_START);
         });

      });

   });

   describe('parsing TextDecl', () => {

      it('can get a syntactically correct one', () => {
         const s = makeStrictExternalEntityStream('<?xml version="1.1" encoding="usascii"?>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.TEXTDECL);
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

         expect(s.getNext().type).toEqual(XmlToken.TEXTDECL);
      });

      it('throws an error if a standalone value is present', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?xml version="1.1" standalone="NO" ?>',
            XmlErrorToken.ERROR.TEXTDECL_XTRA_STANDALONE,
            '"standalone" must not be in a Text Declaration.');
      });

      it('throws an error if a encoding is not present', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<?xml version="1.1" ?>',
            XmlErrorToken.ERROR.TEXTDECL_NO_ENCODING,
            '"encoding" must be in a Text Declaration.',
            new Offset(0, 0, 0),
            [ new Offset(0, 0, 0) ]);
      });

      describe('state transition', () => {

         it('can be placed first in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?><!NOTATION x PUBLIC "x">');

            expect(s.getNext().type).toEqual(XmlToken.TEXTDECL);
            ignoreToken(s, XmlToken.NOTATION_DECL);
         });

         it('can be placed first in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?><name>');

            expect(s.getNext().type).toEqual(XmlToken.TEXTDECL);
            ignoreToken(s, XmlToken.ELEMENT_START);
         });

         it('throws an error if the Text Declaration is not the first thing in the external entity', () => {
            const s = makeStrictExternalEntityStream('<test></test><?xml version="1.1" encoding="usascii"?>');
            ignoreToken(s, XmlToken.ELEMENT_START);
            ignoreToken(s, XmlToken.ELEMENT_END);

            expect(() => {
               s.getNext(); // start element
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if the Text Declaration is not the first thing in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!ENTITY foo "bar"><?xml version="1.1" encoding="usascii"?>');
            ignoreToken(s, XmlToken.ENTITY_DECL);

            expect(() => {
               s.getNext(); // start element
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes the state to being in a DTD in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml version="1.1" encoding="usascii"?><name>');
            ignoreToken(s, XmlToken.TEXTDECL);

            expect(s.getNext()).toEqualProps({
               code: XmlErrorToken.ERROR.ELEMENT_INVALID_DTD_CONTEXT,
               message: 'An element must not be in the internal or external subset. Found "name".'
            });
         });

         it('changes the state to being in content in an external entity', () => {
            const s = makeLaxExternalEntityStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE foo>');
            ignoreToken(s, XmlToken.TEXTDECL);

            expect(s.getNext()).toEqualProps({
               code: XmlErrorToken.ERROR.DOCTYPE_INVALID_EXTERNAL_CONTEXT,
               message: 'A DOCTYPE must not be declared in an external entity.'
            });
         });

      });

   });

   describe('parsing start element tags', () => {

      it('retrieves a token of type START_ELEMENT', () => {
         const s = makeStrictExternalEntityStream('<name>');

         expectTokenType(s, XmlToken.ELEMENT_START);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictExternalEntityStream('<name>');

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves the name with a slash in it in lax mode', () => {
         const s = makeLaxExternalEntityStream('<n/ame>');
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NAME_INVALID);

         const t = s.getNext();
         expect(t.name).toEqual('n/ame');
      });

      it('retrieves an empty name if there is no name in the start tag', () => {
         const s = makeLaxExternalEntityStream('<>');
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_NAME);

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
            XmlErrorToken.ERROR.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<9name>',
            XmlErrorToken.ERROR.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".');
      });

      it('throws an error token if > is missing', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<name',
            XmlErrorToken.ERROR.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('throws an error if name is missing', () => {
         expectSyntaxError('<>',
            XmlErrorToken.ERROR.ELEMENT_NO_NAME,
            'Missing name in element tag.');
      });

      describe('with attributes', () => {

         it('can parse basic attributes', () => {
            const s = makeLaxExternalEntityStream('<elemName attr1="one" attr2="two">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'one') ],
               quoteType: '"'
            }, {
               name: 'attr2',
               value: [ new XmlToken(XmlToken.TEXT, 'two') ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes using single quotes', () => {
            const s = makeLaxExternalEntityStream('<elemName attr1=\'one\' attr2=\'two\'>');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'one') ],
               quoteType: '\''
            }, {
               name: 'attr2',
               value: [ new XmlToken(XmlToken.TEXT, 'two') ],
               quoteType: '\''
            } ]);
         });

         it('can parse attributes with whitespace around the equals', () => {
            const s = makeLaxExternalEntityStream('<elemName\n\tattr1\t\n=   \'one\' attr2   =\r\n\t "two">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'one') ],
               quoteType: '\''
            }, {
               name: 'attr2',
               value: [ new XmlToken(XmlToken.TEXT, 'two') ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference in the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&#x41;o">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  new XmlToken(XmlToken.CHAR_REF, 'A'),
                  new XmlToken(XmlToken.TEXT, 'o')
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
                  new XmlToken(XmlToken.CHAR_REF, 'A'),
                  new XmlToken(XmlToken.TEXT, ' test')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with a character reference at the end of the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&#x41;">');

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  new XmlToken(XmlToken.CHAR_REF, 'A')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with an entity reference in the value', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&quot;o">');
            const start = new XmlToken(XmlToken.ENTITY_START, 'quot');
            start.haveEntityData = true;

            const t = s.getNext();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  start,
                  new XmlToken(XmlToken.TEXT, '"'),
                  new XmlToken(XmlToken.ENTITY_END, 'quot'),
                  new XmlToken(XmlToken.TEXT, 'o')
               ],
               quoteType: '"'
            } ]);
         });

         it('can parse attributes with an entity references in entity references', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&foo;o">');
            s._entityManager.addEntity(new EntityToken('foo', '<bar>&one;</bar>'));   // WHITE BOX
            s._entityManager.addEntity(new EntityToken('one', '&quot;&#x41;'));
            const t = s.getNext();
            const startFoo = new XmlToken(XmlToken.ENTITY_START, 'foo');
            startFoo.haveEntityData = true;
            const startOne = new XmlToken(XmlToken.ENTITY_START, 'one');
            startOne.haveEntityData = true;
            const startQuot = new XmlToken(XmlToken.ENTITY_START, 'quot');
            startQuot.haveEntityData = true;

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  startFoo,
                  new XmlToken(XmlToken.TEXT, '<bar>'),
                  startOne,
                  startQuot,
                  new XmlToken(XmlToken.TEXT, '"'),
                  new XmlToken(XmlToken.ENTITY_END, 'quot'),
                  new XmlToken(XmlToken.CHAR_REF, 'A'),
                  new XmlToken(XmlToken.ENTITY_END, 'one'),
                  new XmlToken(XmlToken.TEXT, '</bar>'),
                  new XmlToken(XmlToken.ENTITY_END, 'foo'),
                  new XmlToken(XmlToken.TEXT, 'o')
               ],
               quoteType: '"'
            } ]);
         });

         it('will accept a reference to an unknown entity', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&test;o">');
            const t = s.getNext();
            const startTest = new XmlToken(XmlToken.ENTITY_START, 'test');
            startTest.haveEntityData = false;

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new XmlToken(XmlToken.TEXT, 'tw'),
                  startTest,
                  new XmlToken(XmlToken.ENTITY_END, 'test'),
                  new XmlToken(XmlToken.TEXT, 'o')
               ],
               quoteType: '"'
            } ]);
         });

         it('throws an error if there is a < in the attribute value', () => {
            expectSyntaxError('<elementName attr1="value<">',
               XmlErrorToken.ERROR.ATTRIBUTE_INVALID_VALUE,
               'The value of attribute "attr1" must not contain "<".');
         });

         it('throws an error if the attribute name is not a legal XML name', () => {
            expectSyntaxError('<elementName 1attr="value">',
               XmlErrorToken.ERROR.ATTRIBUTE_INVALID_NAME,
               'The attribute name must match the syntax for names. Found: "1attr".');
         });

         it('throws an error if there is no space between attributes', () => {
            expectSyntaxError('<elementName attr1="value"attr2="value2">',
               XmlErrorToken.ERROR.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
               '"attr2" must have a space before it.');
         });

         it('throws an error if there is no quote around the attribute value', () => {
            expectSyntaxError('<elementName attr1=value>',
               XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE,
               'The value for "attr1" must be quoted.');
         });

         it('reads a single word if there is no quote', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1= value>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1', 'value');
         });

         it('throws an error if there is no equal sign', () => {
            expectSyntaxError('<elementName attr1 "value">',
               XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL,
               '"attr1" must be followed by an "=".');
         });

         it('throws an error if there is no value', () => {
            expectSyntaxError('<elementName attr1= >',
               XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE,
               '"attr1" must have a value.');
         });

         it('throws an error if there is no closing quote', () => {
            expectSyntaxError('<elementName attr1="one>',
               XmlErrorToken.ERROR.ATTRIBUTE_NO_CLOSE_QUOTE,
               'The value for "attr1" must close with a quote.');
         });

         it('infers an equal sign and reads the value if in lax mode and equal missing', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1 "value one">');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1', 'value one');
         });

         it('reads a new name if both equal and quote are missing', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1  value one>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1', undefined);
            compareAttribute(t.attributes[1], 'value', undefined);
            compareAttribute(t.attributes[2], 'one', undefined);
         });

         it('returns undefined for values when they are not present', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1  value>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1', undefined);
            compareAttribute(t.attributes[1], 'value', undefined);
         });

         it('considers quotes in a name to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1"boo"  two=value>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'attr1"boo"', undefined);
            compareAttribute(t.attributes[1], 'two', 'value');
         });

         it('does not consider a close angle bracket to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName one>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'one', undefined);
         });

         it('does not consider a close angle bracket to be part of the value in a bad value', () => {
            const s = makeLaxExternalEntityStream('<elementName one=two>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'one', 'two');
         });

         it('does not consider a close angle bracket to be part of the value when no equal', () => {
            const s = makeLaxExternalEntityStream('<elementName one >');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'one', undefined);
         });

         it('considers quotes at the start of the name to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName "one="vone"  \'two=vtwo>');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], '"one', 'vone');
            compareAttribute(t.attributes[1], '\'two', 'vtwo');
         });

         it('handles eof in middle of name', () => {
            const s = makeLaxExternalEntityStream('<elementName nam');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_CLOSE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'nam', undefined);
         });

         it('handles eof after equal', () => {
            const s = makeLaxExternalEntityStream('<elementName name=');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_CLOSE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'name', undefined);
         });

         it('handles eof in value', () => {
            const s = makeLaxExternalEntityStream('<elementName name="one');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_CLOSE_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_CLOSE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'name', 'one');
         });

         it('handles eof at start of value', () => {
            const s = makeLaxExternalEntityStream('<elementName name="');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_CLOSE_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_CLOSE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'name', undefined);
         });

         it('throws an error if a < is found in an attribute', () => {
            expectSyntaxError('<elementName name="myvalue<one">',
               XmlErrorToken.ERROR.ATTRIBUTE_INVALID_VALUE,
               'The value of attribute "name" must not contain "<".');
         });

         it('terminates start tag and continues processing if an < in an attribute value in lax mode', () => {
            const s = makeLaxExternalEntityStream('<elementName name="one<two">');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_INVALID_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_CLOSE);

            let t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NAME_INVALID);

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
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_INVALID_VALUE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_CLOSE);

            let t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NAME_INVALID);

            t = s.getNext();
            expect(t.name).toEqual('two"');
         });

         it('terminates gracefully even when EOF at end of quoteless attribute value', () => {
            const s = makeLaxExternalEntityStream('<elementName name=one');
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_CLOSE);

            const t = s.getNext();

            compareAttribute(t.attributes[0], 'name', 'one');
         });

         it('considers < part of quoteless attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeLaxExternalEntityStream('<elementName name=one<two">', {
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });
            ignoreError(s, XmlErrorToken.ERROR.ATTRIBUTE_NO_QUOTE);

            const t = s.getNext();
            compareAttribute(t.attributes[0], 'name', 'one<two"');
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
               XmlErrorToken.ERROR.ELEMENT_INVALID_DOC_CONTEXT,
               'An element must not be before the Xml Declaration. Found "name".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '<name>',
               XmlErrorToken.ERROR.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<name> ');

            expectTokenType(s, XmlToken.ELEMENT_START);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><name> ');
            ignoreToken(s, XmlToken.XMLDECL);

            expectTokenType(s, XmlToken.ELEMENT_START);
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="usascii"?><name>');
            ignoreToken(s, XmlToken.TEXTDECL);

            expect(s.getNext()).toEqualProps({
               code: XmlErrorToken.ERROR.ELEMENT_INVALID_DTD_CONTEXT,
               message: 'An element must not be in the internal or external subset. Found "name".'
            });
         });

         it('can appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?><name>');
            ignoreToken(s, XmlToken.TEXTDECL);

            expectTokenType(s, XmlToken.ELEMENT_START);
         });

         it('can not appear inside the internal subset', () => {
            const s = makeLaxStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE one [<one>]>');
            ignoreToken(s, XmlToken.XMLDECL);
            ignoreToken(s, XmlToken.DOCTYPE_START);

            expect(s.getNext()).toEqualProps({
               code: XmlErrorToken.ERROR.ELEMENT_INVALID_DTD_CONTEXT,
               message: 'An element must not be in the internal or external subset. Found "one".'
            });
         });

         it('can appear after the DOCTYPE in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE name><name> ');
            ignoreToken(s, XmlToken.XMLDECL);
            ignoreToken(s, XmlToken.DOCTYPE_START);
            ignoreToken(s, XmlToken.DOCTYPE_END);

            expectTokenType(s, XmlToken.ELEMENT_START);
         });

         it('can appear after the DOCTYPE with an internal subset in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE name [<!ENTITY entName "f">]><name> ');
            ignoreToken(s, XmlToken.XMLDECL);
            ignoreToken(s, XmlToken.DOCTYPE_START);
            ignoreToken(s, XmlToken.ENTITY_DECL);
            ignoreToken(s, XmlToken.DOCTYPE_END);

            expectTokenType(s, XmlToken.ELEMENT_START);
         });

         it('changes state in an external entity so that the Text Declaration can not then be used', () => {
            const s = makeLaxExternalEntityStream('<name><?xml encoding="usascii"?>');
            ignoreToken(s, XmlToken.ELEMENT_START);

            expect(s.getNext()).toEqualProps({
               code: XmlErrorToken.ERROR.XMLDECL_INVALID_CONTEXT,
               message: 'An XML or Text Declaration must be the first thing in the entity.'
            });
         });

         it('changes state in a document entity so that the DOCTYPE can not then be used', () => {
            const s = makeLaxStream('<?xml version="1.0"?><name><!DOCTYPE one>');
            ignoreToken(s, XmlToken.XMLDECL);
            ignoreToken(s, XmlToken.ELEMENT_START);

            expect(s.getNext()).toEqualProps({
               code: XmlErrorToken.ERROR.DOCTYPE_INVALID_DOC_CONTEXT,
               message: 'A DOCTYPE must be declared once between the XML Declaration and the content.'
            });
         });

      });

   });

   describe('parsing empty element tags', () => {

      it('retrieves a token of type ELEMENT_EMPTY', () => {
         const s = makeStrictExternalEntityStream('<name/>');

         expectTokenType(s, XmlToken.ELEMENT_EMPTY);
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
            XmlErrorToken.ERROR.ELEMENT_XTRA_LEADING_SPACE,
            'Must not have space after opening "<" of an element tag.');
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<9name/>',
            XmlErrorToken.ERROR.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".');
      });

      it('throws an error if /> is missing', () => {
         expectSyntaxError(ENTITY_TYPE.EXTERNAL_ENTITY,
            '<name',
            XmlErrorToken.ERROR.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('generates an error token if name is missing', () => {
         const s = makeLaxExternalEntityStream('< />'); // </> looks like a malformed end tag!
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_XTRA_LEADING_SPACE);

         expect(s.getNext()).toEqualProps({
            code: XmlErrorToken.ERROR.ELEMENT_NO_NAME,
            message: 'Missing name in element tag.'
         });
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
               XmlErrorToken.ERROR.ELEMENT_INVALID_DOC_CONTEXT,
               'An element must not be before the Xml Declaration. Found "name".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(ENTITY_TYPE.EXTERNAL_SUBSET,
               '<name/>',
               XmlErrorToken.ERROR.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<name/>');

            expectTokenType(s, XmlToken.ELEMENT_EMPTY);
         });

      });

   });

   describe('parsing end element tags', () => {

      it('retrieves a token of type ELEMENT_END', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name>');
         ignoreToken(s, XmlToken.XMLDECL);
         ignoreToken(s, XmlToken.ELEMENT_START);

         expectTokenType(s, XmlToken.ELEMENT_END);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name>');
         ignoreToken(s, XmlToken.XMLDECL);
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('retrieves an empty name if there is no name in the end tag', () => {
         const s = makeLaxStream('<?xml version="1.0"?><name></>');
         ignoreToken(s, XmlToken.XMLDECL);
         ignoreToken(s, XmlToken.ELEMENT_START);
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NO_NAME);
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_UNBALANCED);

         const t = s.getNext();
         expect(t.name).toEqual('');
      });

      it('allows space after the name', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name     >');
         ignoreToken(s, XmlToken.XMLDECL);
         ignoreToken(s, XmlToken.ELEMENT_START);

         const t = s.getNext();
         expect(t.name).toEqual('name');
      });

      it('throws an error if attributs found in the tag', () => {
         const s = makeLaxExternalEntityStream('<name></name attr1="one">');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(s.getNext()).toEqualProps({
            code: XmlErrorToken.ERROR.ELEMENT_NO_CLOSE,
            message: 'Missing closing of element tag.'
         });
      });

      it('throws an error if a space is found after the </', () => {
         const s = makeLaxExternalEntityStream('<name></ name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(s.getNext()).toEqualProps({
            code: XmlErrorToken.ERROR.ELEMENT_XTRA_LEADING_SPACE,
            message: 'Must not have space after opening "<" of an element tag.'
         });
      });

      it('throws an error token if a space is found after the </', () => {
         const s = makeLaxExternalEntityStream('<name></ name>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(s.getNext()).toEqualProps({
            code: XmlErrorToken.ERROR.ELEMENT_XTRA_LEADING_SPACE,
            message: 'Must not have space after opening "<" of an element tag.'
         });
      });

      it('throws an error if a it finds the wrong close', () => {
         const s = makeLaxExternalEntityStream('<name></name/>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(s.getNext()).toEqualProps({
            code: XmlErrorToken.ERROR.ELEMENT_END_INVALID_CLOSE,
            message: 'End element tag must close with ">". Found "/>".'
         });
      });

      it('throws an error if the name is not a name', () => {
         expectSyntaxError(
            ENTITY_TYPE.EXTERNAL_ENTITY,
            '</9name>',
            XmlErrorToken.ERROR.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9name".'
         );
      });

      it('throws an error token if the name is not a name', () => {
         expectSyntaxError(
            ENTITY_TYPE.EXTERNAL_ENTITY,
            '</name',
            XmlErrorToken.ERROR.ELEMENT_NO_CLOSE,
            'Missing closing of element tag.');
      });

      it('throws an error if name is missing', () => {
         expectSyntaxError('</>',
            XmlErrorToken.ERROR.ELEMENT_NO_NAME,
            'Missing name in element tag.');
      });

      it('throws no error if the tag names match', () => {
         const s = makeStrictExternalEntityStream('<one><two></two></one>');
         ignoreToken(s, XmlToken.ELEMENT_START);
         ignoreToken(s, XmlToken.ELEMENT_START);
         ignoreToken(s, XmlToken.ELEMENT_END);

         expect(() => {
            s.getNext();
         }).not.toThrowError();
      });

      it('throws an error if the end element name does not match the start', () => {
         const s = makeStrictExternalEntityStream('<one></two>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(() => {
            s.getNext();
         }).toThrowError('Expected end tag "one". Found "two".');
      });

      it('throws an error if the end element name does not match the start, even on deeper trees', () => {
         const s = makeStrictExternalEntityStream('<one><two><one></one></one></one>');
         ignoreToken(s, XmlToken.ELEMENT_START);
         ignoreToken(s, XmlToken.ELEMENT_START);
         ignoreToken(s, XmlToken.ELEMENT_START);
         ignoreToken(s, XmlToken.ELEMENT_END);

         expect(() => {
            s.getNext();
         }).toThrowError('Expected end tag "two". Found "one".');
      });

      it('generates an error token if the end element name does not match the start', () => {
         const s = makeLaxExternalEntityStream('<one></two>');
         ignoreToken(s, XmlToken.ELEMENT_START);

         expect(s.getNext()).toEqualProps({
            code: XmlErrorToken.ERROR.ELEMENT_UNBALANCED,
            message: 'Expected end tag "one". Found "two".'
         });
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<one></one >');
         ignoreToken(s, XmlToken.ELEMENT_START);

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
            ignoreError(s, XmlErrorToken.ERROR.ELEMENT_UNBALANCED);

            expectTokenType(s, XmlToken.ELEMENT_END);
         });

      });

   });

   describe('_reportSyntaxError()', () => {

      it('throws an error if in strict mode', () => {
         const s = makeStrictStream('');

         expect(() => {
            s._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_UNKNOWN, []);
         }).toThrowError('Unkown "<!" item.');
      });

      it('includes an error token in the error', () => {
         const s = makeStrictStream('');
         const expected = new XmlErrorToken(XmlToken.SYNTAX_ERROR,
            XmlErrorToken.ERROR.BANGITEM_UNKNOWN,
            'Unkown "<!" item.');

         try {
            s._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_UNKNOWN, []);
         } catch (error) {
            expect(error.details).toEqual(expected);
         }
      });

      it('throws no error if in lax mode', () => {
         const s = makeLaxStream('');

         expect(() => {
            s._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_UNKNOWN);
         }).not.toThrow();
      });

      it('queues a syntax error token if in lax mode', () => {
         const s = makeLaxStream('');
         const expected = new XmlErrorToken(XmlToken.SYNTAX_ERROR,
            XmlErrorToken.ERROR.BANGITEM_UNKNOWN,
            'Unkown "<!" item.');

         s._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_UNKNOWN);

         expect(s.getNext()).toEqual(expected);
      });

      it('replaces parameters', () => {
         const s = makeLaxStream('');
         const expected = new XmlErrorToken(XmlToken.SYNTAX_ERROR,
            XmlErrorToken.ERROR.BANGITEM_NAME_INVALID_CASE,
            '"one" must be upper case. Found "two".');

         s._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_NAME_INVALID_CASE, [ 'one', 'two' ]);

         expect(s.getNext()).toEqual(expected);
      });

      it('replaces only the parameters provided', () => {
         const s = makeLaxStream('');
         const expected = new XmlErrorToken(XmlToken.SYNTAX_ERROR,
            XmlErrorToken.ERROR.BANGITEM_NAME_INVALID_CASE,
            '"one" must be upper case. Found "{1}".');

         s._reportSyntaxError(XmlErrorToken.ERROR.BANGITEM_NAME_INVALID_CASE, [ 'one' ]);

         expect(s.getNext()).toEqual(expected);
      });

      it('reports the place and context of the error', () => {
         const s = makeLaxStream('<?xml version="1.0"?><root>&level1;</root>');
         s._entityManager.addEntity(new EntityToken('level1', '<child>&level2;</child>'));
         s._entityManager.addEntity(new EntityToken('level2', '<!--bug'));

         ignoreToken(s, XmlToken.XMLDECL);
         ignoreToken(s, XmlToken.ELEMENT_START);   // root
         ignoreToken(s, XmlToken.ENTITY_START); // level1
         ignoreToken(s, XmlToken.ELEMENT_START); // child
         ignoreToken(s, XmlToken.ENTITY_START); // level2

         const token = s.getNext();
         expect(token.place).toEqual(new Offset(0, 7, 7));
         expect(token.context).toEqual([ new Offset(0, 0, 0), new Offset(0, 7, 7), new Offset(0, 27, 27) ]);
      });

   });

   describe('general parsing()', () => {

      it('does not generate a S token between tags', () => {
         const s = makeStrictStream('<?xml version="1.1"?> <one> UNO </one> ');
         ignoreToken(s, XmlToken.XMLDECL);

         expectTokenType(s, XmlToken.SPACE);
         expectTokenType(s, XmlToken.ELEMENT_START);
         expectTokenType(s, XmlToken.CHARDATA);
         expectTokenType(s, XmlToken.ELEMENT_END);
         expectTokenType(s, XmlToken.SPACE);
      });

   });

});
