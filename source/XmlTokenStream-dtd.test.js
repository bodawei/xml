/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./Offset.js');
const XmlErrorToken = require('./XmlErrorToken.js');
const XmlToken = require('./XmlToken.js');

const makeLaxStream = require('./XmlTokenStream-util.test.js').makeLaxStream;
const makeStrictStream = require('./XmlTokenStream-util.test.js').makeStrictStream;
const makeLaxExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeLaxExternalSubsetStream;
const makeStrictExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeStrictExternalSubsetStream;
const expectSyntaxError = require('./XmlTokenStream-util.test.js').expectSyntaxError;
const ignoreError = require('./XmlTokenStream-util.test.js').ignoreError;
const ignoreToken = require('./XmlTokenStream-util.test.js').ignoreToken;

describe('XmlTokenStream (dtd)', () => {

   describe('parsing DOCTYPE', () => {

      it('retrieves a token of type DOCTYPE', () => {
         const s = makeStrictStream('<!DOCTYPE one >');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.DOCTYPE_START);
      });

      it('retrieves the name of the doctype', () => {
         const s = makeStrictStream('<!DOCTYPE testType >');

         expect(s.getNext().name).toEqual('testType');
      });

      it('retrieves an empty internal subset if there is none specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType >');

         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_START);
         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_END);
      });

      it('retrieves an empty internal subset if an empty one is specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType [ ] >');

         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_START);
         expect(s.getNext().type).toEqual(XmlToken.SPACE);
         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_END);
      });

      it('retrieves an a simple internal subset', () => {
         const s = makeStrictStream('<!DOCTYPE testType [ <!ENTITY test "one"> ] >');

         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_START);
         expect(s.getNext().type).toEqual(XmlToken.SPACE);
         expect(s.getNext().type).toEqual(XmlToken.ENTITY_DECL);
         expect(s.getNext().type).toEqual(XmlToken.SPACE);
         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_END);
      });

      it('does not cause problems if a close appears when none expected', () => {
         const s = makeStrictStream(']');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.CHARDATA);
         expect(t.data).toEqual(']');
      });

      it('parses the end of the DOCTYPE element when there is an internal subset', () => {
         const s = makeStrictStream('<!DOCTYPE testType [ <!ENTITY test "one"> ] > <testType></testType>');

         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_START);
         expect(s.getNext().type).toEqual(XmlToken.SPACE);
         expect(s.getNext().type).toEqual(XmlToken.ENTITY_DECL);
         expect(s.getNext().type).toEqual(XmlToken.SPACE);
         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_END);
         expect(s.getNext().name).toEqual('testType');
      });

      it('parses the end of the DOCTYPE element when there is no internal subset', () => {
         const s = makeStrictStream('<!DOCTYPE testType > <testType></testType>');
         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_START);
         expect(s.getNext().type).toEqual(XmlToken.DOCTYPE_END);
         expect(s.getNext().type).toEqual(XmlToken.SPACE);
         expect(s.getNext().name).toEqual('testType');
      });

      it('does not cause problems if the wrong kind of close is encountered', () => {
         const s = makeLaxStream('<!DOCTYPE testType [ <!ENTITY test "one"> ]]> ] >');
         ignoreToken(s, XmlToken.DOCTYPE_START);
         ignoreToken(s, XmlToken.SPACE);
         ignoreToken(s, XmlToken.ENTITY_DECL);
         ignoreToken(s, XmlToken.SPACE);
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_TEXT);
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_CONTEXT);

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.CHARDATA);
         expect(t.data).toEqual(']]>');
      });

      it('reports a syntax error if doctype is declared in a DTD context', () => {
         const s = makeLaxExternalSubsetStream('<!DOCTYPE testType > <testType></testType>');

         const t = s.getNext();
         expect(t).toEqualProps({
            code: XmlErrorToken.ERROR.DOCTYPE_INVALID_CONTEXT,
            message: 'A doctype must not be declared inside of the internal or external subset.'
         });
      });

      it('reports a syntax error if the actual type name is not a name', () => {
         expectSyntaxError('<!DOCTYPE $frog [ ] >',
            XmlErrorToken.ERROR.DOCTYPE_NAME_INVALID,
            'The document type name must match the syntax for names. Found: "$frog".');
      });

      it('reports a syntax error if there is no DOCTYPE name', () => {
         expectSyntaxError('<!DOCTYPE [ ] >',
            XmlErrorToken.ERROR.DOCTYPE_NO_NAME,
            'Missing name for the document type.');
      });

      it('reports a syntax error if there is no closing > for the DOCTYPE', () => {
         const s = makeLaxStream('<!DOCTYPE foo');
         ignoreToken(s, XmlToken.DOCTYPE_START);

         const t = s.getNext();

         expect(t.code).toEqual(XmlErrorToken.ERROR.DOCTYPE_NO_CLOSE);
         expect(t.message).toEqual('Missing closing ">" for in the document type.');
      });

      it('auto-terminates the doctype token when the > is not found as expected', () => {
         const s = makeLaxStream('<!DOCTYPE foo fish>');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_UNKNOWN);
         ignoreToken(s, XmlToken.DOCTYPE_START);
         ignoreError(s, XmlErrorToken.ERROR.DOCTYPE_NO_CLOSE);
         ignoreToken(s, XmlToken.DOCTYPE_END);
         const t = s.getNext();

         expect(t.data).toEqual('fish>');
      });

   });

   describe('parsing NOTATION declaration', () => {

      it('retrieves a token of type NOTATION', () => {
         const s = makeStrictExternalSubsetStream('<!NOTATION notationName PUBLIC "foo" >');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.NOTATION_DECL);
      });

      it('retrieves the name of the notation', () => {
         const s = makeStrictExternalSubsetStream('<!NOTATION notationName PUBLIC "foo">');

         expect(s.getNext().name).toEqual('notationName');
      });

      it('reports a syntax error if there is no notation name', () => {
         expectSyntaxError('<!NOTATION >',
            XmlErrorToken.ERROR.NOTATIONDECL_NO_NAME,
            'Missing name for a notation declaration.');
      });

      it('gives the notation token an empty name if none is specified', () => {
         const s = makeLaxExternalSubsetStream('<!NOTATION >');
         ignoreError(s, XmlErrorToken.ERROR.NOTATIONDECL_NO_NAME);
         ignoreError(s, XmlErrorToken.ERROR.NOTATIONDECL_NO_SPACE_AFTER_NAME);
         ignoreError(s, XmlErrorToken.ERROR.NOTATIONDECL_NO_EXTERNALID);

         expect(s.getNext().name).toEqual('');
      });

      it('auto-terminates the notation token when the > is not found as expected', () => {
         const s = makeLaxExternalSubsetStream('<!NOTATION myNotation fish>');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_UNKNOWN);
         ignoreError(s, XmlErrorToken.ERROR.NOTATIONDECL_NO_EXTERNALID);
         ignoreError(s, XmlErrorToken.ERROR.NOTATIONDECL_NO_CLOSE);
         let t = s.getNext(); // get the notation token
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_CONTEXT);

         t = s.getNext();
         expect(t.data).toEqual('fish>');
      });

      it('reports a syntax error if notation is declared outside of a DTD context', () => {
         expectSyntaxError('<!NOTATION frog PUBLIC "foo">',
            XmlErrorToken.ERROR.NOTATIONDECL_INVALID_CONTEXT,
            'A notation must not be declared outside of the internal or external subset.',
            new Offset(0, 0, 0),
            [ new Offset(0, 0, 0) ]);
      });

      it('reports a syntax error if there is no space after the notation name', () => {
         expectSyntaxError('<!NOTATION frog>',
            XmlErrorToken.ERROR.NOTATIONDECL_NO_SPACE_AFTER_NAME,
            'Missing space after the name in the notation declaration "frog".');
      });

      it('reports a syntax error if the actual type name is not a name', () => {
         expectSyntaxError('<!NOTATION $frog PUBLIC "foo">',
            XmlErrorToken.ERROR.NOTATIONDECL_NAME_INVALID,
            'The notation declaration name must match the syntax for names. Found: "$frog".');
      });

      it('reports a syntax error if no externalId or publicId is provided', () => {
         expectSyntaxError('<!NOTATION notationName >',
            XmlErrorToken.ERROR.NOTATIONDECL_NO_EXTERNALID,
            'Missing the external id the notation declaration "notationName".');
      });

      it('reports a syntax error if there is no closing angle bracket', () => {
         expectSyntaxError('<!NOTATION notationName PUBLIC "foo" ',
            XmlErrorToken.ERROR.NOTATIONDECL_NO_CLOSE,
            'Missing closing ">" in the notation declaration "notationName".');
      });

   });

   describe('parsing ENTITY declaration', () => {

      it('retrieves a token of type ENTITY', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity" >');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ENTITY_DECL);
      });

      it('retrieves the name of the entity', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity">');

         expect(s.getNext().name).toEqual('entityName');
      });

      it('retrieves the value of the entity in double quotes', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName "value">');

         expect(s.getNext().value).toEqual([ new XmlToken(XmlToken.TEXT, 'value') ]);
      });

      it('retrieves the value of the entity in single quotes', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName \'value\'>');

         expect(s.getNext().value).toEqual([ new XmlToken(XmlToken.TEXT, 'value') ]);
      });

      it('accepts a value with no contents', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName "">');

         expect(s.getNext().value).toEqual([ ]);
      });

      it('does not expand entity references in the value', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName "value&amp;">');

         expect(s.getNext().value).toEqual([ new XmlToken(XmlToken.TEXT, 'value&amp;') ]);
      });

      it('sets the value to undefined if none specified', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity">');

         expect(s.getNext().value).toBeUndefined();
      });

      it('retrieves the NDATA name when a two value PUBLIC is specified', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testPublic" "system" NDATA testData>');

         expect(s.getNext().notationDataName).toEqual('testData');
      });

      it('retrieves the NDATA name when a one value PUBLIC is specified ', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY entityName PUBLIC "testpublic" NDATA testData>');

         expect(s.getNext().notationDataName).toEqual('testData');
      });

      it('retrieves the NDATA name when a one value PUBLIC is specified and no space between', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY entityName PUBLIC "testpublic"NDATA testData>');
         ignoreError(s, XmlErrorToken.ERROR.ENTITYDECL_NDATA_NO_SPACE_BEFORE);

         expect(s.getNext().notationDataName).toEqual('testData');
      });

      it('retrieves an undefined NDATA name if no name included', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY entityName PUBLIC "testentity" "system" NDATA  >');
         ignoreError(s, XmlErrorToken.ERROR.ENTITYDECL_NDATA_NO_NAME);

         expect(s.getNext().notationDataName).toBeUndefined();
      });

      it('sets the notation data name to undefined if none specified', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY paramEntityName PUBLIC "testentity">');

         expect(s.getNext().notationDataName).toBeUndefined();
      });

      it('reports a syntax error if entity is declared outside of a DTD context', () => {
         expectSyntaxError('<!ENTITY entityName PUBLIC "testentity" >',
            XmlErrorToken.ERROR.ENTITYDECL_INVALID_CONTEXT,
            'An entity must not be declared outside of the internal or external subset.',
            new Offset(0, 0, 0),
            [ new Offset(0, 0, 0) ]);
      });

      it('reports a syntax error if there is no name', () => {
         expectSyntaxError('<!ENTITY >',
            XmlErrorToken.ERROR.ENTITYDECL_NO_NAME,
            'Missing name for an entity declaration.');
      });

      it('reports a syntax error if the name does not match the syntax for names', () => {
         expectSyntaxError('<!ENTITY $badName "value">',
            XmlErrorToken.ERROR.ENTITYDECL_NAME_INVALID,
            'The entity name must match the syntax for names. Found: "$badName".');
      });

      it('gives the entity token an empty name if none is specified', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY >');
         ignoreError(s, XmlErrorToken.ERROR.ENTITYDECL_NO_NAME);
         ignoreError(s, XmlErrorToken.ERROR.ENTITYDECL_NAME_NO_TRAILING_SPACE);
         ignoreError(s, XmlErrorToken.ERROR.ENTITYDECL_NO_VALUE);

         expect(s.getNext().name).toEqual('');
      });

      it('reports a syntax error if there is no closing angle bracket', () => {
         expectSyntaxError('<!ENTITY entityName PUBLIC "publicValue"',
            XmlErrorToken.ERROR.ENTITYDECL_NO_CLOSE,
            'Missing closing ">" in the entity "entityName".');
      });

      it('reports a syntax error if there is no space after the entity name', () => {
         expectSyntaxError('<!ENTITY theName>',
            XmlErrorToken.ERROR.ENTITYDECL_NAME_NO_TRAILING_SPACE,
            'Missing space after the entity "theName".');
      });

      it('reports a syntax error if there is no SYSTEM, PUBLIC or entity value', () => {
         expectSyntaxError('<!ENTITY theName >',
            XmlErrorToken.ERROR.ENTITYDECL_NO_VALUE,
            'Missing value or external identifier in entity "theName".');
      });

      it('reports a syntax error if there is no space before the NDATA marker', () => {
         expectSyntaxError('<!ENTITY theName SYSTEM "foo"NDATA fred>',
            XmlErrorToken.ERROR.ENTITYDECL_NDATA_NO_SPACE_BEFORE,
            'Missing space before NDATA in entity "theName".');
      });

      it('reports a syntax error if NDATA is the wrong case', () => {
         expectSyntaxError('<!ENTITY theName SYSTEM "foo" nData fred>',
            XmlErrorToken.ERROR.ENTITYDECL_NDATA_INVALID_CASE,
            'NDATA in entity "theName" must be upper case. Found "nData".');
      });

      it('reports a syntax error if there is no NDATA name', () => {
         expectSyntaxError('<!ENTITY theName SYSTEM "foo" NDATA>',
            XmlErrorToken.ERROR.ENTITYDECL_NDATA_NO_NAME,
            'NDATA in entity "theName" must have a name.');
      });

      it('reports a syntax error if there is no NDATA name with space after NDATA', () => {
         expectSyntaxError('<!ENTITY theName SYSTEM "foo" NDATA  >',
            XmlErrorToken.ERROR.ENTITYDECL_NDATA_NO_NAME,
            'NDATA in entity "theName" must have a name.');
      });

      it('reports a missing ">" syntax error if there is junk after the SYSTEM', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY theName SYSTEM "foo" found junk  >');
         ignoreError(s, XmlErrorToken.ERROR.ENTITYDECL_NO_CLOSE);
         let t = s.getNext(); // get the entity token
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_CONTEXT);

         t = s.getNext();
         expect(t.data).toEqual('found junk  >');
      });

      it('reports a missing ">" syntax error if there is junk after the PUBLIC', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY theName PUBLIC "one" "foo" extra  >');
         ignoreError(s, XmlErrorToken.ERROR.ENTITYDECL_NO_CLOSE);
         let t = s.getNext(); // get the entity token
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_CONTEXT);

         t = s.getNext();
         expect(t.data).toEqual('extra  >');
      });

      it('reports a missing ">" syntax error if there is junk after the NDATA', () => {
         const s = makeLaxExternalSubsetStream('<!ENTITY theName SYSTEM "foo" NDATA found junk  >');
         ignoreError(s, XmlErrorToken.ERROR.ENTITYDECL_NO_CLOSE);
         let t = s.getNext(); // get the entity token
         ignoreError(s, XmlErrorToken.ERROR.CHARDATA_INVALID_CONTEXT);

         t = s.getNext();
         expect(t.data).toEqual('junk  >');
      });

   });

   // whitebox, insofar as we "know" most of ENTITY and PARAMETER_ENTITY parsing is the same code
   describe('parsing PARAMETER_ENTITY declaration (whitebox)', () => {

      it('retrieves a token of type PARAMETER_ENTITY', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY % entityName PUBLIC "testentity" >');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.PARAMETERENTITY_DECL);
      });

      it('retrieves the NDATA name on a parameter entity', () => {
         const s = makeStrictExternalSubsetStream(
            '<!ENTITY % paramEntityName PUBLIC "testentity" "system" NDATA testData>');

         expect(s.getNext().notationDataName).toEqual('testData');
      });

      it('sets the notation data name to undefined if none specified on a parameter entity', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY % paramEntityName PUBLIC "testentity">');

         expect(s.getNext().notationDataName).toBeUndefined();
      });

      it('retrieves the name of the parameter entity', () => {
         const s = makeStrictExternalSubsetStream('<!ENTITY % paramEntityName PUBLIC "testentity">');

         expect(s.getNext().name).toEqual('paramEntityName');
      });

   });

   describe('parsing ELEMENT', () => {

      it('retrieves a token of type ELEMENT_DECL', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT elementName ANY>');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ELEMENT_DECL);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement ANY>');

         expect(s.getNext().name).toEqual('testElement');
      });

      it('retrieves an ANY content spec', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement ANY>');

         expect(s.getNext().contentType).toEqual('ANY');
      });

      it('retrieves an EMPTY content spec', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement EMPTY>');

         expect(s.getNext().contentType).toEqual('EMPTY');
      });

      it('retrieves a #PCDATA content spec', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement (#PCDATA)>');

         expect(s.getNext().contentType).toEqual([ '#PCDATA' ]);
      });

      it('retrieves a #PCDATA content spec padded with spaces', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement (    #PCDATA    )  >');

         expect(s.getNext().contentType).toEqual([ '#PCDATA' ]);
      });

      it('retrieves multiple names from the content spec', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement (#PCDATA | one|two |three)>');

         expect(s.getNext().contentType).toEqual([ '#PCDATA', 'one', 'two', 'three' ]);
      });

      it('retrieves names from the content spec regardless of spaces around "|"s', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement (zero | one|two |three)>');

         expect(s.getNext().contentType).toEqual([ 'zero', 'one', 'two', 'three' ]);
      });

      it('retrieves names from the content spec preserving their case', () => {
         const s = makeStrictExternalSubsetStream('<!ELEMENT testElement ( lower | CAPS | Initial | VaRIous )>');

         expect(s.getNext().contentType).toEqual([ 'lower', 'CAPS', 'Initial', 'VaRIous' ]);
      });

      it('reports a syntax error if notation is declared outside of a DTD context', () => {
         expectSyntaxError('<!ELEMENT testElement ( #PCDATA )>',
            XmlErrorToken.ERROR.ELEMENTDECL_INVALID_CONTEXT,
            'An element must not be declared outside of the internal or external subset.',
            new Offset(0, 0, 0),
            [ new Offset(0, 0, 0) ]);
      });

      it('reports a syntax error if there is no element name', () => {
         expectSyntaxError('<!ELEMENT >',
            XmlErrorToken.ERROR.ELEMENTDECL_NO_NAME,
            'Missing name for an element declaration.');
      });

      it('reports a syntax error if there is no content spec', () => {
         expectSyntaxError('<!ELEMENT testElement>',
            XmlErrorToken.ERROR.ELEMENTDECL_NO_SPEC,
            'Missing content spec for element declaration "testElement".');
      });

      it('reports a syntax error if #PCDATA is the wrong case', () => {
         expectSyntaxError('<!ELEMENT testElement ( #pcdata )>',
            XmlErrorToken.ERROR.ELEMENTDECL_SPEC_INVALID_CASE,
            'The content spec must be "#PCDATA". Found "#pcdata".');
      });

      it('fixes the case of #PCDATA if it is specified in the wrong case', () => {
         const s = makeLaxExternalSubsetStream('<!ELEMENT testElement ( #pcdata )>');
         ignoreError(s, XmlErrorToken.ERROR.ELEMENTDECL_SPEC_INVALID_CASE);

         expect(s.getNext().contentType).toEqual([ '#PCDATA' ]);
      });

      it('reports a syntax error if #PCDATA is not in the first position', () => {
         expectSyntaxError('<!ELEMENT testElement ( one | #PCDATA )>',
            XmlErrorToken.ERROR.ELEMENTDECL_PCDATA_NOT_FIRST,
            '#PCDATA must be first in the content spec of element declaration "testElement".');
      });

      it('reports a syntax error if there are names without dividing "|"s', () => {
         expectSyntaxError('<!ELEMENT testElement ( one two three )>',
            XmlErrorToken.ERROR.ELEMENTDECL_SPEC_NO_ORS,
            'Missing 2 "|" from the content spec in the element declaration "testElement".');
      });

      it('reports a syntax error if there are "|"s without intervening names', () => {
         expectSyntaxError('<!ELEMENT testElement ( one | two | ||three )>',
            XmlErrorToken.ERROR.ELEMENTDECL_SPEC_NO_NAMES,
            'Missing 2 name from the content spec in the element declaration "testElement".');
      });

      it('reports a syntax error if any names do not match the syntax for names', () => {
         const s = makeLaxExternalSubsetStream('<!ELEMENT testElement ( one | $bogus | bogus2! )>');

         let t = s.getNext();
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENTDECL_SPEC_NAME_INVALID);
         expect(t.message).toEqual('Names in content spec must match the syntax for names. Found "$bogus".');

         t = s.getNext();
         expect(t.code).toEqual(XmlErrorToken.ERROR.ELEMENTDECL_SPEC_NAME_INVALID);
         expect(t.message).toEqual('Names in content spec must match the syntax for names. Found "bogus2!".');
      });

      it('reports a syntax error if no closing ")" on content spec', () => {
         expectSyntaxError('<!ELEMENT testElement ( #PCDATA >',
            XmlErrorToken.ERROR.ELEMENTDECL_NO_SPEC_CLOSE,
            'Missing closing ")" for content spec in element declaration "testElement".');
      });

      it('reports a syntax error if no items in the content spec', () => {
         expectSyntaxError('<!ELEMENT testElement (  ) >',
            XmlErrorToken.ERROR.ELEMENTDECL_SPEC_ITEMS_MISSING,
            'Missing items in the content spec in element declaration "testElement".');
      });

      it('reports a syntax error if no items in the content spec, including no whitespace', () => {
         expectSyntaxError('<!ELEMENT testElement () >',
            XmlErrorToken.ERROR.ELEMENTDECL_SPEC_ITEMS_MISSING,
            'Missing items in the content spec in element declaration "testElement".');
      });

      it('reports a syntax error if content spec is the wrong case', () => {
         expectSyntaxError('<!ELEMENT testElement anY>',
            XmlErrorToken.ERROR.ELEMENTDECL_SPEC_INVALID_CASE,
            'The content spec must be "ANY". Found "anY".');
      });

      it('reports a syntax error if content spec is the wrong case', () => {
         expectSyntaxError('<!ELEMENT testElement empty   >',
            XmlErrorToken.ERROR.ELEMENTDECL_SPEC_INVALID_CASE,
            'The content spec must be "EMPTY". Found "empty".');
      });

      it('uppercases expected values', () => {
         const s = makeLaxExternalSubsetStream('<!ELEMENT testElement empty   >');
         ignoreError(s, XmlErrorToken.ERROR.ELEMENTDECL_SPEC_INVALID_CASE);

         const t = s.getNext();
         expect(t.contentType).toEqual('EMPTY');
      });

      it('reports a syntax error if an unknown content spec is found', () => {
         expectSyntaxError('<!ELEMENT testElement BOGUS>',
            XmlErrorToken.ERROR.ELEMENTDECL_SPEC_UNKNOWN,
            'An unknown content spec was found. Found "BOGUS".');
      });

      it('gives the notation token an empty name if none is specified', () => {
         const s = makeLaxExternalSubsetStream('<!ELEMENT >');
         ignoreError(s, XmlErrorToken.ERROR.ELEMENTDECL_NO_NAME);
         ignoreError(s, XmlErrorToken.ERROR.ELEMENTDECL_NO_SPEC);

         expect(s.getNext().name).toEqual('');
      });

      it('reports a syntax error if the actual name is not a name', () => {
         expectSyntaxError('<!ELEMENT $badName ANY>',
            XmlErrorToken.ERROR.ELEMENTDECL_NAME_INVALID,
            'The element declaration name must match the syntax for names. Found: "$badName".');
      });

      it('reports a syntax error if there is no closing angle bracket', () => {
         expectSyntaxError('<!ELEMENT elemName ANY ',
            XmlErrorToken.ERROR.ELEMENTDECL_NO_CLOSE,
            'Missing closing ">" in the element declaration "elemName".');
      });

   });

   describe('parsing ATTLIST', () => {

      it('retrieves a token of type ATTLIST_DECL', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName attrName CDATA #REQUIRED >');

         const t = s.getNext();
         expect(t.type).toEqual(XmlToken.ATTLIST_DECL);
      });

      it('retrieves the name of the element the attributes are associated with', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName attrName CDATA #REQUIRED>');

         expect(s.getNext().elementName).toEqual('elementName');
      });

      it('retrieves the an attribute definition', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName attrName CDATA #REQUIRED>');

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
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

         expect(s.getNext().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ 'this is a test value' ]
         } ]);
      });

      it('recognizes an default value in single quotes', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA \'this is a test value\'>');

         expect(s.getNext().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ 'this is a test value' ]
         } ]);
      });

      it('recognizes an empty default value', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "">');

         expect(s.getNext().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ ]
         } ]);
      });

      it('recognizes an default with a reference in it, without expanding it', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA "one &amp;">');

         expect(s.getNext().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ 'one &amp;' ]
         } ]);
      });

      it('recognizes an default value with the #FIXED flag', () => {
         const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName CDATA #FIXED "this is a test value">');

         expect(s.getNext().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#FIXED',
            value: [ 'this is a test value' ]
         } ]);
      });

      it('fixes a mistaken capitalization of the type', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'CDataName cdata #REQUIRED>');
         ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_ATTR_TYPE_INVALID);

         expect(s.getNext().attributes).toEqual([ {
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
         ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_INVALID);

         expect(s.getNext().attributes).toEqual([ {
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
         ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_INVALID);

         expect(s.getNext().attributes).toEqual([ {
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
         ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_INVALID);

         expect(s.getNext().attributes).toEqual([ {
            name: 'CDataName',
            type: 'CDATA',
            list: undefined,
            flag: '#FIXED',
            value: [ 'foo' ]
         } ]);
      });

      it('reports a syntax error if an attribute list is declared outside of a DTD context', () => {
         expectSyntaxError('<!ATTLIST elementName attrName CDATA #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_INVALID_CONTEXT,
            'An attribute list must not be declared outside of the internal or external subset.',
            new Offset(0, 0, 0),
            [ new Offset(0, 0, 0) ]);
      });

      it('reports a syntax error if there is no element name', () => {
         expectSyntaxError('<!ATTLIST >',
            XmlErrorToken.ERROR.ATTLISTDECL_NO_NAME,
            'Missing element name in an attribute list declaration.');
      });

      it('reports a syntax error if there no attributes', () => {
         expectSyntaxError('<!ATTLIST elementName>',
            XmlErrorToken.ERROR.ATTLISTDECL_NO_ATTRIBUTES,
            'Missing attribute definitions for an attribute declaration for "elementName".');
      });

      it('reports a syntax error if the element name is invalid', () => {
         expectSyntaxError('<!ATTLIST bad$name>',
            XmlErrorToken.ERROR.ATTLISTDECL_NAME_INVALID,
            'The element name must match the syntax for names. Found "bad$name".');
      });

      it('reports a syntax error if the element name is invalid', () => {
         expectSyntaxError('<!ATTLIST elemName attr$name >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NAME_INVALID,
            'The attribute name must match the syntax for names. Found "attr$name".');
      });

      it('reports a syntax error if the type is missing', () => {
         expectSyntaxError('<!ATTLIST elemName attrName >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NO_TYPE,
            'Missing type for attribute "attrName" in the attribute declaration for "elemName".');
      });

      it('reports a syntax error if an unknown attribute type is specified', () => {
         expectSyntaxError('<!ATTLIST elemName attrName BOGUS #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_TYPE_UNKNOWN,
            'The type must be a standardized value in the attribute declaration for "elemName". Found "BOGUS".');
      });

      it('reports a syntax error if an attribute type is specified in the wrong case', () => {
         expectSyntaxError('<!ATTLIST elemName attrName IdRef #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_TYPE_INVALID,
            'The type "IDREF" must be upper case in the attribute declaration for "elemName". Found "IdRef".');
      });

      it('reports a syntax error if an attribute flag in the wrong case', () => {
         expectSyntaxError('<!ATTLIST elemName attrName IDREF #implied >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_INVALID,
            'The default "#IMPLIED" must be upper case in the attribute declaration for "elemName". Found "#implied".');
      });

      it('reports a syntax error if there is an unknown attribute flag', () => {
         expectSyntaxError('<!ATTLIST elemName attrName IDREF #FROG >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN,
            'The default "#FROG" must be one of the specified default values in attribute declaration for "elemName".');
      });

      it('reports a syntax error if there is an unknown attribute flag', () => {
         expectSyntaxError('<!ATTLIST elemName attrName IDREF #FROG >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN,
            'The default "#FROG" must be one of the specified default values in attribute declaration for "elemName".');
      });

      it('reports a syntax error if notation has no values', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( ) #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NOTA_EMPTY,
            'The notation in the attribute declaration for "e" must have one or more names.');
      });

      it('reports a syntax error if notation has no parenthesis values', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NOTA_EMPTY,
            'The notation in the attribute declaration for "e" must have one or more names.');
      });

      it('reports a syntax error if notation values are not names', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( $bad ) #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NOTA_NAME_INVALID,
            'The name in the attribute declaration for "e" must match the syntax for names. Found "$bad".');
      });

      it('reports a syntax error if notation has no space between NOTATION and list', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION( name ) #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NOTA_NO_SPACE,
            'The notation in the attribute declaration for "e" must have a space before the name.');
      });

      it('reports a syntax error if notation has no vertical bars between NOTATION names', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name name2 ) #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_LIST_NO_ORS,
            'Missing 1 "|" from the attribute declaration for "e".');
      });

      it('extracts the expected notation names if a vertical bar between NOTATION names is omitted', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName NOTATION ( name name2 ) #REQUIRED >');
         ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_ATTR_LIST_NO_ORS);

         expect(s.getNext().attributes).toEqual([ {
            name: 'attrName',
            type: 'NOTATION',
            list: [ 'name', 'name2' ],
            flag: '#REQUIRED',
            value: undefined
         } ]);
      });

      it('reports a syntax error if notation has extra vertical bars between NOTATION names', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name | || | name2 ) #REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_LIST_NO_NAMES,
            'Missing 3 name from the attribute declaration for "e".');
      });

      it('reports a syntax error if notation has no terminating ")" to the list', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NOTA_NO_CLOSE,
            'Missing closing ")" for the notation in the attribute definition for "attrName".');
      });

      it('reports a syntax error if notation has no termination to the list or the whole attribute', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name #REQUIRED ',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NOTA_NO_CLOSE,
            'Missing closing ")" for the notation in the attribute definition for "attrName".');
      });

      it('reports a syntax error if there is no space between the closing ")" and the default', () => {
         expectSyntaxError('<!ATTLIST e attrName NOTATION ( name | name2 )#REQUIRED >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE,
            'Missing space before default for attribute "attrName" in the attribute declaration for "e".');
      });

      it('reports a syntax error if the default is missing', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA>',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NO_DEFAULT,
            'Missing default value for attribute "attrName" in the attribute declaration for "elemName".');
      });

      it('reports a syntax error if no space between the type and the #FIXED flag and the attribute value', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA#FIXED "test value">',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE,
            'Missing space before default for attribute "attrName" in the attribute declaration for "elemName".');
      });

      it('reports a syntax error if no space between the #FIXED flag and the attribute value', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA #FIXED"test value">',
            XmlErrorToken.ERROR.ATTLISTDECL_FIXED_NO_SPACE,
            'Missing space after #FIXED in attribute declaration for "elemName".');
      });

      it('reports a syntax error if no space between type and the attribute default', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA"test value">',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_DEFAULT_NO_SPACE,
            'Missing space before default for attribute "attrName" in the attribute declaration for "elemName".');
      });

      it('reports a syntax error if the close is missing', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA #REQUIRED',
            XmlErrorToken.ERROR.ATTLISTDECL_NO_CLOSE,
            'Missing closing ">" in the attribute list declaration "elemName".');
      });

      it('reports a syntax error if there is a "<" in the attribute value', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA #FIXED "test < value">',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_INVALID,
            'Must not have a "<" in an attribute value in the attribute list declaration for "elemName".');
      });

      it('allows an attribute with "<" in the default if the right lax flag is set', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'attrName CDATA "one < two">', {
                  'lax:allowOpenAngleBracketsInAttributeValues': true
               });

         expect(s.getNext().attributes).toEqual([ {
            name: 'attrName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ 'one < two' ]
         } ]);
      });

      it('terminates the attribute list element early if there is a "<" in the attribute value ', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST elementName ' +
               'attrName CDATA "one < two">');
         ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_ATTR_INVALID);
         ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_NO_CLOSE);

         expect(s.getNext().attributes).toEqual([ {
            name: 'attrName',
            type: 'CDATA',
            list: undefined,
            flag: undefined,
            value: [ 'one ' ]
         } ]);

         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_XTRA_LEADING_SPACE);
         ignoreError(s, XmlErrorToken.ERROR.ELEMENT_NAME_INVALID);
         expect(s.getNext().type).toEqual(XmlToken.ELEMENT_START);
      });

      it('reports a syntax error if there is not a closing quote', () => {
         expectSyntaxError('<!ATTLIST elemName attrName CDATA "test >',
            XmlErrorToken.ERROR.ATTLISTDECL_ATTR_NO_CLOSE_QUOTE,
            'Missing closing quote in the attribute list declaration for "elemName".');
      });

      describe('enumeration type', () => {

         it('recognizes an enumeration type ', () => {
            const s = makeStrictExternalSubsetStream('<!ATTLIST elementName ' +
                  'EnumerationName ( one ) #IMPLIED>');

            expect(s.getNext().attributes).toEqual([ {
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

            expect(s.getNext().attributes).toEqual([ {
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

            expect(s.getNext().attributes).toEqual([ {
               name: 'EnumerationName',
               type: 'ENUMERATION',
               list: [ '-one' ],
               flag: '#IMPLIED',
               value: undefined
            } ]);
         });

         it('reports a syntax error if there is no space between the attr name and the enumerations', () => {
            expectSyntaxError('<!ATTLIST e attrName( name ) #REQUIRED>',
               XmlErrorToken.ERROR.ATTLISTDECL_ATTR_ENUM_NO_PRESPACE,
               'Must have a space before enumeration in attribute declaration for "e".',
               new Offset(0, 20, 20),
               [ new Offset(0, 0, 0) ]);
         });

         it('extracts the expected notation names if a vertical bar between enumeration names is omitted', () => {
            const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName( name ) #REQUIRED>');
            ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_ATTR_ENUM_NO_PRESPACE);

            expect(s.getNext().attributes).toEqual([ {
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
               XmlErrorToken.ERROR.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID,
               'The value in the enumeration in the attribute declaration for "e" must match the syntax for ' +
                  'nmtokens. Found "$bad".');
         });

         it('reports a syntax error if the enumeration is mising a close ")"', () => {
            expectSyntaxError('<!ATTLIST e attrName ( name >',
               XmlErrorToken.ERROR.ATTLISTDECL_ATTR_ENUM_NO_CLOSE,
               'Missing closing ")" for the enumeration in the attribute definition for "attrName".');
         });

         it('reports a syntax error if enumeration has no vertical bars between names', () => {
            expectSyntaxError('<!ATTLIST e attrName ( name name2 ) #REQUIRED >',
               XmlErrorToken.ERROR.ATTLISTDECL_ATTR_LIST_NO_ORS,
               'Missing 1 "|" from the attribute declaration for "e".');
         });

         it('extracts the expected notation names if a vertical bar between enumeration names is omitted', () => {
            const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( name name2 ) #REQUIRED >');
            ignoreError(s, XmlErrorToken.ERROR.ATTLISTDECL_ATTR_LIST_NO_ORS);

            expect(s.getNext().attributes).toEqual([ {
               name: 'attrName',
               type: 'ENUMERATION',
               list: [ 'name', 'name2' ],
               flag: '#REQUIRED',
               value: undefined
            } ]);
         });

         it('reports a syntax error if enumeration has extra vertical bars between names', () => {
            expectSyntaxError('<!ATTLIST e attrName ( name | || | name2 ) #REQUIRED >',
               XmlErrorToken.ERROR.ATTLISTDECL_ATTR_LIST_NO_NAMES,
               'Missing 3 name from the attribute declaration for "e".');
         });

      });

      describe('value', () => {

         it('reports a syntax error if there is no value after the fixed flag', () => {
            expectSyntaxError('<!ATTLIST e attrName CDATA #FIXED>',
               XmlErrorToken.ERROR.ATTLISTDECL_ATTR_FIXED_NO_VALUE,
               'Must have a value after #FIXED in attribute declaration for "e".',
               new Offset(0, 33, 33),
               [ new Offset(0, 0, 0) ]);
         });

      });

   });

   describe('parsing ExternalId', () => {

      it('retrieves only a systemLiteral when SYSTEM is specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType SYSTEM "./system.xml" [ ] >');

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('./system.xml');
         expect(t.pubidLiteral).toBeUndefined();
      });

      it('retrieves both a systemLiteral and a pubidLiteral when PUBLIC specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC "public" "./system.xml" [ ] >');

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('public');
         expect(t.systemLiteral).toEqual('./system.xml');
      });

      it('retrieves the public and system literals when PUBLIC is specified, and an internal dtd is specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC "./public.xml" "./system.xml" [ <!ENTITY foo "bar">] >');

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('./system.xml');
         expect(t.pubidLiteral).toEqual('./public.xml');
      });

      it('retrieves the public and system literals when PUBLIC is specified, no internal dtd is specified', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC "./public.xml" "./system.xml" >');

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('./system.xml');
         expect(t.pubidLiteral).toEqual('./public.xml');
      });

      it('retrieves a systemLiteral in single quotes', () => {
         const s = makeStrictStream('<!DOCTYPE testType SYSTEM \'./system.xml\' [ ] >');

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('./system.xml');
         expect(t.pubidLiteral).toBeUndefined();
      });

      it('retrieves both a systemLiteral and a pubidLiteral in single quotes', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC \'public\' \'./system.xml\' [ ] >');

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('public');
         expect(t.systemLiteral).toEqual('./system.xml');
      });

      it('retrieves zero length publicID and system literals', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC "" "" [ ] >');

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('');
         expect(t.systemLiteral).toEqual('');
      });

      it('reports a syntax error if the pubidLiteral is not quoted', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC pubid "system" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_PUBLIC_NO_QUOTE,
            'Missing quotes around the public literal.');
      });

      it('reports a syntax error if the systemLiteral is not quoted', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid" system [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_SYSTEM_NO_QUOTE,
            'Missing quotes around the system literal.');
      });

      it('retrieves the publicID and system literals even when unquoted', () => {
         const s = makeLaxStream('<!DOCTYPE testType PUBLIC one two [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_PUBLIC_NO_QUOTE);
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_SYSTEM_NO_QUOTE);

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('one');
         expect(t.systemLiteral).toEqual('two');
      });

      it('reports a syntax error if the public id has illegal characters', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC \'"\' "system" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_PUBLIC_INVALID_CHARS,
            'The public literal has invalid charaters. Found """.');
      });

      it('reports a syntax error if the public id has some legal and some illegal characters', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "ABCDE{" "system" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_PUBLIC_INVALID_CHARS,
            'The public literal has invalid charaters. Found "{".');
      });

      it('retrieves the publicID literal even when it has illegal characters', () => {
         const s = makeLaxStream('<!DOCTYPE testType PUBLIC "ABCDE{" "two" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_PUBLIC_INVALID_CHARS);

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('ABCDE{');
      });

      it('throws no error if the public id has all legal characters', () => {
         const s = makeStrictStream('<!DOCTYPE testType PUBLIC " \n\r-\'()+,./:=?;!*#@$_%' +
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"  "system" [ ] >');

         expect(() => {
            s.getNext();
         }).not.toThrowError();
      });

      it('reports a syntax error if PUBLIC is the wrong case', () => {
         expectSyntaxError('<!DOCTYPE testType PuBliC "pubid" "system" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_INVALID_CASE,
            'The "PUBLIC" label must be all upper case. Found "PuBliC".');
      });

      it('retrieves the publicID literal even when PUBLIC is the wrong case', () => {
         const s = makeLaxStream('<!DOCTYPE testType public "ABCDE" "two" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_INVALID_CASE);

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('ABCDE');
      });

      it('reports a syntax error if SYSTEM is the wrong case', () => {
         expectSyntaxError('<!DOCTYPE testType SYStem "system" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_INVALID_CASE,
            'The "SYSTEM" label must be all upper case. Found "SYStem".');
      });

      it('retrieves the systemLiteral literal even when SYSTEM is the wrong case', () => {
         const s = makeLaxStream('<!DOCTYPE testType system "ABCDE" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_INVALID_CASE);

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('ABCDE');
      });

      it('reports a syntax error if no space between the pubid and system', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid""system" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_PUBLIC_NO_SPACE,
            'Missing space beteen the public and the system literals.');
      });

      it('reports a syntax error if no space between SYSTEM and the literal', () => {
         expectSyntaxError('<!DOCTYPE testType SYSTEM"system" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
            'Missing space beteen SYSTEM and the literal.');
      });

      it('reports a syntax error if no space between PUBLIC and the literal', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC"pubid" "system" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_PUBLIC_NO_LEADING_SPACE,
            'Missing space beteen PUBLIC and the literal.');
      });

      it('retrieves the systemLiterals even when spaces missing', () => {
         const s = makeLaxStream('<!DOCTYPE testType SYSTEM"one" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_SYSTEM_NO_LEADING_SPACE);

         const t = s.getNext();
         expect(t.systemLiteral).toEqual('one');
      });

      it('retrieves the publicID and system literals even when spaces missing', () => {
         const s = makeLaxStream('<!DOCTYPE testType PUBLIC"one""two" [ ] >');
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_PUBLIC_NO_LEADING_SPACE);
         ignoreError(s, XmlErrorToken.ERROR.EXTERNALID_PUBLIC_NO_SPACE);

         const t = s.getNext();
         expect(t.pubidLiteral).toEqual('one');
         expect(t.systemLiteral).toEqual('two');
      });

      it('reports a syntax error if there is an unknown type of external id', () => {
         expectSyntaxError('<!DOCTYPE testType FOO [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_UNKNOWN,
            'The external id was an unknown type. Found "FOO".');
      });

      it('reports a syntax error if systemLiteral is missing from a PUBLIC externalId', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC "pubid" [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_NO_SYSTEM,
            'Missing system literal.');
      });

      it('reports no syntax error if systemLiteral is missing, but this is a PublicID', () => {
         const s = makeStrictExternalSubsetStream('<!NOTATION testType PUBLIC "pubid" >');

         expect(() => {
            s.getNext();
         }).not.toThrowError();
      });

      it('reports a syntax error if systemLiteral is missing from a SYSTEM externalId', () => {
         expectSyntaxError('<!DOCTYPE testType SYSTEM [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_NO_SYSTEM,
            'Missing system literal.');
      });

      it('reports a syntax error if pubIdLiteral is missing from a PUBLIC externalId', () => {
         expectSyntaxError('<!DOCTYPE testType PUBLIC [ ] >',
            XmlErrorToken.ERROR.EXTERNALID_NO_PUBLIC,
            'Missing public literal.');
      });

   });

});
