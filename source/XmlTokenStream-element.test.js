/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./shared/Offset.js');
const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./shared/TextChunk.js');
const tokens = require('./XmlToken.js');
const WellFormednessError = require('./error/WellFormednessError.js');
const XmlEntityManager = require('./XmlEntityManager.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlTokenStream = require('./XmlTokenStream.js');
const XmlWarning = require('./error/XmlWarning.js');

const testUtils = require('./XmlTokenStream-util.test.js');
const makeStrictStream = testUtils.makeStrictStream;
const makeStrictExternalEntityStream = testUtils.makeStrictExternalEntityStream;
const expectXmlWarning = testUtils.expectXmlWarning;
const expectError = testUtils.expectError;
const ignoreError = testUtils.ignoreError;
const ignoreToken = testUtils.ignoreToken;
const makeStringTokenArray = testUtils.makeStringTokenArray;

const makeLaxStream = testUtils.makeLaxStream;
const makeLaxExternalSubsetStream = testUtils.makeLaxExternalSubsetStream;
const makeLaxExternalEntityStream = testUtils.makeLaxExternalEntityStream;
const expectSyntaxError = testUtils.expectSyntaxError;
const expectTokenType = testUtils.expectTokenType;

function compareAttribute(attr, name, value) {
   expect(attr.name).toEqual(name);
   expect(attr.value).toEqual(value ? [ new tokens.Text(value, tokens.ATTR_NO_CHUNKS) ] : []);
}

describe('XmlTokenStream (element)', () => {
   let defaultLoc;
   let entityMetaData1dot1;
   let entityMetaData1dot0rev4;
   let entityMetaData1dot0rev5;

   /*
    * This set of tests validates whether our name validation code
    * works approximately correctly. This is assuming we do the same
    * validity checks for all names, so we only test it for elements
    */
   describe('name validity checks (whitebox)', () => {

      beforeEach(() => {
         defaultLoc = new EntityLocation();
         entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.1, 2, defaultLoc);
         entityMetaData1dot0rev4 = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 4, defaultLoc);
         entityMetaData1dot0rev5 = new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5, defaultLoc);
      });

      it('accepts an element name as a legal name if it is just letters', () => {
         const s = makeLaxExternalEntityStream('<one></one>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has a hyphen, period or digit in it', () => {
         const s = makeLaxExternalEntityStream('<on.-8></on.-8>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has the allowable chars above ascii in it', () => {
         const s = makeLaxExternalEntityStream('<o\u00B7\u0310\u2040e></o\u00B7\u0310\u2040e>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has an astral character in it (e.g. an emoji)', () => {
         const s = makeLaxExternalEntityStream('<o\uD83D\uDC04e></o\uD83D\uDC04e>');  // cow emoji

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name starts with an astral character (e.g. an emoji)', () => {
         const s = makeLaxExternalEntityStream('<\uD83D\uDC04moo></\uD83D\uDC04moo>');  // cow emoji

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has a bunch of the name chars in it', () => {
         const s = makeLaxExternalEntityStream('<ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1>' +
               '</ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name as a legal name if it has a uFDF1 in it', () => {
         const s = makeLaxExternalEntityStream('<o\uFDF1e></o\uFDF1e>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('rejects an element name if it has a $ in it', () => {
         expectSyntaxError('<o$e></o$e>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "o$e".');
      });

      it('rejects an element name if it starts with a digit', () => {
         expectSyntaxError('<9ne></9ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "9ne".');
      });

      it('rejects an element name if it starts with a hyphen', () => {
         expectSyntaxError('<-ne></-ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "-ne".');
      });

      it('rejects an element name if it starts with a period', () => {
         expectSyntaxError('<.ne></.ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: ".ne".');
      });

      it('rejects an element name if it starts with a u00B7', () => {
         expectSyntaxError('<\u00B7ne></\u00B7ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u00B7ne".');
      });

      it('rejects an element name if it starts with a u0320', () => {
         expectSyntaxError('<\u0320ne></\u0320ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u0320ne".');
      });

      it('rejects an element name if it starts with a u2040', () => {
         expectSyntaxError('<\u2040></\u2040>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u2040".');
      });

      it('rejects an element name as a legal name if it has u03F4 in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<\u03F4ne></\u03F4ne>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "\u03F4ne".');
      });

      it('accepts an element name if it starts with a u03F4 in version 1.0/5', () => {
         const s = makeLaxStream('<\u03F4ne></\u03F4ne>', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name if it starts with a u03F4 in version 1.1', () => {
         const s = makeLaxStream('<\u03F4ne></\u03F4ne>', entityMetaData1dot1);

         expectTokenType(s, tokens.ElementStart);
      });

      it('rejects an element name that starts with some bad 1.0 characters in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<f\u0eceb></f\u0eceb>',
            SyntaxError.ID.ELEMENT_NAME_INVALID,
            'The element tag name must match the syntax for names. Found: "f\u0eceb".');
      });

      it('accepts an element name if it starts with a some bad 1.0 chars in version 1.0/5', () => {
         const s = makeLaxStream('<f\u0eceb></f\u0eceb>', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.ElementStart);
      });

      it('accepts an element name if it starts with a some bad 1.0 chars in version 1.1', () => {
         const s = makeLaxStream('<f\u0eceb></f\u0eceb>', entityMetaData1dot1);

         expectTokenType(s, tokens.ElementStart);
      });

   });

   describe('nameToken validity checks (whitebox)', () => {

      beforeEach(() => {
         defaultLoc = new EntityLocation();
         entityMetaData1dot1 = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2, defaultLoc);
         entityMetaData1dot0rev4 = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4, defaultLoc);
         entityMetaData1dot0rev5 = new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5, defaultLoc);
      });

      it('accepts a nmToken as valid if it is just letters', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( name ) #REQUIRED>');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if it has a hyphen, period or digit in it', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( on.-8 )  #REQUIRED>');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with allowable chars above ascii in it', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \u00B7\u0310\u2040e ) #REQUIRED>');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with an astral character in it (e.g. an emoji)', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \uD83D\uDC04e ) #IMPLIED>'); // emoji

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if it has a bunch of the name chars in it', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName NOTATION ( ' +
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_\u00CE' +
            '\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1 ) #REQUIRED>');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a uFDF1', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \uFDF1e ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('marks a word as a non-name token if it has a $ in it', () => {
         expectSyntaxError('<!ATTLIST e attrName ( o$e ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID,
            'The value in the enumeration in the attribute declaration must ' +
               'match the syntax for nmtokens. Found "o$e".');
      });

      it('accepts a nmToken as valid if starts with a digit', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9ne ) #REQUIRED >',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4, defaultLoc));

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a hyphen', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( -ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a period', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( .ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u00B7', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \u00B7ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u0320', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \u0320ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u2040', () => {
         const s = makeLaxExternalSubsetStream('<!ATTLIST e attrName ( \u2040ne ) #REQUIRED >');

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u03F4 in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<!ATTLIST e attrName ( \u2040ne ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID,
            'The value in the enumeration in the attribute declaration must ' +
               'match the syntax for nmtokens. Found "\u2040ne".');
      });

      it('accepts a nmToken as valid if starts with a u03F4 in version 1.0/5', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( \u2040ne ) #REQUIRED >', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if starts with a u03F4 in version 1.1', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( \u2040ne ) #REQUIRED >', entityMetaData1dot1);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken if it has a bunch of questionable chars in version 1.0/4', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9._-:你\u0A2Afoo ) #REQUIRED >', entityMetaData1dot0rev4);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken as valid if it has some bad 1.0 chars in version 1.0/4', () => {
         expectSyntaxError(entityMetaData1dot0rev4,
            '<!ATTLIST e attrName ( 9._-:你\u0A2A\u0ecefoo ) #REQUIRED >',
            SyntaxError.ID.ATTLISTDECL_ATTR_ENUM_NMTOKEN_INVALID,
            'The value in the enumeration in the attribute declaration must ' +
               'match the syntax for nmtokens. Found "9._-:你\u0A2A\u0ecefoo".');
      });

      it('accepts a nmToken if it has a bunch of questionable chars in version 1.0/5', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9._-:你\u0A2A\u0ecefoo ) #REQUIRED>', entityMetaData1dot0rev5);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

      it('accepts a nmToken if it has a bunch of questionable chars in version 1.1', () => {
         const s = makeLaxStream('<!ATTLIST e attrName ( 9._-:你\u0A2A\u0ecefoo ) #REQUIRED >', entityMetaData1dot1);

         expectTokenType(s, tokens.AttrListDeclaration);
      });

   });

   describe('parsing start element tags', () => {

      it('retrieves a token of type START_ELEMENT', () => {
         const s = makeStrictExternalEntityStream('<name>');

         expectTokenType(s, tokens.ElementStart);
      });

      it('retrieves the name of the element', () => {
         const s = makeStrictExternalEntityStream('<name>');

         const t = s.read();
         expect(t.name).toEqual('name');
      });

      it('retrieves the name with a slash in it in lax mode', () => {
         const s = makeLaxExternalEntityStream('<n/ame>');
         ignoreError(s, SyntaxError.ID.ELEMENT_NAME_INVALID);

         const t = s.read();
         expect(t.name).toEqual('n/ame');
      });

      it('retrieves an empty name if there is no name in the start tag', () => {
         const s = makeLaxExternalEntityStream('<>');
         ignoreError(s, SyntaxError.ID.ELEMENT_NO_NAME);

         const t = s.read();
         expect(t.name).toEqual('');
      });

      it('allows S after the name', () => {
         const s = makeStrictExternalEntityStream('<name     >');

         const t = s.read();
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

         const t = s.read();
         expect(t.name).toEqual('XML-Foo');
      });

      it('allows a name to start with just "xml" if this is 1.0/5', () => {
         const s = makeStrictStream('<xmlFoo></xmlFoo>',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5, new EntityLocation()));
         expectTokenType(s, tokens.ElementStart);

         const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('tw', tokens.ATTR_NO_CHUNKS),
                  new tokens.EntityStart('quot', false, tokens.ATTR_NO_CHUNKS),
                  new tokens.EntityEnd('quot', tokens.ATTR_NO_CHUNKS),
                  new tokens.Text('o', tokens.ATTR_NO_CHUNKS)
               ],
               quoteType: '"'
            } ]);
         });

         it('will accept a reference to an unknown entity', () => {
            const s = makeStrictExternalEntityStream('<elemName attr1="tw&test;o">');
            const t = s.read();

            expect(t.attributes).toEqual([ {
               name: 'attr1',
               value: [ new tokens.Text('tw', tokens.ATTR_NO_CHUNKS),
                  new tokens.EntityStart('test', false, tokens.ATTR_NO_CHUNKS),
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

            const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
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

            const t = s.read();
            compareAttribute(t.attributes[0], 'attr1', undefined);
            compareAttribute(t.attributes[1], 'value', undefined);
         });

         it('considers quotes in a name to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName attr1"boo"  two=value>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.read();
            compareAttribute(t.attributes[0], 'attr1"boo"', undefined);
            compareAttribute(t.attributes[1], 'two', 'value');
         });

         it('does not consider a close angle bracket to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName one>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);

            const t = s.read();
            compareAttribute(t.attributes[0], 'one', undefined);
         });

         it('does not consider a close angle bracket to be part of the value in a bad value', () => {
            const s = makeLaxExternalEntityStream('<elementName one=two>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.read();
            compareAttribute(t.attributes[0], 'one', 'two');
         });

         it('does not consider a close angle bracket to be part of the value when no equal', () => {
            const s = makeLaxExternalEntityStream('<elementName one >');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);

            const t = s.read();
            compareAttribute(t.attributes[0], 'one', undefined);
         });

         it('considers quotes at the start of the name to be part of the name', () => {
            const s = makeLaxExternalEntityStream('<elementName "one="vone"  \'two=vtwo>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.read();
            compareAttribute(t.attributes[0], '"one', 'vone');
            compareAttribute(t.attributes[1], '\'two', 'vtwo');
         });

         it('handles eof in middle of name', () => {
            const s = makeLaxExternalEntityStream('<elementName nam');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.read();
            compareAttribute(t.attributes[0], 'nam', undefined);
         });

         it('handles eof after equal', () => {
            const s = makeLaxExternalEntityStream('<elementName name=');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.read();
            compareAttribute(t.attributes[0], 'name', undefined);
         });

         it('handles eof in value', () => {
            const s = makeLaxExternalEntityStream('<elementName name="one');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_CLOSE_QUOTE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.read();
            compareAttribute(t.attributes[0], 'name', 'one');
         });

         it('handles eof at start of value', () => {
            const s = makeLaxExternalEntityStream('<elementName name="');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_CLOSE_QUOTE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.read();
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

            let t = s.read();

            compareAttribute(t.attributes[0], 'name', 'one');
            ignoreError(s, SyntaxError.ID.ELEMENT_NAME_INVALID);

            t = s.read();
            expect(t.name).toEqual('two"');
         });

         it('considers < part of attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeLaxExternalEntityStream('<elementName name="one<two">', {
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });

            const t = s.read();

            compareAttribute(t.attributes[0], 'name', 'one<two');
         });

         it('terminates start tag if an < in a quoteless attribute value in lax mode', () => {
            const s = makeLaxExternalEntityStream('<elementName name=one<two">');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_VALUE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            let t = s.read();

            compareAttribute(t.attributes[0], 'name', 'one');
            ignoreError(s, SyntaxError.ID.ELEMENT_NAME_INVALID);

            t = s.read();
            expect(t.name).toEqual('two"');
         });

         it('terminates gracefully even when EOF at end of quoteless attribute value', () => {
            const s = makeLaxExternalEntityStream('<elementName name=one');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);
            ignoreError(s, SyntaxError.ID.ELEMENT_NO_CLOSE);

            const t = s.read();

            compareAttribute(t.attributes[0], 'name', 'one');
         });

         it('considers < part of quoteless attribute value if lax:allowOpenAngleBracketsInAttributeValues', () => {
            const s = makeLaxExternalEntityStream('<elementName name=one<two">', {
               'lax:allowOpenAngleBracketsInAttributeValues': true
            });
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.read();
            compareAttribute(t.attributes[0], 'name', 'one<two"');
         });

         describe('basic (CDATA) normalization', () => {

            it('will replace spaces, newlines and tabs in ordinary text with spaces', () => {
               const s = makeStrictExternalEntityStream('<elemName attr1="space: , tab:\t, newline:\n, cr:\r">');
               const t = s.read();

               expect(t.attributes).toEqual([ {
                  name: 'attr1',
                  value: [ new tokens.Text('space: , tab: , newline: , cr: ', tokens.ATTR_NO_CHUNKS) ],
                  quoteType: '"'
               } ]);
            });

            it('will not replace characters in character references', () => {
               const s = makeStrictExternalEntityStream('<el attr1="space:&#32;, tab:&#9;, newline:&#10;, cr:&#13;">');
               const t = s.read();

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

         const t = s.read();
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

         expect(s.read().name).toEqual('name');
      });

      it('allows space after the name', () => {
         const s = makeStrictExternalEntityStream('<name     />');

         expect(s.read().name).toEqual('name');
      });

      it('retrieves attributes, if present', () => {
         const s = makeStrictExternalEntityStream('<name attr="one">');

         expect(s.read().attributes[0].name).toEqual('attr');
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

         const t = s.read();
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

         const t = s.read();
         expect(t.name).toEqual('name');
      });

      it('retrieves an empty name if there is no name in the end tag', () => {
         const s = makeLaxStream('<?xml version="1.0"?><name></>');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.ElementStart);
         ignoreError(s, SyntaxError.ID.ELEMENT_NO_NAME);
         ignoreError(s, WellFormednessError.ID.ELEMENT_UNBALANCED);

         const t = s.read();
         expect(t.name).toEqual('');
      });

      it('allows space after the name', () => {
         const s = makeStrictStream('<?xml version="1.0"?><name></name     >');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.ElementStart);

         const t = s.read();
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
            s.read();
         }).not.toThrowError();
      });

      it('throws an error if the end element name does not match the start', () => {
         const s = makeStrictExternalEntityStream('<one></two>');
         ignoreToken(s, tokens.ElementStart);

         expect(() => {
            s.read();
         }).toThrowError('Expected end tag "one". Found "two".');
      });

      it('throws an error if the end element name does not match the start, even on deeper trees', () => {
         const s = makeStrictExternalEntityStream('<one><two><one></one></one></one>');
         ignoreToken(s, tokens.ElementStart);
         ignoreToken(s, tokens.ElementStart);
         ignoreToken(s, tokens.ElementStart);
         ignoreToken(s, tokens.ElementEnd);

         expect(() => {
            s.read();
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
         const t = s.read();

         expect(t.name).toEqual('xml-foo');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<one></one >');
         ignoreToken(s, tokens.ElementStart);

         const t = s.read();
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

});
