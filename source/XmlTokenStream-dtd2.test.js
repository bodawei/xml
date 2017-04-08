/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const EntityLocation = require('./shared/EntityLocation.js');
const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const SyntaxError = require('./error/SyntaxError.js');
const XmlWarning = require('./error/XmlWarning.js');
const Chunk = require('./shared/Chunk.js');
const tokens = require('./XmlToken.js');

const util = require('./XmlTokenStream-util.test.js');
const makeStrictStream = util.makeStrictStream;
const makeLaxExternalSubsetStream = util.makeLaxExternalSubsetStream;
const makeStrictExternalSubsetStream = util.makeStrictExternalSubsetStream;
const makeLaxExternalEntityStream = util.makeLaxExternalEntityStream;
const expectSyntaxError = util.expectSyntaxError;
const expectXmlWarning = util.expectXmlWarning;
const expectError = util.expectError;
const ignoreError = util.ignoreError;
const ignoreToken = util.ignoreToken;
const expectTokenType = util.expectTokenType;
const makeStringTokenArray = util.makeStringTokenArray;

describe('XmlTokenStream (dtd2)', () => {

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
               new tokens.CharRef('A', [ util.makeChunk('&#65;', 40) ]),
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
               new tokens.CharRef('A', [ util.makeChunk('&# 65;', 39) ])
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
            new Chunk('<!'),
            new Chunk('ATTLIST'),
            new Chunk(' '),
            new Chunk('elName'),
            new Chunk('  '),
            new Chunk('at1'),
            new Chunk(' '),
            new Chunk('CDATA'),
            new Chunk(' '),
            new Chunk('#REQUIRED'),
            new Chunk(' '),
            new Chunk('at2'),
            new Chunk(' '),
            new Chunk('NOTATION'),
            new Chunk(' '),
            new Chunk('('),
            new Chunk('foo'),
            new Chunk('|'),
            new Chunk(' '),
            new Chunk('bar'),
            new Chunk(')'),
            new Chunk(' '),
            new Chunk('#FIXED'),
            new Chunk(' '),
            new Chunk('"'),
            new Chunk('argh'),
            new Chunk('"'),
            new Chunk('>')
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

});
