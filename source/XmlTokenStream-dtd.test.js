/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('./shared/EntityLocation.js');
const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const SyntaxError = require('./error/SyntaxError.js');
const XmlWarning = require('./error/XmlWarning.js');
const TextChunk = require('./shared/TextChunk.js');
const tokens = require('./XmlToken.js');

const makeLaxStream = require('./XmlTokenStream-util.test.js').makeLaxStream;
const makeStrictStream = require('./XmlTokenStream-util.test.js').makeStrictStream;
const makeLaxExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeLaxExternalSubsetStream;
const makeStrictExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeStrictExternalSubsetStream;
const makeLaxExternalEntityStream = require('./XmlTokenStream-util.test.js').makeLaxExternalEntityStream;
const expectSyntaxError = require('./XmlTokenStream-util.test.js').expectSyntaxError;
const expectXmlWarning = require('./XmlTokenStream-util.test.js').expectXmlWarning;
const expectError = require('./XmlTokenStream-util.test.js').expectError;
const ignoreError = require('./XmlTokenStream-util.test.js').ignoreError;
const ignoreToken = require('./XmlTokenStream-util.test.js').ignoreToken;
const expectTokenType = require('./XmlTokenStream-util.test.js').expectTokenType;
const makeStringTokenArray = require('./XmlTokenStream-util.test.js').makeStringTokenArray;
const util = require('./XmlTokenStream-util.test.js');

describe('XmlTokenStream (dtd)', () => {

   describe('parsing DOCTYPE', () => {

      it('retrieves a token of type DOCTYPE', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE one >');
         ignoreToken(s, tokens.XmlDeclaration);

         expectTokenType(s, tokens.DocTypeStart);
      });

      it('retrieves the name of the doctype', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read().name).toEqual('testType');
      });

      it('retrieves an empty internal subset if there is none specified', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read()).toBeInstanceOf(tokens.DocTypeStart);
         expect(s.read()).toBeInstanceOf(tokens.DocTypeEnd);
      });

      it('retrieves an empty internal subset if an empty one is specified', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read()).toBeInstanceOf(tokens.DocTypeStart);
         expect(s.read()).toBeInstanceOf(tokens.InternalSubsetStart);
         expect(s.read()).toBeInstanceOf(tokens.Space);
         expect(s.read()).toBeInstanceOf(tokens.InternalSubsetEnd);
         expect(s.read()).toBeInstanceOf(tokens.DocTypeEnd);
      });

      it('retrieves an a simple internal subset', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType [ <!ENTITY test "one"> ] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read()).toBeInstanceOf(tokens.DocTypeStart);
         expect(s.read()).toBeInstanceOf(tokens.InternalSubsetStart);
         expect(s.read()).toBeInstanceOf(tokens.Space);
         expect(s.read()).toBeInstanceOf(tokens.EntityDeclaration);
         expect(s.read()).toBeInstanceOf(tokens.Space);
         expect(s.read()).toBeInstanceOf(tokens.InternalSubsetEnd);
         expect(s.read()).toBeInstanceOf(tokens.DocTypeEnd);
      });

      it('does not cause problems if a close appears when none expected', () => {
         const s = makeLaxStream('<?xml version="1.0"?>]');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT);

         const t = s.read();
         expect(t).toBeInstanceOf(tokens.CharData);
         expect(t.text).toEqual(']');
      });

      it('parses the end of the DOCTYPE element when there is an internal subset', () => {
         const s = makeStrictStream(
            '<?xml version="1.0"?><!DOCTYPE testType [ <!ENTITY test "one"> ] ><testType></testType>');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read()).toBeInstanceOf(tokens.DocTypeStart);
         expect(s.read()).toBeInstanceOf(tokens.InternalSubsetStart);
         expect(s.read()).toBeInstanceOf(tokens.Space);
         expect(s.read()).toBeInstanceOf(tokens.EntityDeclaration);
         expect(s.read()).toBeInstanceOf(tokens.Space);
         expect(s.read()).toBeInstanceOf(tokens.InternalSubsetEnd);
         expect(s.read()).toBeInstanceOf(tokens.DocTypeEnd);
         expect(s.read().name).toEqual('testType');
      });

      it('parses the end of the DOCTYPE element when there is no internal subset', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType > <testType></testType>');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read()).toBeInstanceOf(tokens.DocTypeStart);
         expect(s.read()).toBeInstanceOf(tokens.DocTypeEnd);
         expect(s.read()).toBeInstanceOf(tokens.Space);
         expect(s.read().name).toEqual('testType');
      });

      it('copes with an unexpected close by recognizing what it can and then reporting errors', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE testType [ <!ENTITY test "one"> ]]> ] >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.DocTypeStart);
         expect(s.read()).toBeInstanceOf(tokens.InternalSubsetStart);
         ignoreToken(s, tokens.Space);
         ignoreToken(s, tokens.EntityDeclaration);
         ignoreToken(s, tokens.Space);
         ignoreToken(s, tokens.InternalSubsetEnd);
         ignoreError(s, SyntaxError.ID.DOCTYPE_NO_CLOSE);
         ignoreToken(s, tokens.DocTypeEnd);
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT);

         const t = s.read();
         expect(t).toBeInstanceOf(tokens.CharData);
         expect(t.text).toEqual(']> ] >');
      });

      it('reports a syntax error if the actual type name is not a name', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE $frog [ ]');
         ignoreToken(s, tokens.XmlDeclaration);

         expectError(s, SyntaxError.ID.DOCTYPE_NAME_INVALID,
            'The document type name must match the syntax for names. Found: "$frog".');
      });

      it('reports a syntax error if there is no DOCTYPE name', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE [ ]');
         ignoreToken(s, tokens.XmlDeclaration);

         expectError(s, SyntaxError.ID.DOCTYPE_NO_NAME,
            'Missing name for the document type.');
      });

      it('reports a syntax error if there is no closing > for the DOCTYPE', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE foo');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.DocTypeStart);

         expectError(s, SyntaxError.ID.DOCTYPE_NO_CLOSE,
            'Missing closing ">" for in the document type.');
      });

      it('auto-terminates the doctype token when the > is not found as expected', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE foo fish>');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreError(s, SyntaxError.ID.EXTERNALID_UNKNOWN);
         ignoreToken(s, tokens.DocTypeStart);
         ignoreError(s, SyntaxError.ID.DOCTYPE_NO_CLOSE);
         ignoreToken(s, tokens.DocTypeEnd);
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT);

         const t = s.read();
         expect(t.text).toEqual('fish>');
      });

      it('reports invalid characters in the name of the document type', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE f\u0000oo>');
         ignoreToken(s, tokens.XmlDeclaration);

         expectError(s, SyntaxError.ID.DOCTYPE_NAME_INVALID,
            'The document type name must match the syntax for names. Found: "f\u0000oo".');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE foo PUBLIC "one" \'two\' [ ]>');
         ignoreToken(s, tokens.XmlDeclaration);

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!'),
            new TextChunk.PlainChunk('DOCTYPE'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('foo'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('PUBLIC'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('one', 'one'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('\''),
            new TextChunk.WithSpaceChunk('two', 'two'),
            new TextChunk.PlainChunk('\''),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('[')
         ], 21));

         expect(s.read().chunks).toBeUndefined();  // start internal subset

         expect(s.read().chunks).toEqual(makeStringTokenArray([
            new TextChunk.WithSpaceChunk(' ', ' ')
         ], 55));

         expect(s.read().chunks).toBeUndefined();  // end internal subset

         expect(s.read().chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk(']'),
            new TextChunk.PlainChunk('>')
         ], 56));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<!DOCTYPE one >',
               SyntaxError.ID.DOCTYPE_INVALID_DOC_CONTEXT,
               'A DOCTYPE must be declared once between the XML Declaration and the content.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
               '<!DOCTYPE one >',
               SyntaxError.ID.DOCTYPE_INVALID_EXTERNAL_CONTEXT,
               'A DOCTYPE must not be declared in an external entity.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can not appear at the start of an external entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
               '<!DOCTYPE one >',
               SyntaxError.ID.DOCTYPE_INVALID_EXTERNAL_CONTEXT,
               'A DOCTYPE must not be declared in an external entity.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType > ');
            ignoreToken(s, tokens.XmlDeclaration);

            expectTokenType(s, tokens.DocTypeStart);
            expectTokenType(s, tokens.DocTypeEnd);
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="usascii"?><!DOCTYPE one >');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_EXTERNAL_CONTEXT,
               'A DOCTYPE must not be declared in an external entity.');
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeLaxExternalEntityStream('<?xml encoding="usascii"?><!DOCTYPE one >');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_EXTERNAL_CONTEXT,
               'A DOCTYPE must not be declared in an external entity.');
         });

         it('can not appear twice in a document entity', () => {
            const s = makeLaxStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE one ><!DOCTYPE two >');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);
            ignoreToken(s, tokens.DocTypeEnd);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_DOC_CONTEXT,
               'A DOCTYPE must be declared once between the XML Declaration and the content.');
         });

         it('can not appear inside the internal subset', () => {
            const s = makeLaxStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE one [<!DOCTYPE two >]>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);
            ignoreToken(s, tokens.InternalSubsetStart);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_DOC_CONTEXT,
               'A DOCTYPE must be declared once between the XML Declaration and the content.');
         });

         it('can not appear once content has started', () => {
            const s = makeLaxStream('<?xml version="1.1" encoding="usascii"?><one><!DOCTYPE one>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.ElementStart);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_DOC_CONTEXT,
               'A DOCTYPE must be declared once between the XML Declaration and the content.');
         });

      });

   });

   describe('parsing NOTATION declaration', () => {

      it('retrieves a token of type NOTATION', () => {
         const s = makeStrictExternalSubsetStream('<!NOTATION notationName PUBLIC "foo" >');

         expectTokenType(s, tokens.NotationDeclaration);
      });

      it('retrieves a token of type NOTATION with both a public and private value', () => {
         const s = makeStrictExternalSubsetStream('<!NOTATION notationName PUBLIC "foo" "bar" >');

         expectTokenType(s, tokens.NotationDeclaration);
      });

      it('retrieves the name of the notation with a system externalID', () => {
         const s = makeStrictExternalSubsetStream('<!NOTATION notationName SYSTEM "foo">');

         expect(s.read().name).toEqual('notationName');
      });

      it('reports a syntax error if there is no notation name', () => {
         expectSyntaxError('<!NOTATION >',
            SyntaxError.ID.NOTATIONDECL_NO_NAME,
            'Missing name for a notation declaration.');
      });

      it('gives the notation token an empty name if none is specified', () => {
         const s = makeLaxExternalSubsetStream('<!NOTATION >');
         ignoreError(s, SyntaxError.ID.NOTATIONDECL_NO_NAME);
         ignoreError(s, SyntaxError.ID.NOTATIONDECL_NO_SPACE_AFTER_NAME);
         ignoreError(s, SyntaxError.ID.NOTATIONDECL_NO_EXTERNALID);

         expect(s.read().name).toEqual('');
      });

      it('auto-terminates the notation token when the > is not found as expected', () => {
         const s = makeLaxExternalSubsetStream('<!NOTATION myNotation fish>');
         ignoreError(s, SyntaxError.ID.NOTATIONDECL_NO_EXTERNALID);
         ignoreError(s, SyntaxError.ID.NOTATIONDECL_NO_CLOSE);
         let t = s.read(); // get the notation token
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_SUBSET_CONTEXT);

         t = s.read();
         expect(t.text).toEqual('fish>');
      });

      it('reports a syntax error if there is no space after the notation name', () => {
         expectSyntaxError('<!NOTATION frog>',
            SyntaxError.ID.NOTATIONDECL_NO_SPACE_AFTER_NAME,
            'Missing space after the name in the notation declaration "frog".');
      });

      it('reports a syntax error if the actual type name is not a name', () => {
         expectSyntaxError('<!NOTATION $frog PUBLIC "foo">',
            SyntaxError.ID.NOTATIONDECL_NAME_INVALID,
            'The notation declaration name must match the syntax for names. Found: "$frog".');
      });

      it('reports a syntax error if no externalId or publicId is provided', () => {
         expectSyntaxError('<!NOTATION notationName >',
            SyntaxError.ID.NOTATIONDECL_NO_EXTERNALID,
            'Missing the external id the notation declaration "notationName".');
      });

      it('reports a syntax error if there is no closing angle bracket', () => {
         expectSyntaxError('<!NOTATION notationName PUBLIC "foo" ',
            SyntaxError.ID.NOTATIONDECL_NO_CLOSE,
            'Missing closing ">" in the notation declaration "notationName".');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalSubsetStream('<?xml encoding="xx"?><!NOTATION note PUBLIC "ONE" >', {
            ignoreDocumentEncoding: true
         });
         ignoreToken(s, tokens.TextDeclaration);

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!'),
            new TextChunk.PlainChunk('NOTATION'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('note'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('PUBLIC'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('ONE', 'ONE'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('>')
         ], 21));
      });

      describe('discuraged names', () => {

         it('allows a notation name to start with "XML-" if this is 1.0/5', () => {
            const s = makeStrictStream('<!NOTATION XML-name PUBLIC "foo" >',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5));

            const t = s.read();
            expect(t.name).toEqual('XML-name');
         });

         it('allows a name to start with just "xml" if this is 1.0/5', () => {
            const s = makeStrictStream('<!NOTATION xmlName PUBLIC "foo">',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5));

            const t = s.read();
            expect(t.name).toEqual('xmlName');
         });

         it('does not allow a name to start with just "xml" if this is 1.0/4', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4),
               '<!NOTATION xmlName PUBLIC "foo">',
               XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED,
               'Notation names should not start with [Xx][Mm][Ll]. Found "xmlName".');
         });

         it('does not allow a name to start with just "xml" if this is 1.1/2', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2),
               '<!NOTATION xmlName PUBLIC "foo">',
               XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED,
               'Notation names should not start with [Xx][Mm][Ll]. Found "xmlName".');
         });

         it('does not allow a name to start with just "XMl" if this is 1.1/2', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2),
               '<!NOTATION XMlName PUBLIC "foo">',
               XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED,
               'Notation names should not start with [Xx][Mm][Ll]. Found "XMlName".');
         });

      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<!NOTATION frog PUBLIC "foo">',
               SyntaxError.ID.NOTATIONDECL_INVALID_CONTEXT,
               'A notation must not be declared outside of the internal or external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!NOTATION notationName PUBLIC "foo" >');

            expectTokenType(s, tokens.NotationDeclaration);
         });

         it('can not appear at the start of an external entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
               '<!NOTATION frog PUBLIC "foo">',
               SyntaxError.ID.NOTATIONDECL_INVALID_CONTEXT,
               'A notation must not be declared outside of the internal or external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear in the DOCTYPE of a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType [<!NOTATION frog PUBLIC "foo">]> ');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);
            ignoreToken(s, tokens.InternalSubsetStart);

            expectTokenType(s, tokens.NotationDeclaration);
         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="usascii"?><!NOTATION frog PUBLIC "foo">');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.NotationDeclaration);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeLaxExternalEntityStream('<?xml encoding="usascii"?><!NOTATION frog PUBLIC "foo">');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.NOTATIONDECL_INVALID_CONTEXT,
               'A notation must not be declared outside of the internal or external subset.');
         });

         it('changes state so can not include a Text Declaration in an external subset once used', () => {
            const s = makeLaxExternalSubsetStream('<!NOTATION frog PUBLIC "foo"><?xml encoding="usascii"?>');
            ignoreToken(s, tokens.NotationDeclaration);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('parsing ENTITY declaration', () => {

      it('retrieves a token of type ENTITY', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity" >');

         expectTokenType(s, tokens.EntityDeclaration);
      });

      it('retrieves the name of the entity', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity">');

         expect(s.read().name).toEqual('entityName');
      });

      it('retrieves the value of the entity in double quotes', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName "value">');

         expect(s.read().value).toEqual([ new tokens.Text('value', tokens.ENTITYVAL_NO_CHUNKS) ]);
      });

      it('retrieves the value of the entity in single quotes', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName \'value\'>');

         expect(s.read().value).toEqual([ new tokens.Text('value', tokens.ENTITYVAL_NO_CHUNKS) ]);
      });

      it('accepts a value with no contents', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName "">');

         expect(s.read().value).toEqual([ ]);
      });

      it('does not expand entity references in the value', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName "value&amp;">');

         expect(s.read().value).toEqual([ new tokens.Text('value&amp;', tokens.ENTITYVAL_NO_CHUNKS) ]);
      });

      it('expands parameter entity references in the value', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName "value%amp;">');

         expect(s.read().value).toEqual([
            new tokens.Text('value', tokens.ENTITYVAL_NO_CHUNKS),
            new tokens.ParameterEntityReference('amp', tokens.ENTITYVAL_NO_CHUNKS)
         ]);
      });

      it('reports an error if a param entity ref is found in an entity value in the internal subset', () => {
         const s = makeLaxStream(
            '<?xml version="1.0"?><!DOCTYPE test [<!ENTITY myEntity "%aPE;">]>');
         expectTokenType(s, tokens.XmlDeclaration);
         expectTokenType(s, tokens.DocTypeStart);
         expectTokenType(s, tokens.InternalSubsetStart);

         expectError(s, SyntaxError.ID.PEREF_INVALID_ENTITYVALUE_CONTEXT,
            'Must not have a parameter entity reference in an entity value in the internal subset. Found "aPE".');
      });

      it('expands character references in the value', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName "value&#65;">');

         expect(s.read().value).toEqual([
            new tokens.Text('value', tokens.ENTITYVAL_NO_CHUNKS),
            new tokens.CharRef('A', [ util.makePlainChunk('&#65;', 26) ])
         ]);
      });

      it('reports an error if a malformed character reference is specified', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY myEntity "tw&# 65;o">');

         expectError(s, SyntaxError.ID.CHARREF_XTRA_SPACE,
            'Must not have a space after the "#" in a character reference.');
         expect(s.read().value).toEqual([
            new tokens.Text('tw', tokens.ENTITYVAL_NO_CHUNKS),
            new tokens.CharRef('A', [ util.makeWithSpaceChunk('&# 65;', 21) ]),
            new tokens.Text('o', tokens.ENTITYVAL_NO_CHUNKS)
         ]);
      });

      it('ignores general entity references in the default value', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY myEntity "tw&;o">');

         expect(s.read().value).toEqual([
            new tokens.Text('tw&;o', tokens.ENTITYVAL_NO_CHUNKS)
         ]);
      });

      it('reports an error if a malformed parameter entity reference is specified', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY myEntity "tw%;o">');

         expectError(s, SyntaxError.ID.REFERENCE_NO_NAME, 'Missing name in entity reference.');
         expectTokenType(s, tokens.EntityDeclaration);
      });

      it('sets the value to undefined if none specified', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity">');

         expect(s.read().value).toBeUndefined();
      });

      it('retrieves the NDATA name when a two value PUBLIC is specified', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testPublic" "system" NDATA testData>');

         expect(s.read().notationDataName).toEqual('testData');
      });

      it('retrieves the NDATA name when a one value PUBLIC is specified ', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testpublic" NDATA testData>');

         expect(s.read().notationDataName).toEqual('testData');
      });

      it('retrieves the NDATA name when a one value PUBLIC is specified and no space between', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY entityName PUBLIC "testpublic"NDATA testData>');
         ignoreError(s, SyntaxError.ID.ENTITYDECL_NDATA_NO_SPACE_BEFORE);

         expect(s.read().notationDataName).toEqual('testData');
      });

      it('retrieves an undefined NDATA name if no name included', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity" "system" NDATA  >');
         ignoreError(s, SyntaxError.ID.ENTITYDECL_NDATA_NO_NAME);

         expect(s.read().notationDataName).toBeUndefined();
      });

      it('sets the notation data name to undefined if none specified', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY paramEntityName PUBLIC "testentity">');

         expect(s.read().notationDataName).toBeUndefined();
      });

      it('reports invalid and discouraged characters in the NDATA value', () => {
         const s = makeLaxExternalSubsetStream(
            '<!ENTITY myEntity PUBLIC "testpublic" NDATA nd\u0001ata\uD83F\uDFFEvalue">');

         expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
            'Characters that do not match the syntax for XML document found at: 46.');
         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 51.');
      });

      it('reports a syntax error if there is no name', () => {
         expectSyntaxError('<!ENTITY >',
            SyntaxError.ID.ENTITYDECL_NO_NAME,
            'Missing name for an entity declaration.');
      });

      it('reports a syntax error if the name does not match the syntax for names', () => {
         expectSyntaxError('<!ENTITY $badName "value">',
            SyntaxError.ID.ENTITYDECL_NAME_INVALID,
            'The entity name must match the syntax for names. Found: "$badName".');
      });

      it('gives the entity token an empty name if none is specified', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY >');
         ignoreError(s, SyntaxError.ID.ENTITYDECL_NO_NAME);
         ignoreError(s, SyntaxError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE);
         ignoreError(s, SyntaxError.ID.ENTITYDECL_NO_VALUE);

         expect(s.read().name).toEqual('');
      });

      it('reports a syntax error if there is no closing angle bracket', () => {
         expectSyntaxError('<!ENTITY entityName PUBLIC "publicValue"',
            SyntaxError.ID.ENTITYDECL_NO_CLOSE,
            'Missing closing ">" in the entity "entityName".');
      });

      it('reports a syntax error if there is no space after the entity name', () => {
         expectSyntaxError('<!ENTITY theName>',
            SyntaxError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE,
            'Missing space after the entity "theName".');
      });

      it('reports a syntax error if there is no SYSTEM, PUBLIC or entity value', () => {
         expectSyntaxError('<!ENTITY theName >',
            SyntaxError.ID.ENTITYDECL_NO_VALUE,
            'Missing value or external identifier in entity "theName".');
      });

      it('reports a syntax error if there is no space before the NDATA marker', () => {
         expectSyntaxError('<!ENTITY theName SYSTEM "foo"NDATA fred>',
            SyntaxError.ID.ENTITYDECL_NDATA_NO_SPACE_BEFORE,
            'Missing space before NDATA in entity "theName".');
      });

      it('reports a syntax error if NDATA is the wrong case', () => {
         expectSyntaxError('<!ENTITY theName SYSTEM "foo" nData fred>',
            SyntaxError.ID.ENTITYDECL_NDATA_INVALID_CASE,
            'NDATA in entity "theName" must be upper case. Found "nData".');
      });

      it('reports a syntax error if there is no NDATA name', () => {
         expectSyntaxError('<!ENTITY theName SYSTEM "foo" NDATA>',
            SyntaxError.ID.ENTITYDECL_NDATA_NO_NAME,
            'NDATA in entity "theName" must have a name.');
      });

      it('reports a syntax error if there is no NDATA name with space after NDATA', () => {
         expectSyntaxError('<!ENTITY theName SYSTEM "foo" NDATA  >',
            SyntaxError.ID.ENTITYDECL_NDATA_NO_NAME,
            'NDATA in entity "theName" must have a name.');
      });

      it('reports a missing ">" syntax error if there is junk after the SYSTEM', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY theName SYSTEM "foo" found junk  >');
         ignoreError(s, SyntaxError.ID.ENTITYDECL_NO_CLOSE);
         let t = s.read(); // get the entity token
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_SUBSET_CONTEXT);

         t = s.read();
         expect(t.text).toEqual('found junk  >');
      });

      it('reports a missing ">" syntax error if there is junk after the PUBLIC', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY theName PUBLIC "one" "foo" extra  >');
         ignoreError(s, SyntaxError.ID.ENTITYDECL_NO_CLOSE);
         let t = s.read(); // get the entity token
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_SUBSET_CONTEXT);

         t = s.read();
         expect(t.text).toEqual('extra  >');
      });

      it('reports a missing ">" syntax error if there is junk after the NDATA', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY theName SYSTEM "foo" NDATA found junk  >');
         ignoreError(s, SyntaxError.ID.ENTITYDECL_NO_CLOSE);
         let t = s.read(); // get the entity token
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_SUBSET_CONTEXT);

         t = s.read();
         expect(t.text).toEqual('junk  >');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalSubsetStream('<?xml encoding="xx"?><!ENTITY myEntity "entityValue">', {
            ignoreDocumentEncoding: true
         });
         ignoreToken(s, tokens.TextDeclaration);

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!'),
            new TextChunk.PlainChunk('ENTITY'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('myEntity'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('entityValue', 'entityValue'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.PlainChunk('>')
         ], 21));
      });

      describe('discuraged names', () => {

         it('allows a notation name to start with "XML-" if this is 1.0/5', () => {
            const s = makeStrictStream('<!ENTITY XML-entity PUBLIC "testentity" >',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5));

            const t = s.read();
            expect(t.name).toEqual('XML-entity');
         });

         it('allows a name to start with just "xml" if this is 1.0/5', () => {
            const s = makeStrictStream('<!ENTITY xmlEntity PUBLIC "testentity" >',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5));

            const t = s.read();
            expect(t.name).toEqual('xmlEntity');
         });

         it('does not allow a name to start with just "xml" if this is 1.0/4', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4),
               '<!ENTITY xmlEntity PUBLIC "testentity" >',
               XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED,
               'Entity names should not start with [Xx][Mm][Ll]. Found "xmlEntity".');
         });

         it('does not allow a name to start with just "xml" if this is 1.0/5', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5),
               '<!ENTITY xml-Entity PUBLIC "testentity" >',
               XmlWarning.ID.ENTITYDECL_NAME_XMLDASH_RESERVED,
               'Entity names should not start with "xml-". Found "xml-Entity".');
         });

         it('does not allow a name to start with just "xml" if this is 1.1/2', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2),
               '<!ENTITY xmlEntity PUBLIC "testentity" >',
               XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED,
               'Entity names should not start with [Xx][Mm][Ll]. Found "xmlEntity".');
         });

         it('does not allow a name to start with just "XMl" if this is 1.1/2', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2),
               '<!ENTITY XMlEntity PUBLIC "testentity" >',
               XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED,
               'Entity names should not start with [Xx][Mm][Ll]. Found "XMlEntity".');
         });

      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<!ENTITY entityName PUBLIC "testentity" >',
               SyntaxError.ID.ENTITYDECL_INVALID_CONTEXT,
               'An entity must not be declared outside of the internal or external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity" >');

            expectTokenType(s, tokens.EntityDeclaration);
         });

         it('can not appear at the start of an external entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
               '<!ENTITY entityName PUBLIC "testentity" >',
               SyntaxError.ID.ENTITYDECL_INVALID_CONTEXT,
               'An entity must not be declared outside of the internal or external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear in the DOCTYPE of a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType [<!ENTITY name PUBLIC "test" >]>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);
            ignoreToken(s, tokens.InternalSubsetStart);

            expectTokenType(s, tokens.EntityDeclaration);
         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="usascii"?><!ENTITY entityName PUBLIC "testentity">');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.EntityDeclaration);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeLaxExternalEntityStream('<?xml encoding="usascii"?><!ENTITY entityName PUBLIC "testentity">');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.ENTITYDECL_INVALID_CONTEXT,
               'An entity must not be declared outside of the internal or external subset.');
         });

         it('changes state so can not include a Text Declaration in an external subset once used', () => {
            const s = makeLaxExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity"><?xml encoding="usascii"?>');
            ignoreToken(s, tokens.EntityDeclaration);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   // whitebox, insofar as we "know" most of ENTITY and PARAMETER_ENTITY parsing is the same code
   describe('parsing PARAMETER_ENTITY declaration (whitebox)', () => {

      it('retrieves a token of type PARAMETER_ENTITY', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY % entityName PUBLIC "testentity" >');

         expectTokenType(s, tokens.PEntityDeclaration);
      });

      it('retrieves the NDATA name on a parameter entity', () => {
         const s = makeStrictExternalSubsetStream(
            '<!ENTITY % paramEntityName PUBLIC "testentity" "system" NDATA testData>');

         expect(s.read().notationDataName).toEqual('testData');
      });

      it('sets the notation data name to undefined if none specified on a parameter entity', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY % paramEntityName PUBLIC "testentity">');

         expect(s.read().notationDataName).toBeUndefined();
      });

      it('retrieves the name of the parameter entity', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY % paramEntityName PUBLIC "testentity">');

         expect(s.read().name).toEqual('paramEntityName');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalSubsetStream('<?xml encoding="xx"?><!ENTITY % myPE SYSTEM "one" NDATA foo>', {
            ignoreDocumentEncoding: true
         });
         ignoreToken(s, tokens.TextDeclaration);

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!'),
            new TextChunk.PlainChunk('ENTITY'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('%'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('myPE'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('SYSTEM'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('one', 'one'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('NDATA'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('foo'),
            new TextChunk.PlainChunk('>')
         ], 21));
      });

   });

   describe('parsing ELEMENT', () => {

      it('retrieves a token of type ELEMENT_DECL', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT elementName ANY>');

         expectTokenType(s, tokens.ElementDeclaration);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement ANY>');

         expect(s.read().name).toEqual('testElement');
      });

      it('retrieves an ANY content spec', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement ANY>');

         expect(s.read().contentType).toEqual('ANY');
      });

      it('retrieves an EMPTY content spec', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement EMPTY>');

         expect(s.read().contentType).toEqual('EMPTY');
      });

      it('retrieves a #PCDATA content spec', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement (#PCDATA)>');

         expect(s.read().contentType).toEqual([ '#PCDATA' ]);
      });

      it('retrieves a #PCDATA content spec padded with spaces', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement (    #PCDATA    )  >');

         expect(s.read().contentType).toEqual([ '#PCDATA' ]);
      });

      it('retrieves multiple names from the content spec', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement (#PCDATA | one|two |three)>');

         expect(s.read().contentType).toEqual([ '#PCDATA', 'one', 'two', 'three' ]);
      });

      it('retrieves names from the content spec regardless of spaces around "|"s', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement (zero | one|two |three)>');

         expect(s.read().contentType).toEqual([ 'zero', 'one', 'two', 'three' ]);
      });

      it('retrieves names from the content spec preserving their case', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement ( lower | CAPS | Initial | VaRIous )>');

         expect(s.read().contentType).toEqual([ 'lower', 'CAPS', 'Initial', 'VaRIous' ]);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalSubsetStream('<?xml encoding="xx"?><!ELEMENT elName ANY>', {
            ignoreDocumentEncoding: true
         });
         ignoreToken(s, tokens.TextDeclaration);

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!'),
            new TextChunk.PlainChunk('ELEMENT'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('elName'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('ANY'),
            new TextChunk.PlainChunk('>')
         ], 21));
      });

      it('reports a syntax error if notation is declared outside of a DTD context', () => {
         expectSyntaxError('<!ELEMENT testElement ( #PCDATA )>',
            SyntaxError.ID.ELEMENTDECL_INVALID_CONTEXT,
            'An element must not be declared outside of the internal or external subset.',
            new Offset(0, 0, 0),
            [ {
               offset: new Offset(0, 0, 0),
               location: new EntityLocation()
            } ]);
      });

      it('reports a syntax error if there is no element name', () => {
         expectSyntaxError('<!ELEMENT >',
            SyntaxError.ID.ELEMENTDECL_NO_NAME,
            'Missing name for an element declaration.');
      });

      it('reports a warning if the element name starts with "xml-"', () => {
         expectXmlWarning(EntityMetaData.TYPE.EXTERNALSUBSET,
            '<!ELEMENT xml-test ( #PCDATA )>',
            XmlWarning.ID.ELEMENTDECL_NAME_XMLDASH_RESERVED,
            'Element names should not start with "xml-". Found "xml-test".');
      });

      it('reports no warning if the element name starts with just "xml"', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT xmlTest ANY>');

         expectTokenType(s, tokens.ElementDeclaration);
      });

      it('reports no warning if the element name starts with "XML-"', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT XML-test ANY>');

         expectTokenType(s, tokens.ElementDeclaration);
      });

      it('reports a warning if the element name starts with "xml and this is 1.1/2"', () => {
         expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2, new EntityLocation()),
            '<!ELEMENT xmlTest ANY>',
            XmlWarning.ID.ELEMENTDECL_NAME_XML_RESERVED,
            'Element names should not start with [Xx][Mm][Ll]. Found "xmlTest".');
      });

      it('reports a warning if the element name starts with "xml and this is 1.0/4"', () => {
         expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4, new EntityLocation()),
            '<!ELEMENT xmlTest ANY>',
            XmlWarning.ID.ELEMENTDECL_NAME_XML_RESERVED,
            'Element names should not start with [Xx][Mm][Ll]. Found "xmlTest".');
      });

      it('reports a syntax error if there is no content spec', () => {
         expectSyntaxError('<!ELEMENT testElement>',
            SyntaxError.ID.ELEMENTDECL_NO_SPEC,
            'Missing content spec for element declaration "testElement".');
      });

      it('reports a syntax error if #PCDATA is the wrong case', () => {
         expectSyntaxError('<!ELEMENT testElement ( #pcdata )>',
            SyntaxError.ID.ELEMENTDECL_SPEC_INVALID_CASE,
            'The content spec must be "#PCDATA". Found "#pcdata".');
      });

      it('fixes the case of #PCDATA if it is specified in the wrong case', () => {
         const s = makeLaxExternalSubsetStream('<!ELEMENT testElement ( #pcdata )>');
         ignoreError(s, SyntaxError.ID.ELEMENTDECL_SPEC_INVALID_CASE);

         expect(s.read().contentType).toEqual([ '#PCDATA' ]);
      });

      it('reports a syntax error if #PCDATA is not in the first position', () => {
         expectSyntaxError('<!ELEMENT testElement ( one | #PCDATA )>',
            SyntaxError.ID.ELEMENTDECL_PCDATA_NOT_FIRST,
            '#PCDATA must be first in the content spec of element declaration "testElement".');
      });

      it('reports a syntax error if there are names without dividing "|"s', () => {
         expectSyntaxError('<!ELEMENT testElement ( one two three )>',
            SyntaxError.ID.ELEMENTDECL_SPEC_NO_ORS,
            'Missing 2 "|" from the content spec in the element declaration "testElement".');
      });

      it('reports a syntax error if there are "|"s without intervening names', () => {
         expectSyntaxError('<!ELEMENT testElement ( one | two | ||three )>',
            SyntaxError.ID.ELEMENTDECL_SPEC_NO_NAMES,
            'Missing 2 name from the content spec in the element declaration "testElement".');
      });

      it('reports a syntax error if any names do not match the syntax for names', () => {
         const s = makeLaxExternalSubsetStream('<!ELEMENT testElement ( one | $bogus | bogus2! )>');

         let t = s.read();
         expect(t.id).toEqual(SyntaxError.ID.ELEMENTDECL_SPEC_NAME_INVALID);
         expect(t.message).toEqual('Names in content spec must match the syntax for names. Found "$bogus".');

         t = s.read();
         expect(t.id).toEqual(SyntaxError.ID.ELEMENTDECL_SPEC_NAME_INVALID);
         expect(t.message).toEqual('Names in content spec must match the syntax for names. Found "bogus2!".');
      });

      it('reports a syntax error if no closing ")" on content spec', () => {
         expectSyntaxError('<!ELEMENT testElement ( #PCDATA >',
            SyntaxError.ID.ELEMENTDECL_NO_SPEC_CLOSE,
            'Missing closing ")" for content spec in element declaration "testElement".');
      });

      it('reports a syntax error if no items in the content spec', () => {
         expectSyntaxError('<!ELEMENT testElement (  ) >',
            SyntaxError.ID.ELEMENTDECL_SPEC_ITEMS_MISSING,
            'Missing items in the content spec in element declaration "testElement".');
      });

      it('reports a syntax error if no items in the content spec, including no whitespace', () => {
         expectSyntaxError('<!ELEMENT testElement () >',
            SyntaxError.ID.ELEMENTDECL_SPEC_ITEMS_MISSING,
            'Missing items in the content spec in element declaration "testElement".');
      });

      it('reports a syntax error if content spec is the wrong case with ANY', () => {
         expectSyntaxError('<!ELEMENT testElement anY>',
            SyntaxError.ID.ELEMENTDECL_SPEC_INVALID_CASE,
            'The content spec must be "ANY". Found "anY".');
      });

      it('reports a syntax error if content spec is the wrong case with EMPTY', () => {
         expectSyntaxError('<!ELEMENT testElement empty   >',
            SyntaxError.ID.ELEMENTDECL_SPEC_INVALID_CASE,
            'The content spec must be "EMPTY". Found "empty".');
      });

      it('uppercases expected values', () => {
         const s = makeLaxExternalSubsetStream('<!ELEMENT testElement empty   >');
         ignoreError(s, SyntaxError.ID.ELEMENTDECL_SPEC_INVALID_CASE);

         const t = s.read();
         expect(t.contentType).toEqual('EMPTY');
      });

      it('reports a syntax error if an unknown content spec is found', () => {
         expectSyntaxError('<!ELEMENT testElement BOGUS>',
            SyntaxError.ID.ELEMENTDECL_SPEC_UNKNOWN,
            'An unknown content spec was found. Found "BOGUS".');
      });

      it('gives the notation token an empty name if none is specified', () => {
         const s = makeLaxExternalSubsetStream('<!ELEMENT >');
         ignoreError(s, SyntaxError.ID.ELEMENTDECL_NO_NAME);
         ignoreError(s, SyntaxError.ID.ELEMENTDECL_NO_SPEC);

         expect(s.read().name).toEqual('');
      });

      it('reports a syntax error if the actual name is not a name', () => {
         expectSyntaxError('<!ELEMENT $badName ANY>',
            SyntaxError.ID.ELEMENTDECL_NAME_INVALID,
            'The element declaration name must match the syntax for names. Found: "$badName".');
      });

      it('reports a syntax error if there is no closing angle bracket', () => {
         expectSyntaxError('<!ELEMENT elemName ANY ',
            SyntaxError.ID.ELEMENTDECL_NO_CLOSE,
            'Missing closing ">" in the element declaration "elemName".');
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<!ELEMENT elementName ANY>',
               SyntaxError.ID.ELEMENTDECL_INVALID_CONTEXT,
               'An element must not be declared outside of the internal or external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!ELEMENT elementName ANY>');

            expectTokenType(s, tokens.ElementDeclaration);
         });

         it('can not appear at the start of an external entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
               '<!ELEMENT elementName ANY>',
               SyntaxError.ID.ELEMENTDECL_INVALID_CONTEXT,
               'An element must not be declared outside of the internal or external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear in the DOCTYPE of a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType [<!ELEMENT elementName ANY>]>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);
            ignoreToken(s, tokens.InternalSubsetStart);

            expectTokenType(s, tokens.ElementDeclaration);
         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="usascii"?><!ELEMENT elementName ANY>');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.ElementDeclaration);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeLaxExternalEntityStream('<?xml encoding="usascii"?><!ELEMENT elementName ANY>');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.ELEMENTDECL_INVALID_CONTEXT,
               'An element must not be declared outside of the internal or external subset.');
         });

         it('changes state so can not include a Text Declaration in an external subset once used', () => {
            const s = makeLaxExternalSubsetStream('<!ELEMENT elementName ANY><?xml encoding="usascii"?>');
            ignoreToken(s, tokens.ElementDeclaration);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('parsing ATTLIST', () => {

      it('retrieves a token of type ATTLIST_DECL', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName attrName CDATA #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('retrieves the name of the element the attributes are associated with', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName attrName CDATA #REQUIRED>');

         expect(s.read().elementName).toEqual('elementName');
      });

      it('retrieves the an attribute definition', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName attrName CDATA #REQUIRED>');

         expect(s.read().attributes).toEqual([ {
            name: 'attrName',
            type: 'CDATA',
            list: undefined,
            flag: '#REQUIRED',
            value: undefined
         } ]);
      });

      it('retrieves multiple attribute definitions', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'attrName CDATA #REQUIRED ' +
               'attrName2 IDREF #IMPLIED>');

         expect(s.read().attributes).toEqual([ {
            name: 'attrName',
            type: 'CDATA',
            list: undefined,
            flag: '#REQUIRED',
            value: undefined
         }, {
            name: 'attrName2',
            type: 'IDREF',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         } ]);
      });

      it('recognizes all known string attribute types', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA #REQUIRED>');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#REQUIRED',
            value: undefined
         } ]);
      });

      it('recognizes all known tokenized attribute types', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'IdName ID #IMPLIED ' +
               'IdRefName IDREF #IMPLIED ' +
               'IdRefsName IDREFS #IMPLIED ' +
               'EntityName ENTITY #IMPLIED ' +
               'EntitiesName ENTITIES #IMPLIED ' +
               'NmTokenName NMTOKEN #IMPLIED ' +
               'NmTokensName NMTOKENS #IMPLIED >');

         expect(s.read().attributes).toEqual([ {
            name: 'IdName',
            type: 'ID',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         }, {
            name: 'IdRefName',
            type: 'IDREF',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         }, {
            name: 'IdRefsName',
            type: 'IDREFS',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         }, {
            name: 'EntityName',
            type: 'ENTITY',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         }, {
            name: 'EntitiesName',
            type: 'ENTITIES',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         }, {
            name: 'NmTokenName',
            type: 'NMTOKEN',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         }, {
            name: 'NmTokensName',
            type: 'NMTOKENS',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         } ]);
      });

      it('recognizes a NOTATION type with one value', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'NotationName NOTATION  ( one ) #IMPLIED>');

         expect(s.read().attributes).toEqual([ {
            name: 'NotationName',
            type: 'NOTATION',
            list: [ 'one' ],
            flag: '#IMPLIED',
            value: undefined
         } ]);
      });

      it('recognizes a NOTATION type with multiple values', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'NotationName NOTATION  ( one|two | three) #IMPLIED>');

         expect(s.read().attributes).toEqual([ {
            name: 'NotationName',
            type: 'NOTATION',
            list: [ 'one', 'two', 'three' ],
            flag: '#IMPLIED',
            value: undefined
         } ]);
      });

      it('recognizes a NOTATION type with multiple values and no whitespace', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'NotationName NOTATION (one|two|three) #IMPLIED>');

         expect(s.read().attributes).toEqual([ {
            name: 'NotationName',
            type: 'NOTATION',
            list: [ 'one', 'two', 'three' ],
            flag: '#IMPLIED',
            value: undefined
         } ]);
      });

      it('recognizes multiple NOTATION attributes', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'First NOTATION \n\t( one|two | three) #IMPLIED ' +
               'Second NOTATION ( test1 | test2\t|\t\n test3) #IMPLIED>');

         expect(s.read().attributes).toEqual([ {
            name: 'First',
            type: 'NOTATION',
            list: [ 'one', 'two', 'three' ],
            flag: '#IMPLIED',
            value: undefined
         }, {
            name: 'Second',
            type: 'NOTATION',
            list: [ 'test1', 'test2', 'test3' ],
            flag: '#IMPLIED',
            value: undefined
         } ]);
      });

      it('recognizes an #IMPLIED type', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA #IMPLIED>');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         } ]);
      });

      it('recognizes an default value in double quotes', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "this is a test value">');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ new tokens.Text('this is a test value', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('recognizes an default value in single quotes', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA \'this is a test value\'>');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ new tokens.Text('this is a test value', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('recognizes an empty default value', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "">');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ ]
         } ]);
      });

      it('recognizes recognizes general entity references', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "one &amp;">');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ new tokens.Text('one ', tokens.ENTITYVAL_NO_CHUNKS),
               new tokens.EntityReference('amp', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('recognizes an default value with the #FIXED flag', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA #FIXED "this is a test value">');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#FIXED',
            value: [ new tokens.Text('this is a test value', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('fixes a mistaken capitalization of the type', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName cdata #REQUIRED>');
         ignoreError(s, SyntaxError.ID.ATTLISTDECL_ATTR_TYPE_INVALID);

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#REQUIRED',
            value: undefined
         } ]);
      });

      it('fixes a mistaken non-capitalized default #REQUIRED value', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA #required>');
         ignoreError(s, SyntaxError.ID.ATTLISTDECL_ATTR_DEFAULT_INVALID);

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#REQUIRED',
            value: undefined
         } ]);
      });

      it('fixes a mistaken non-capitalized default #IMPLIED value', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA #implied>');
         ignoreError(s, SyntaxError.ID.ATTLISTDECL_ATTR_DEFAULT_INVALID);

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#IMPLIED',
            value: undefined
         } ]);
      });

      it('fixes a mistaken non-capitalized default #FIXED value', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA #FiXeD "foo">');
         ignoreError(s, SyntaxError.ID.ATTLISTDECL_ATTR_DEFAULT_INVALID);

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#FIXED',
            value: [ new tokens.Text('foo', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('ignores parameter entity references in default values', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "%pe;">');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ new tokens.Text('%pe;', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('recognizes entity references in the default value', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "&ge;">');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ new tokens.EntityReference('ge', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('recognizes character reference in the default value', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "x&#65;y">');

         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [
               new tokens.Text('x', tokens.ENTITYVAL_NO_CHUNKS),
               new tokens.CharRef('A', [ util.makePlainChunk('&#65;', 40) ]),
               new tokens.Text('y', tokens.ENTITYVAL_NO_CHUNKS)
            ]
         } ]);
      });

      it('reports a syntax error if an attribute list is declared outside of a DTD context', () => {
         expectSyntaxError('<!ATTLIST elementName attrName CDATA #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_INVALID_CONTEXT,
            'An attribute list must not be declared outside of the internal or external subset.',
            new Offset(0, 0, 0),
            [ {
               offset: new Offset(0, 0, 0),
               location: new EntityLocation()
            } ]);
      });

      it('reports a syntax error if there is no element name', () => {
         expectSyntaxError('<!ATTLIST >',
            SyntaxError.ID.ATTLISTDECL_NO_NAME,
            'Missing element name in an attribute list declaration.');
      });

      it('reports a syntax error if there no attributes', () => {
         expectSyntaxError('<!ATTLIST elementName>',
            SyntaxError.ID.ATTLISTDECL_NO_ATTRIBUTES,
            'Missing attribute definitions for an attribute declaration for "elementName".');
      });

      it('reports a syntax error if the element name is invalid', () => {
         expectSyntaxError('<!ATTLIST bad$name>',
            SyntaxError.ID.ATTLISTDECL_NAME_INVALID,
            'The element name must match the syntax for names. Found "bad$name".');
      });

      it('reports a syntax error if the attribute name invalid', () => {
         expectSyntaxError('<!ATTLIST elemName attr$name >',
            SyntaxError.ID.ATTLISTDECL_ATTR_NAME_INVALID,
            'The attribute name must match the syntax for names. Found "attr$name".');
      });

      it('reports a syntax error if the type is missing', () => {
         expectSyntaxError('<!ATTLIST elemName attrName >',
            SyntaxError.ID.ATTLISTDECL_ATTR_NO_TYPE,
            'Missing type for attribute "attrName" in the attribute declaration for "elemName".');
      });

      it('reports a syntax error if an unknown attribute type is specified', () => {
         expectSyntaxError('<!ATTLIST elemName attrName BOGUS #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_TYPE_UNKNOWN,
            'The type must be a standardized value in the attribute declaration for "elemName". Found "BOGUS".');
      });

      it('reports a syntax error if an attribute type is specified in the wrong case', () => {
         expectSyntaxError('<!ATTLIST elemName attrName IdRef #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_TYPE_INVALID,
            'The type "IDREF" must be upper case in the attribute declaration for "elemName". Found "IdRef".');
      });

      it('reports a syntax error if an attribute flag in the wrong case', () => {
         expectSyntaxError('<!ATTLIST elemName attrName IDREF #implied >',
            SyntaxError.ID.ATTLISTDECL_ATTR_DEFAULT_INVALID,
            'The default "#IMPLIED" must be upper case in the attribute declaration for "elemName". Found "#implied".');
      });

      it('reports a syntax error if there is an unknown attribute flag', () => {
         expectSyntaxError('<!ATTLIST elemName attrName IDREF #FROG >',
            SyntaxError.ID.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN,
            'The default "#FROG" must be one of the specified default values in attribute declaration for "elemName".');
      });

      it('reports a syntax error if notation has no values', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_NOTA_EMPTY,
            'The notation in the attribute declaration for "e" must have one or more names.');
      });

      it('reports a syntax error if notation has no parenthesis values', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_NOTA_EMPTY,
            'The notation in the attribute declaration for "e" must have one or more names.');
      });

      it('reports a syntax error if notation values are not names', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( $bad ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_NOTA_NAME_INVALID,
            'The name in the attribute declaration must match the syntax for names. Found "$bad".');
      });

      it('reports a syntax error if notation has no space between NOTATION and list', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION( name ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_NOTA_NO_SPACE,
            'The notation in the attribute declaration for "e" must have a space before the name.');
      });

      it('reports a syntax error if notation has no vertical bars between NOTATION names', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name name2 ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_LIST_NO_ORS,
            'Missing 1 "|" from the attribute declaration for "e".');
      });

      it('extracts the expected notation names if a vertical bar between NOTATION names is omitted', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName NOTATION ( name name2 ) #REQUIRED >');
         ignoreError(s, SyntaxError.ID.ATTLISTDECL_ATTR_LIST_NO_ORS);

         expect(s.read().attributes).toEqual([ {
            name: 'attrName',
            type: 'NOTATION',
            list: [ 'name', 'name2' ],
            flag: '#REQUIRED',
            value: undefined
         } ]);
      });

      it('reports a syntax error if notation has extra vertical bars between NOTATION names', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name | || | name2 ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_LIST_NO_NAMES,
            'Missing 3 name from the attribute declaration for "e".');
      });

      it('reports a syntax error if notation has no terminating ")" to the list', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name >',
            SyntaxError.ID.ATTLISTDECL_ATTR_NOTA_NO_CLOSE,
            'Missing closing ")" for the notation in the attribute definition for "attrName".');
      });

      it('reports a syntax error if notation has no termination to the list or the whole attribute', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name #REQUIRED ',
            SyntaxError.ID.ATTLISTDECL_ATTR_NOTA_NO_CLOSE,
            'Missing closing ")" for the notation in the attribute definition for "attrName".');
      });

      it('reports a syntax error if there is no space between the closing ")" and the default', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name | name2 )#REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE,
            'Missing space before default for attribute "attrName" in the attribute declaration for "e".');
      });

      it('reports a syntax error if the default is missing', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA>',
            SyntaxError.ID.ATTLISTDECL_ATTR_NO_DEFAULT,
            'Missing default value for attribute "attrName" in the attribute declaration for "elemName".');
      });

      it('reports a syntax error if no space between the type and the #FIXED flag and the attribute value', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA#FIXED "test value">',
            SyntaxError.ID.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE,
            'Missing space before default for attribute "attrName" in the attribute declaration for "elemName".');
      });

      it('reports a syntax error if no space between the #FIXED flag and the attribute value', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA #FIXED"test value">',
            SyntaxError.ID.ATTLISTDECL_FIXED_NO_SPACE,
            'Missing space after #FIXED in attribute declaration for "elemName".');
      });

      it('reports a syntax error if no space between type and the attribute default', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA"test value">',
            SyntaxError.ID.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE,
            'Missing space before default for attribute "attrName" in the attribute declaration for "elemName".');
      });

      it('reports a syntax error if the close is missing', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA #REQUIRED',
            SyntaxError.ID.ATTLISTDECL_NO_CLOSE,
            'Missing closing ">" in the attribute list declaration "elemName".');
      });

      it('reports a syntax error if there is a "<" in the attribute value', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA #FIXED "test < value">',
            SyntaxError.ID.ATTLISTDECL_ATTR_INVALID,
            'Must not have a "<" in an attribute value in the attribute list declaration for "elemName".');
      });

      it('allows an attribute with "<" in the default if the right lax flag is set', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'attrName CDATA "one < two">');
         ignoreError(s, SyntaxError.ID.ATTLISTDECL_ATTR_INVALID);

         expect(s.read().attributes).toEqual([ {
            name: 'attrName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ new tokens.Text('one < two', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('reports an error if a malformed general entity is included', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "& ge;">');

         expectError(s, SyntaxError.ID.REFERENCE_XTRA_SPACE,
            'Must not have space in an entity reference.');
         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ new tokens.EntityReference('ge', tokens.ENTITYVAL_NO_CHUNKS) ]
         } ]);
      });

      it('reports an error if a malformed character reference is included', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "&# 65;">');

         expectError(s, SyntaxError.ID.CHARREF_XTRA_SPACE,
            'Must not have a space after the "#" in a character reference.');
         expect(s.read().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [
               new tokens.CharRef('A', [ util.makeWithSpaceChunk('&# 65;', 39) ])
            ]
         } ]);
      });

      it('reports a syntax error if there is not a closing quote', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA "test >',
            SyntaxError.ID.ATTLISTDECL_ATTR_NO_CLOSE_QUOTE,
            'Missing closing quote in the attribute list declaration for "elemName".');
      });

      describe('discuraged names', () => {

         it('allows a notation name to start with "XML-" if this is 1.0/5', () => {
            const s = makeStrictStream('<!ATTLIST elementName XML-attr CDATA #REQUIRED>',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5));

            const t = s.read();
            expect(t.attributes[0].name).toEqual('XML-attr');
         });

         it('allows a name to start with just "xml" if this is 1.0/5', () => {
            const s = makeStrictStream('<!ATTLIST elementName xmlAttr CDATA #REQUIRED >',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5));

            const t = s.read();
            expect(t.attributes[0].name).toEqual('xmlAttr');
         });

         it('does not allow a name to start with just "xml" if this is 1.0/4', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4),
               '<!ATTLIST elementName xmlAttr CDATA #REQUIRED >',
               XmlWarning.ID.ATTRLISTDECL_NAME_XML_RESERVED,
               'Attribute names should not start with [Xx][Mm][Ll]. Found "xmlAttr".');
         });

         it('does not allow a name to start with just "xml-" if this is 1.0/5', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5),
               '<!ATTLIST elementName xml-Attr CDATA #REQUIRED >',
               XmlWarning.ID.ATTRLISTDECL_NAME_XMLDASH_RESERVED,
               'Attribute names should not start with "xml-". Found "xml-Attr".');
         });

         it('does not allow a name to start with just "xml" if this is 1.1/2', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2),
               '<!ATTLIST elementName xmlAttr CDATA #REQUIRED >',
               XmlWarning.ID.ATTRLISTDECL_NAME_XML_RESERVED,
               'Attribute names should not start with [Xx][Mm][Ll]. Found "xmlAttr".');
         });

         it('does not allow a name to start with just "XMl" if this is 1.1/2', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2),
               '<!ATTLIST elementName xMlAttr CDATA #REQUIRED >',
               XmlWarning.ID.ATTRLISTDECL_NAME_XML_RESERVED,
               'Attribute names should not start with [Xx][Mm][Ll]. Found "xMlAttr".');
         });

      });

      describe('enumeration type', () => {

         it('recognizes an enumeration type ', () => {
            const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
                  'EnumerationName ( one ) #IMPLIED>');

            expect(s.read().attributes).toEqual([ {
               name: 'EnumerationName',
               type: 'ENUMERATION',
               list: [ 'one' ],
               flag: '#IMPLIED',
               value: undefined
            } ]);
         });

         it('recognizes multiple enumeration attributes', () => {
            const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
                  'First CDATA #IMPLIED ' +
                  'Second NOTATION \n\t(one | two | three) #IMPLIED ' +
                  'Third \n\t( one|two | three) #IMPLIED ' +
                  'Fourth ( test1 | test2\t|\t\n test3) #IMPLIED>');

            expect(s.read().attributes).toEqual([ {
               name: 'First',
               type: 'CDATA',
               list: undefined,
               flag: '#IMPLIED',
               value: undefined
            }, {
               name: 'Second',
               type: 'NOTATION',
               list: [ 'one', 'two', 'three' ],
               flag: '#IMPLIED',
               value: undefined
            }, {
               name: 'Third',
               type: 'ENUMERATION',
               list: [ 'one', 'two', 'three' ],
               flag: '#IMPLIED',
               value: undefined
            }, {
               name: 'Fourth',
               type: 'ENUMERATION',
               list: [ 'test1', 'test2', 'test3' ],
               flag: '#IMPLIED',
               value: undefined
            } ]);
         });

         it('accepts an enumerated value that is an NmToken but not a name ', () => {
            const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
                  'EnumerationName ( -one ) #IMPLIED>');

            expect(s.read().attributes).toEqual([ {
               name: 'EnumerationName',
               type: 'ENUMERATION',
               list: [ '-one' ],
               flag: '#IMPLIED',
               value: undefined
            } ]);
         });

         it('reports a syntax error if there is no space between the attr name and the enumerations', () => {
            expectSyntaxError('<!ATTLIST e attrName( name ) #REQUIRED>',
               SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NO_PRESPACE,
               'Must have a space before enumeration in attribute declaration for "e".',
               new Offset(0, 20, 20),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('extracts the expected notation names if there is no space before the enumeration', () => {
            const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName( name ) #REQUIRED>');
            ignoreError(s, SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NO_PRESPACE);

            expect(s.read().attributes).toEqual([ {
               name: 'attrName',
               type: 'ENUMERATION',
               list: [ 'name' ],
               flag: '#REQUIRED',
               value: undefined
            } ]);
         });

         // Whitebox: We don't test all the cases for missing names and |'s since that is common code

         it('reports a syntax error if the enumeration values is not an NmToken', () => {
            expectSyntaxError('<!ATTLIST e attrName ( $bad ) #REQUIRED>',
               SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID,
               'The value in the enumeration in the attribute declaration must match the syntax for ' +
                  'nmtokens. Found "$bad".');
         });

         it('reports a syntax error if the enumeration is mising a close ")"', () => {
            expectSyntaxError('<!ATTLIST e attrName ( name >',
               SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NO_CLOSE,
               'Missing closing ")" for the enumeration in the attribute definition for "attrName".');
         });

         it('reports a syntax error if enumeration has no vertical bars between names', () => {
            expectSyntaxError('<!ATTLIST e attrName ( name name2 ) #REQUIRED >',
               SyntaxError.ID.ATTLISTDECL_ATTR_LIST_NO_ORS,
               'Missing 1 "|" from the attribute declaration for "e".');
         });

         it('extracts the expected notation names if a vertical bar between enumeration names is omitted', () => {
            const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( name name2 ) #REQUIRED >');
            ignoreError(s, SyntaxError.ID.ATTLISTDECL_ATTR_LIST_NO_ORS);

            expect(s.read().attributes).toEqual([ {
               name: 'attrName',
               type: 'ENUMERATION',
               list: [ 'name', 'name2' ],
               flag: '#REQUIRED',
               value: undefined
            } ]);
         });

         it('reports a syntax error if enumeration has extra vertical bars between names', () => {
            expectSyntaxError('<!ATTLIST e attrName ( name | || | name2 ) #REQUIRED >',
               SyntaxError.ID.ATTLISTDECL_ATTR_LIST_NO_NAMES,
               'Missing 3 name from the attribute declaration for "e".');
         });

      });

      describe('value', () => {

         it('reports a syntax error if there is no value after the fixed flag', () => {
            expectSyntaxError('<!ATTLIST e attrName CDATA #FIXED>',
               SyntaxError.ID.ATTLISTDECL_ATTR_FIXED_NO_VALUE,
               'Must have a value after #FIXED in attribute declaration for "e".',
               new Offset(0, 33, 33),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalSubsetStream('<?xml encoding="xx"?><!ATTLIST elName ' +
            ' at1 CDATA #REQUIRED' +
            ' at2 NOTATION (foo| bar) #FIXED "argh"' +
            '>', {
               ignoreDocumentEncoding: true
            });
         ignoreToken(s, tokens.TextDeclaration);

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!'),
            new TextChunk.PlainChunk('ATTLIST'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('elName'),
            new TextChunk.WithSpaceChunk('  ', '  '),
            new TextChunk.PlainChunk('at1'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('CDATA'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('#REQUIRED'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('at2'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('NOTATION'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('('),
            new TextChunk.PlainChunk('foo'),
            new TextChunk.PlainChunk('|'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('bar'),
            new TextChunk.PlainChunk(')'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('#FIXED'),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.PlainChunk('"'),
            new TextChunk.WithSpaceChunk('argh', 'argh'),
            new TextChunk.PlainChunk('"'),
            new TextChunk.PlainChunk('>')
         ], 21));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<!ATTLIST elementName attrName CDATA #REQUIRED >',
               SyntaxError.ID.ATTLISTDECL_INVALID_CONTEXT,
               'An attribute list must not be declared outside of the internal or external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!ATTLIST elementName attrName CDATA #REQUIRED >');

            expectTokenType(s, tokens.AttrListDeclaration);
         });

         it('can not appear at the start of an external entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
               '<!ATTLIST elementName attrName CDATA #REQUIRED >',
               SyntaxError.ID.ATTLISTDECL_INVALID_CONTEXT,
               'An attribute list must not be declared outside of the internal or external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear in the DOCTYPE of a document entity', () => {
            const s = makeStrictStream(
               '<?xml version="1.0"?><!DOCTYPE testType [<!ATTLIST elementName attrName CDATA #REQUIRED >]>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.DocTypeStart);
            ignoreToken(s, tokens.InternalSubsetStart);

            expectTokenType(s, tokens.AttrListDeclaration);
         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="usascii"?><!ATTLIST nm nm2 CDATA #REQUIRED >');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.AttrListDeclaration);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeLaxExternalEntityStream('<?xml encoding="usascii"?><!ATTLIST en an CDATA #REQUIRED >');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.ATTLISTDECL_INVALID_CONTEXT,
               'An attribute list must not be declared outside of the internal or external subset.');
         });

         it('changes state so can not include a Text Declaration in an external subset once used', () => {
            const s = makeLaxExternalSubsetStream('<!ATTLIST en an CDATA #REQUIRED><?xml encoding="usascii"?>');
            ignoreToken(s, tokens.AttrListDeclaration);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('parsing ExternalId', () => {

      it('retrieves only a systemLiteral when SYSTEM is specified', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType SYSTEM "./system.xml" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read().externalLoc).toEqual(new EntityLocation('./system.xml'));
      });

      it('retrieves both a systemLiteral and a pubidLiteral when PUBLIC specified', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType PUBLIC "public" "./system.xml" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read().externalLoc).toEqual(new EntityLocation('./system.xml', 'public'));
      });

      it('retrieves the public and system literals when PUBLIC is specified, and an internal dtd is specified', () => {
         const s = makeStrictStream(
            '<?xml version="1.0"?><!DOCTYPE testType PUBLIC "./public.xml" "./system.xml" [ <!ENTITY foo "bar">] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read().externalLoc).toEqual(new EntityLocation('./system.xml', './public.xml'));
      });

      it('retrieves the public and system literals when PUBLIC is specified, no internal dtd is specified', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType PUBLIC "./public.xml" "./system.xml" >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read().externalLoc).toEqual(new EntityLocation('./system.xml', './public.xml'));
      });

      it('retrieves a systemLiteral in single quotes', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType SYSTEM \'./system.xml\' [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read().externalLoc).toEqual(new EntityLocation('./system.xml'));
      });

      it('retrieves both a systemLiteral and a pubidLiteral in single quotes', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType PUBLIC \'public\' \'./system.xml\' [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read().externalLoc).toEqual(new EntityLocation('./system.xml', 'public'));
      });

      it('retrieves zero length publicID and system literals', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType PUBLIC "" "" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(s.read().externalLoc).toEqual(new EntityLocation('', ''));
      });

      it('reports a syntax error if the pubidLiteral is not quoted', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC pubid "system" [ ] >',
            SyntaxError.ID.EXTERNALID_PUBLIC_NO_QUOTE,
            'Missing quotes around the public literal.');
      });

      it('reports a syntax error if the systemLiteral is not quoted', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid" system [ ] >',
            SyntaxError.ID.EXTERNALID_SYSTEM_NO_QUOTE,
            'Missing quotes around the system literal.');
      });

      it('retrieves the publicID and system literals even when unquoted', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE testType PUBLIC one two [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreError(s, SyntaxError.ID.EXTERNALID_PUBLIC_NO_QUOTE);
         ignoreError(s, SyntaxError.ID.EXTERNALID_SYSTEM_NO_QUOTE);

         expect(s.read().externalLoc).toEqual(new EntityLocation('two', 'one'));
      });

      it('reports a syntax error if the public id has illegal characters', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC \'"\' "system" [ ] >',
            SyntaxError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            'The public literal has invalid charaters. Found """.');
      });

      it('reports a syntax error if the public id has some legal and some illegal characters', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "ABCDE{" "system" [ ] >',
            SyntaxError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            'The public literal has invalid charaters. Found "{".');
      });

      it('retrieves the publicID literal even when it has illegal characters', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE testType PUBLIC "ABCDE{" "two" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreError(s, SyntaxError.ID.EXTERNALID_PUBLIC_INVALID_CHARS);

         expect(s.read().externalLoc.publicId).toEqual('ABCDE{');
      });

      it('throws no error if the public id has all legal characters', () => {
         const s = makeStrictStream('<?xml version="1.0"?><!DOCTYPE testType PUBLIC " \n\r-\'()+,./:=?;!*#@$_%' +
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"  "system" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);

         expect(() => {
            s.read();
         }).not.toThrowError();
      });

      it('reports a syntax error if PUBLIC is the wrong case', () => {
         expectSyntaxError('<!DOCTYPE testType PuBliC "pubid" "system" [ ] >',
            SyntaxError.ID.EXTERNALID_INVALID_CASE,
            'The "PUBLIC" label must be all upper case. Found "PuBliC".');
      });

      it('retrieves the publicID literal even when PUBLIC is the wrong case', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE testType public "ABCDE" "two" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreError(s, SyntaxError.ID.EXTERNALID_INVALID_CASE);

         expect(s.read().externalLoc).toEqual(new EntityLocation('two', 'ABCDE'));
      });

      it('reports a syntax error if SYSTEM is the wrong case', () => {
         expectSyntaxError('<!DOCTYPE testType SYStem "system" [ ] >',
            SyntaxError.ID.EXTERNALID_INVALID_CASE,
            'The "SYSTEM" label must be all upper case. Found "SYStem".');
      });

      it('retrieves the systemLiteral literal even when SYSTEM is the wrong case', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE testType system "ABCDE" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreError(s, SyntaxError.ID.EXTERNALID_INVALID_CASE);

         expect(s.read().externalLoc).toEqual(new EntityLocation('ABCDE'));
      });

      it('reports a syntax error if no space between the pubid and system', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid""system" [ ] >',
            SyntaxError.ID.EXTERNALID_PUBLIC_NO_SPACE,
            'Missing space beteen the public and the system literals.');
      });

      it('reports a syntax error if no space between SYSTEM and the literal', () => {
         expectSyntaxError('<!DOCTYPE testType SYSTEM"system" [ ] >',
            SyntaxError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
            'Missing space beteen SYSTEM and the literal.');
      });

      it('reports a syntax error if no space between PUBLIC and the literal', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC"pubid" "system" [ ] >',
            SyntaxError.ID.EXTERNALID_PUBLIC_NO_LEADING_SPACE,
            'Missing space beteen PUBLIC and the literal.');
      });

      it('retrieves the systemLiterals even when spaces missing', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE testType SYSTEM"one" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreError(s, SyntaxError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE);

         expect(s.read().externalLoc).toEqual(new EntityLocation('one'));
      });

      it('retrieves the publicID and system literals even when spaces missing', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE testType PUBLIC"one""two" [ ] >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreError(s, SyntaxError.ID.EXTERNALID_PUBLIC_NO_LEADING_SPACE);
         ignoreError(s, SyntaxError.ID.EXTERNALID_PUBLIC_NO_SPACE);

         expect(s.read().externalLoc).toEqual(new EntityLocation('two', 'one'));
      });

      it('reports a syntax error if there is an unknown type of external id', () => {
         expectSyntaxError('<!DOCTYPE testType FOO [ ] >',
            SyntaxError.ID.EXTERNALID_UNKNOWN,
            'The external id was an unknown type. Found "FOO".');
      });

      it('reports a syntax error if systemLiteral is missing from a PUBLIC externalId', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid" [ ] >',
            SyntaxError.ID.EXTERNALID_NO_SYSTEM,
            'Missing system literal.');
      });

      it('reports no syntax error if systemLiteral is missing, but this is a PublicID', () => {
         const s = makeStrictExternalSubsetStream('<!NOTATION testType PUBLIC "pubid" >');

         expect(() => {
            s.read();
         }).not.toThrowError();
      });

      it('reports a syntax error if systemLiteral is missing from a SYSTEM externalId', () => {
         expectSyntaxError('<!DOCTYPE testType SYSTEM [ ] >',
            SyntaxError.ID.EXTERNALID_NO_SYSTEM,
            'Missing system literal.');
      });

      it('reports a syntax error if pubIdLiteral is missing from a PUBLIC externalId', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC [ ] >',
            SyntaxError.ID.EXTERNALID_NO_PUBLIC,
            'Missing public literal.');
      });

      it('reports invalid characters in the public literal', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE foo PUBLIC "blah\u0000blah>');
         ignoreToken(s, tokens.XmlDeclaration);

         expectError(s, SyntaxError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            'The public literal has invalid charaters. Found "\u0000".');
      });

      it('reports discouraged characters in the value of a public liternal', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE foo PUBLIC "blah\uFDD0>');
         ignoreToken(s, tokens.XmlDeclaration);

         expectError(s, SyntaxError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            'The public literal has invalid charaters. Found "\uFDD0".');
      });

      it('reports bad characters in the value of a system literal', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE foo SYSTEM "blah\u0000blah>');
         ignoreToken(s, tokens.XmlDeclaration);

         expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
            'Characters that do not match the syntax for XML document found at: 47.');
      });

      it('reports discouraged characters in the value of a system literal', () => {
         const s = makeLaxStream('<?xml version="1.0"?><!DOCTYPE foo SYSTEM "blah\uFDD0>');
         ignoreToken(s, tokens.XmlDeclaration);

         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 47.');
      });

   });

});
