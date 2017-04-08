/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./shared/Offset.js');
const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const SyntaxError = require('./error/SyntaxError.js');
const Chunk = require('./shared/Chunk.js');
const tokens = require('./XmlToken.js');
const XmlTokenStreamMisc = require('./XmlTokenStream-misc.js');
const XmlStringCursor = require('./XmlStringCursor.js');
const XmlWarning = require('./error/XmlWarning.js');

const makeLaxStream = require('./XmlTokenStream-util.test.js').makeLaxStream;
const makeStrictStream = require('./XmlTokenStream-util.test.js').makeStrictStream;
const makeStrictExternalEntityStream = require('./XmlTokenStream-util.test.js').makeStrictExternalEntityStream;
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
const makeChunk = util.makeChunk;

function compareXmlDeclAttribute(attr, name, value) {
   expect(attr.name).toEqual(name);
   if (value) {
      expect(attr.value ? attr.value[0].text : undefined).toEqual(value);
   } else {
      expect(attr.value ? attr.value[0] : undefined).toBeUndefined();
   }
}

describe('XmlTokenStream (Misc)', () => {

   describe('parsing comments', () => {

      it('retrieves a token of type COMMENT', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         expectTokenType(s, tokens.Comment);
      });

      it('retrieves the content of the comment', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         expect(s.read().content).toEqual(' one ');
      });

      it('retrieves undefined as the value for an empty comment', () => {
         const s = makeStrictExternalEntityStream('<!---->');

         expect(s.read().content).toEqual('');
      });

      it('throws an error if no --> found', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<!--junk comment',
            SyntaxError.ID.COMMENT_NO_CLOSE,
            'Missing closing --> in a comment.',
            new Offset(0, 16, 16),
            [ {
               offset: new Offset(0, 0, 0),
               location: new EntityLocation()
            } ]);
      });

      it('throws an error if no --> found immediately after the opening', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<!--',
            SyntaxError.ID.COMMENT_NO_CLOSE,
            'Missing closing --> in a comment.',
            new Offset(0, 4, 4),
            [ {
               offset: new Offset(0, 0, 0),
               location: new EntityLocation()
            } ]);
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeLaxExternalEntityStream('<!--junk comment');
         ignoreError(s, SyntaxError.ID.COMMENT_NO_CLOSE);

         expect(s.read().content).toEqual('junk comment');
      });

      it('throws an error if comment ends with a -', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<!--junk comment--->',
            SyntaxError.ID.COMMENT_ENDS_WITH_HYPHEN,
            'Must not have a hyphen at end of a comment.',
            new Offset(0, 16, 16),
            [ {
               offset: new Offset(0, 0, 0),
               location: new EntityLocation()
            } ]);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk('<!--'),
            new Chunk(' one '),
            new Chunk('-->')
         ]));
      });

      it('reports invalid and discouraged characters in the content', () => {
         const s = makeLaxStream('<!-- b\u0001x\u0000x\uFDD1x\uFDD2xx -->');

         expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
            'Characters that do not match the syntax for XML document found at: 6, 8.');
         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 10, 12.');
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<!-- testComment -->',
               SyntaxError.ID.COMMENT_INVALID_CONTEXT,
               'A comment must not be the first thing in the document entity.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!-- testComment -->');

            expectTokenType(s, tokens.Comment);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<!-- testComment -->');

            expectTokenType(s, tokens.Comment);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><!-- testComment -->');
            ignoreToken(s, tokens.XmlDeclaration);

            expectTokenType(s, tokens.Comment);

         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="UTF-8"?><!-- testComment -->');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.Comment);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="UTF-8"?><!-- testComment -->');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.Comment);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<!-- testComment --><?xml encoding="UTF-8"?>');
            ignoreToken(s, tokens.Comment);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes state in an external subset to be in the DTD', () => {
            const s = makeLaxExternalSubsetStream('<!-- testComment --><name>');
            ignoreToken(s, tokens.Comment);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".');
         });

      });

   });

   describe('parsing processing instruction', () => {

      it('retrieves a token of type PI', () => {
         const s = makeStrictExternalEntityStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         expectTokenType(s, tokens.ProcessingInstruction);
      });

      it('retrieves a token with the right target name', () => {
         const s = makeStrictExternalEntityStream('<?foo blah blah boo boo !@#$%^&^*()_+?>');

         const t = s.read();
         expect(t.target).toEqual('foo');
      });

      it('retrieves a token with the right target content', () => {
         const s = makeStrictExternalEntityStream('<?foo blah blah boo boo !@#$%^&^*()_+ ?>');

         const t = s.read();
         expect(t.content).toEqual('blah blah boo boo !@#$%^&^*()_+ ');
      });

      it('retrieves one with no content', () => {
         const s = makeStrictExternalEntityStream('<?foo?>');

         const t = s.read();
         expect(t.content).toEqual('');
      });

      it('allows whitespace but no content', () => {
         const s = makeStrictExternalEntityStream('<?foo    ?>');

         const t = s.read();
         expect(t.content).toEqual('');
      });

      it('throws an error if no ?> found', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<?frog glorky',
            SyntaxError.ID.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 13, 13));
      });

      it('throws an error if no ?> found after space after target', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<?frog ',
            SyntaxError.ID.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 7, 7));
      });

      it('throws an error if no ?> found after target', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<?frog',
            SyntaxError.ID.PI_NO_CLOSE,
            'Missing closing ?> in a processing instruction.',
            new Offset(0, 6, 6));
      });

      it('sets the right offset when finding no ?> found after opening', () => {
         const s = makeLaxExternalEntityStream('<?');
         ignoreError(s, SyntaxError.ID.PI_NO_TARGET);

         const t = s.read();
         expect(t.place).toEqual(new Offset(0, 2, 2));
      });

      it('returns the content up to EOF if no ?> found in lax mode', () => {
         const s = makeLaxExternalEntityStream('<?foo glorky');
         ignoreError(s, SyntaxError.ID.PI_NO_CLOSE);

         expect(s.read().content).toEqual('glorky');
      });

      it('throws an error if a space is between the <? and the target', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<? foo glorky?>',
            SyntaxError.ID.PI_SPACE_BEFORE_TARGET,
            'Must not have a space before the target name.',
            new Offset(0, 2, 2));
      });

      it('throws an error if the name does not match the name syntax', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<?frog$ glorky?>',
            SyntaxError.ID.PI_TARGET_NAME_INVALID,
            'The target name must match the syntax for names. Found: "frog$".',
            new Offset(0, 2, 2));
      });

      it('throws an error if there is no target', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<??>',
            SyntaxError.ID.PI_NO_TARGET,
            'Missing target name in a processing instruction.',
            new Offset(0, 2, 2));
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<?target blah blah?>');

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk('<?'),
            new Chunk('target'),
            new Chunk(' '),
            new Chunk('blah blah'),
            new Chunk('?>')
         ]));
      });

      it('reports invalid characters in the target', () => {
         const s = makeLaxStream('<?f\uFDD1o\u0000o blah ?>');

         expectError(s, SyntaxError.ID.PI_TARGET_NAME_INVALID,
            'The target name must match the syntax for names. Found: "f\uFDD1o\u0000o".');
      });

      it('reports invalid and discouraged characters in the content', () => {
         const s = makeLaxStream('<?foo b\u0001x\u0000x\uFDD1x\uFDD2xx ?>');

         expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
            'Characters that do not match the syntax for XML document found at: 7, 9.');
         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 11, 13.');
      });

      describe('discuraged target', () => {

         it('allows a target to start with "XML-" if this is 1.0/5', () => {
            const s = makeStrictStream('<?XML-Foo foo?>',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5));

            const t = s.read();
            expect(t.target).toEqual('XML-Foo');
         });

         it('allows a name to start with just "xml" if this is 1.0/5', () => {
            const s = makeStrictStream('<?xmlFoo blah ?>',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5));

            const t = s.read();
            expect(t.target).toEqual('xmlFoo');
         });

         it('does not allow a name to start with just "xml" if this is 1.0/4', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4),
               '<?xmlFoo foo?>',
               XmlWarning.ID.PI_TARGET_XML_RESERVED,
               'Processing instruction targets should not start with [Xx][Mm][Ll]. Found "xmlFoo".');
         });

         it('does not allow a name to start with just "xml" if this is 1.1/2', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2),
               '<?xmlFoo foo?>',
               XmlWarning.ID.PI_TARGET_XML_RESERVED,
               'Processing instruction targets should not start with [Xx][Mm][Ll]. Found "xmlFoo".');
         });

         it('does not allow a name to start with just "XMl" if this is 1.1/2', () => {
            expectXmlWarning(new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.1, 2),
               '<?XmLFoo foo?>',
               XmlWarning.ID.PI_TARGET_XML_RESERVED,
               'Processing instruction targets should not start with [Xx][Mm][Ll]. Found "XmLFoo".');
         });

      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<?foo bar?>',
               SyntaxError.ID.PI_INVALID_CONTEXT,
               'A processing instruction must not be the first thing in the document entity.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?foo bar?>');

            expectTokenType(s, tokens.ProcessingInstruction);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?foo bar?>');

            expectTokenType(s, tokens.ProcessingInstruction);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><?foo bar?>');
            ignoreToken(s, tokens.XmlDeclaration);

            expectTokenType(s, tokens.ProcessingInstruction);

         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="UTF-8"?><?foo bar?>');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.ProcessingInstruction);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="UTF-8"?><?foo bar?>');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.ProcessingInstruction);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<?foo bar?><?xml encoding="UTF-8"?>');
            ignoreToken(s, tokens.ProcessingInstruction);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes state in an external subset to be in the DTD', () => {
            const s = makeLaxExternalSubsetStream('<?foo bar?><name>');
            ignoreToken(s, tokens.ProcessingInstruction);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".');
         });

      });

   });

   describe('parsing XML Declaration', () => {

      it('can get a syntactically correct one', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.read();
         expect(t).toBeInstanceOf(tokens.XmlDeclaration);
      });

      it('retrieves the number of parameters in the declaration', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.read();
         expect(t.params.length).toEqual(3);
      });

      it('retrieves parameters in order', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii" standalone="yes"?>');

         const t = s.read();
         compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         compareXmlDeclAttribute(t.params[1], 'encoding', 'usascii');
         compareXmlDeclAttribute(t.params[2], 'standalone', 'yes');
      });

      it('does not do attribute value normalization on values', () => {
         const s = makeLaxStream('<?xml version="1.1" encoding="usas\ncii" standalone="yes"?>');
         ignoreError(s, SyntaxError.ID.XMLDECL_ENCODING_INVALID);

         const t = s.read();
         compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         compareXmlDeclAttribute(t.params[1], 'encoding', 'usas\ncii');
         compareXmlDeclAttribute(t.params[2], 'standalone', 'yes');
      });

      it('allows a space between the <? and the target if in lax mode', () => {
         const s = makeLaxStream('<? xml version="1.1"?>');

         let t = s.read();
         expect(t).toBeInstanceOf(SyntaxError);
         t = s.read();
         expect(t).toBeInstanceOf(tokens.XmlDeclaration);
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

      it('allows < in a values', () => {
         const s = makeLaxStream('<?xml version="1.1" encoding="frog<"?>', new EntityMetaData(), {
            ignoreDocumentEncoding: true
         });

         expect(s.read().id).toEqual(SyntaxError.ID.XMLDECL_ENCODING_INVALID);
      });

      it('reports invalid characters in the name of an attribute', () => {
         const s = makeLaxStream('<?xml version="1.1" enc\u0000oding="xxxx" ?>', {
            ignoreDocumentEncoding: true
         });

         expectError(s, SyntaxError.ID.ATTRIBUTE_INVALID_NAME,
            'The attribute name must match the syntax for names. Found: "enc\u0000oding".');
      });

      it('reports invalid characters in the value of an attribute', () => {
         const s = makeLaxStream('<?xml version="1.1" encoding="xx\u0000xx" ?>', {
            ignoreDocumentEncoding: true
         });

         expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
            'Characters that do not match the syntax for XML document found at: 32.');
      });

      it('reports discouraged characters in the value of an attribute', () => {
         const s = makeLaxStream('<?xml version="1.1" encoding="xx\uFDD1lx" ?>', {
            ignoreDocumentEncoding: true
         });

         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 32.');
      });

      describe('"attribute" equal signs', () => {

         it('accepts spaces around the equal signs, as per the spec', () => {
            const s = makeStrictStream('<?xml version =         "1.1"?>');

            const t = s.read();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('throws an error if there is no equal sign', () => {
            const s = makeStrictStream('<?xml version "1.1"?>');

            expect(() => {
               s.read();
            }).toThrowError('"version" must be followed by an "=".');
         });

         it('accepts the lack of an equal sign in lax mode', () => {
            const s = makeLaxStream('<?xml version "1.1"?>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);

            const t = s.read();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

      });

      describe('"attribute" quotes', () => {

         it('accepts single quotes', () => {
            const s = makeStrictStream('<?xml version =\'1.1\'?>');

            const t = s.read();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('accepts double quotes', () => {
            const s = makeStrictStream('<?xml version ="1.1"?>');

            const t = s.read();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('throws an error if there is no quote', () => {
            const s = makeStrictStream('<?xml version=1.1 ?>');

            expect(() => {
               s.read();
            }).toThrowError('The value for "version" must be quoted.');
         });

         it('throws no error in lax mode', () => {
            const s = makeLaxStream('<?xml version=1.1 ?>');

            const t = s.read();

            expect(t.id).toEqual(SyntaxError.ID.ATTRIBUTE_NO_QUOTE);
         });

         it('makes the best guess for the attr value if no quotes', () => {
            const s = makeLaxStream('<?xml version=1.1 ?>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.read();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no quotes', () => {
            const s = makeLaxStream('<?xml version=1.1?>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_QUOTE);

            const t = s.read();
            compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         });

         it('stops at processing instruction boundary even when no equal and no quotes', () => {
            const s = makeLaxStream('<?xml version 1.1?>');
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.XMLDECL_VERSION_INVALD);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_INVALID_NAME);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_EQUAL);
            ignoreError(s, SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            ignoreError(s, SyntaxError.ID.XMLDECL_ATTR_UNKNOWN);

            const t = s.read();
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
            'Missing version in an XML Declaration.');
      });

      it('throws an error if an unknown parameter is provided', () => {
         const s = makeStrictStream('<?xml bogus="frog"?>');

         expect(() => {
            s.read();
         }).toThrowError('Unknown XML Declaration parameter "bogus".');
      });

      it('throws an error if the close is missing', () => {
         expectSyntaxError('<?xml version="1.0"',
            SyntaxError.ID.XMLDECL_NO_CLOSE,
            'Missing closing "?>" in an XML or Text Declaration.');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictStream('<?xml version="1.1" encoding="usascii"  ?>');

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk('<?'),
            new Chunk('xml'),
            new Chunk(' '),
            new Chunk('version'),
            new Chunk('='),
            new Chunk('"'),
            new Chunk('1.1'),
            new Chunk('"'),
            new Chunk(' '),
            new Chunk('encoding'),
            new Chunk('='),
            new Chunk('"'),
            new Chunk('usascii'),
            new Chunk('"'),
            new Chunk('  '),
            new Chunk('?>')
         ]));
      });

      describe('version parameter', () => {

         it('accepts a value of "1.0"', () => {
            const s = makeStrictStream('<?xml version="1.0"?>');

            const t = s.read();
            compareXmlDeclAttribute(t.params[0], 'version', '1.0');
         });

         it('accepts a value of "1.1"', () => {
            const s = makeStrictStream('<?xml version="1.1"?>');

            const t = s.read();
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

            const t = s.read();
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

         it('accepts a value of "usascii"', () => {
            const s = makeStrictStream('<?xml version="1.1"   encoding="usascii"?>');

            const t = s.read();
            compareXmlDeclAttribute(t.params[1], 'encoding', 'usascii');
         });

         it('throws a syntax error if encoding is not rightly encoded', () => {
            const s = makeLaxStream('<?xml version="1.1"   encoding="bogus$"?>', {
               ignoreDocumentEncoding: true
            });

            const t = s.read();

            expect(t.id).toEqual(SyntaxError.ID.XMLDECL_ENCODING_INVALID);
            expect(t.message).toEqual('"encoding" must be alphanumeric. Found "bogus$".');
         });

         it('throws a syntax error if encoding starts with a bad character', () => {
            const s = makeLaxStream('<?xml version="1.1"   encoding="0usascii"?>', {
               ignoreDocumentEncoding: true
            });

            const t = s.read();

            expect(t.id).toEqual(SyntaxError.ID.XMLDECL_ENCODING_INVALID);
            expect(t.message).toEqual('"encoding" must be alphanumeric. Found "0usascii".');
         });

         it('throws a syntax error if encoding has no content', () => {
            const s = makeLaxStream('<?xml version="1.1"   encoding=""?>', {
               ignoreDocumentEncoding: true
            });

            const t = s.read();

            expect(t.id).toEqual(SyntaxError.ID.ATTRIBUTE_NO_VALUE);
            expect(t.message).toEqual('"encoding" must have a value.');
         });

         it('throws an error if encoding found in the wrong position', () => {
            expectSyntaxError('<?xml encoding="UTF-8" version="1.1" ?>',
               SyntaxError.ID.XMLDECL_ENCODING_INVALID_ORDER,
               '"encoding" must be after "version" and before "standalone".');
         });

         it('throws a syntax error if is not the right case', () => {
            const s = makeLaxStream('<?xml version="1.1"   EnCoDiNG="bogus"?>', {
               ignoreDocumentEncoding: true
            });

            const t = s.read();

            expect(t.id).toEqual(SyntaxError.ID.XMLDECL_ATTR_INVALID_CASE);
            expect(t.message).toEqual('"encoding" must be lower case. Found "EnCoDiNG".');
         });

      });

      describe('standalone parameter', () => {

         it('accepts a value of "no"', () => {
            const s = makeStrictStream('<?xml version="1.1" standalone="no"?>');

            const t = s.read();
            compareXmlDeclAttribute(t.params[1], 'standalone', 'no');
         });

         it('accepts a value of "yes"', () => {
            const s = makeStrictStream('<?xml version="1.1" standalone="yes"?>');

            const t = s.read();
            compareXmlDeclAttribute(t.params[1], 'standalone', 'yes');
         });

         it('throws an error if standalone is blank', () => {
            expectSyntaxError('<?xml version="1.1" standalone="" ?>',
               SyntaxError.ID.ATTRIBUTE_NO_VALUE,
               '"standalone" must have a value.');
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

         it('returns the provided standalone value, even when wrong case used', () => {
            const s = makeLaxStream('<?xml  version="1.1" standalone="NO" ?>');
            ignoreError(s, SyntaxError.ID.XMLDECL_STANDALONE_INVALID_CASE);

            compareXmlDeclAttribute(s.read().params[1], 'standalone', 'NO');
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

            expectTokenType(s, tokens.XmlDeclaration);
         });

         it('can be placed after illegal content, but errors will be thrown', () => {
            const s = makeLaxStream('<test></test><?xml version="1.1" encoding="usascii"?>');
            ignoreError(s, SyntaxError.ID.ELEMENT_INVALID_DOC_CONTEXT);
            ignoreToken(s, tokens.ElementStart);
            ignoreError(s, SyntaxError.ID.ELEMENT_INVALID_DOC_CONTEXT);
            ignoreToken(s, tokens.ElementEnd);

            expectTokenType(s, tokens.XmlDeclaration);
         });

         it('changes the state to being in a the prolog', () => {
            const s = makeStrictStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE foo>');
            ignoreToken(s, tokens.XmlDeclaration);

            expectTokenType(s, tokens.DocTypeStart);
         });

      });

   });

   describe('parsing TextDecl', () => {

      it('can get a syntactically correct one', () => {
         const s = makeStrictExternalEntityStream('<?xml version="1.1" encoding="usascii"?>');

         expectTokenType(s, tokens.TextDeclaration);
      });

      it('retrieves the number of parameters in the declaration', () => {
         const s = makeStrictExternalEntityStream('<?xml version="1.1" encoding="usascii"?>');

         const t = s.read();
         expect(t.params.length).toEqual(2);
      });

      it('retrieves parameters in order', () => {
         const s = makeStrictExternalEntityStream('<?xml version="1.1" encoding="usascii"?>');

         const t = s.read();
         compareXmlDeclAttribute(t.params[0], 'version', '1.1');
         compareXmlDeclAttribute(t.params[1], 'encoding', 'usascii');
      });

      it('understands no version in the declaration', () => {
         const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>');

         expectTokenType(s, tokens.TextDeclaration);
      });

      it('throws an error if a standalone value is present', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<?xml version="1.1" standalone="NO" ?>',
            SyntaxError.ID.TEXTDECL_XTRA_STANDALONE,
            '"standalone" must not be in a Text Declaration.');
      });

      it('throws an error if a encoding is not present', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<?xml version="1.1" ?>',
            SyntaxError.ID.TEXTDECL_NO_ENCODING,
            '"encoding" must be in a Text Declaration.',
            new Offset(0, 0, 0),
            [ {
               offset: new Offset(0, 0, 0),
               location: new EntityLocation()
            } ]);
      });

      it('retrieves the expected chunks', () => {
         const s = makeLaxExternalEntityStream('<?xml encoding="usascii" ?>');

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk('<?'),
            new Chunk('xml'),
            new Chunk(' '),
            new Chunk('encoding'),
            new Chunk('='),
            new Chunk('"'),
            new Chunk('usascii'),
            new Chunk('"'),
            new Chunk(' '),
            new Chunk('?>')
         ]));
      });

      describe('state transition', () => {

         it('can be placed first in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?><!NOTATION x PUBLIC "x">');

            expectTokenType(s, tokens.TextDeclaration);
            ignoreToken(s, tokens.NotationDeclaration);
         });

         it('can be placed first in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?><name>');

            expectTokenType(s, tokens.TextDeclaration);
            ignoreToken(s, tokens.ElementStart);
         });

         it('throws an error if the Text Declaration is not the first thing in the external entity', () => {
            const s = makeStrictExternalEntityStream('<test></test><?xml version="1.1" encoding="usascii"?>');
            ignoreToken(s, tokens.ElementStart);
            ignoreToken(s, tokens.ElementEnd);

            expect(() => {
               s.read(); // start element
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if the Text Declaration is not the first thing in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<!ENTITY foo "bar"><?xml version="1.1" encoding="usascii"?>');
            ignoreToken(s, tokens.EntityDeclaration);

            expect(() => {
               s.read(); // start element
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('changes the state to being in a DTD in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml version="1.1" encoding="usascii"?><name>');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.ELEMENT_INVALID_DTD_CONTEXT,
               'An element must not be in the internal or external subset. Found "name".');
         });

         it('changes the state to being in content in an external entity', () => {
            const s = makeLaxExternalEntityStream('<?xml version="1.1" encoding="usascii"?><!DOCTYPE foo>');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.DOCTYPE_INVALID_EXTERNAL_CONTEXT,
               'A DOCTYPE must not be declared in an external entity.');
         });

      });

   });

   describe('parsing whitespace', () => {

      it('retrieves a token of type SPACE', () => {
         const s = makeStrictStream('<?xml version="1.0"?> \n  ');
         ignoreToken(s, tokens.XmlDeclaration);

         expectTokenType(s, tokens.Space);
      });

      it('retrieves a token of type SPACE in a DTD context', () => {
         const s = makeStrictExternalSubsetStream(' \n  ');

         expectTokenType(s, tokens.Space);
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream(' \t ');

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk(' \t ')
         ]));
      });

      describe('state transitions', () => {

         it('throws an error if at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               ' \t ',
               SyntaxError.ID.SPACE_INVALID_CONTEXT,
               'The XML Declaration must appear before any content in the document entity.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of the external subset', () => {
            const s = makeStrictExternalSubsetStream(' \t ');

            expectTokenType(s, tokens.Space);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream(' \t ');

            expectTokenType(s, tokens.Space);
         });

         it('can appear after the XML Declaration in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?> \t ');
            ignoreToken(s, tokens.XmlDeclaration);

            expectTokenType(s, tokens.Space);
         });

         it('can appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?> \t ');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.Space);
         });

         it('can appear at the start of an external entity after the Text Declaration', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?> \t ');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.Space);
         });

      });

   });

   describe('parsing CharData', () => {

      it('retrieves a token of type CHARDATA', () => {
         const s = makeStrictExternalEntityStream('wow zowie ');

         expectTokenType(s, tokens.CharData);
      });

      it('retrieves a token with the specified data', () => {
         const s = makeStrictExternalEntityStream('wow zowie ');

         const t = s.read();
         expect(t.text).toEqual('wow zowie ');
      });

      it('retrieves a token with the specified data up to the markup', () => {
         const s = makeStrictExternalEntityStream('wow <zowie> ');

         const t = s.read();
         expect(t.text).toEqual('wow ');
         expectTokenType(s, tokens.ElementStart);
      });

      it('retrieves a token with the specified data up to a reference', () => {
         const s = makeStrictExternalEntityStream('wow &amp; ');

         const t = s.read();
         expect(t.text).toEqual('wow ');
      });

      it('includes the "]]>" as char data in lax mode', () => {
         const s = makeLaxExternalEntityStream('testing testing ]]>testing');

         expect(s.read().text).toEqual('testing testing ');
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_TEXT);
         expect(s.read().text).toEqual(']]>');
         expect(s.read().text).toEqual('testing');
      });

      it('includes the "]]>" as char data in lax mode, even when there are no preceeding data', () => {
         const s = makeLaxExternalEntityStream(']]>testing');
         ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_TEXT);

         expect(s.read().text).toEqual(']]>');
         expect(s.read().text).toEqual('testing');
      });

      it('can read CharData not at the beginning of the cursor', () => {
         const s = makeStrictStream('<?xml version="1.0"?><start>testing testing </start>');
         ignoreToken(s, tokens.XmlDeclaration);
         ignoreToken(s, tokens.ElementStart);

         const t = s.read();
         expect(t.text).toEqual('testing testing ');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('wow zowie ');

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk('wow zowie ')
         ]));
      });

      describe('state transitions', () => {

         it('throws an error if at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               'xxx',
               SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT,
               'CharData must not be outside the content of the document entity. Found "xxx".',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('throws an error if at the start of the external subset', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
               'xxx',
               SyntaxError.ID.CHARDATA_INVALID_SUBSET_CONTEXT,
               'CharData must not be in the external subset. Found "xxx".',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('xxx');

            expectTokenType(s, tokens.CharData);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('xxx<?xml encoding="usascii"?>');
            ignoreToken(s, tokens.CharData);

            expect(() => {
               s.read();
            }).toThrowError('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>xxx');
            ignoreToken(s, tokens.XmlDeclaration);

            expect(() => {
               s.read();
            }).toThrowError('CharData must not be outside the content of the document entity. Found "xxx".');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>xxx');
            ignoreToken(s, tokens.TextDeclaration);

            expect(() => {
               s.read();
            }).toThrowError('CharData must not be in the external subset. Found "xxx".');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>xxx');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.CharData);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>xxx</one>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.ElementStart);

            expectTokenType(s, tokens.CharData);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('xx<?xml encoding="UTF-8"?>');

            ignoreToken(s, tokens.CharData);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

         // Whitebox: don't check all the other possible cases, aside from below, since the report logic is common.
         it('throws an error if found along with "]]>" at the start of the document entity', () => {
            const s = makeLaxStream('xxx]]>');
            expectError(s, SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT,
               'CharData must not be outside the content of the document entity. Found "xxx".');
            ignoreToken(s, tokens.CharData);

            ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_TEXT);
            expectError(s, SyntaxError.ID.CHARDATA_INVALID_DOC_CONTEXT,
               'CharData must not be outside the content of the document entity. Found "]]>".');
            ignoreToken(s, tokens.CharData);
         });

         it('retrieves the expected chunks when it finds "]]>"', () => {
            const s = makeLaxExternalEntityStream('wow]]>');
            ignoreToken(s, tokens.CharData);
            ignoreError(s, SyntaxError.ID.CHARDATA_INVALID_TEXT);

            const t = s.read();
            expect(t.chunks).toEqual(makeStringTokenArray([
               new Chunk(']]>', ']]>')
            ], 3));
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

   describe('parsing CDATA', () => {

      it('retrieves a token of type CDATA', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ blah ]]>');

         expectTokenType(s, tokens.CData);
      });

      it('retrieves the content of the CDATA ', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ test data ]]>');

         expect(s.read().text).toEqual(' test data ');
      });

      it('retrieves the content of the CDATA, ignoring any embedded markup', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ test <?foo bar?> <!-- data --> <start></end> ]]>');

         expect(s.read().text).toEqual(' test <?foo bar?> <!-- data --> <start></end> ');
      });

      it('retrieves undefined as the value for an empty CDATA block', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[]]>');

         expect(s.read().text).toBeUndefined();
      });

      it('throws an error if EOF found in middle', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<![CDATA[junk comment',
            SyntaxError.ID.CDATA_NO_CLOSE,
            'Missing closing "]]>" in CDATA section.');
      });

      it('returns the content up to eof if eof in middle of comment', () => {
         const s = makeLaxExternalEntityStream('<![CDATA[ junk cdata');
         ignoreError(s, SyntaxError.ID.CDATA_NO_CLOSE);

         expect(s.read().text).toEqual(' junk cdata');
      });

      it('throws an error if space found before first square bracket', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<! [CDATA[junk comment ]]>',
            SyntaxError.ID.BRACKETITEM_XTRA_SPACE_BEFORE,
            'Must not have space before opening "[".');
      });

      it('throws an error if space found before CDATA', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<![   CDATA[junk comment ]]>',
            SyntaxError.ID.CDATA_XTRA_SPACE_BEFORE,
            'Must not have space before CDATA.');
      });

      it('throws an error if space found after CDATA', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<![CDATA    [junk comment ]]>',
            SyntaxError.ID.CDATA_XTRA_SPACE_AFTER,
            'Must not have space after CDATA.');
      });

      it('throws an error if CDATA has wrong case', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<![cDaTa[junk comment ]]>',
            SyntaxError.ID.CDATA_INVALID_CASE,
            '"CDATA" must be capitalized. Found "cDaTa".');
      });

      it('generates an error token in lax mode if space found after CDATA', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
            '<![cdata[junk comment ]]>',
            SyntaxError.ID.CDATA_INVALID_CASE,
            '"CDATA" must be capitalized. Found "cdata".');
      });

      it('reports invalid and discouraged characters in the CDATA content', () => {
         const s = makeLaxStream('<![CDATA[cd\u0001ata\uD83F\uDFFEtest">');

         expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
            'Characters that do not match the syntax for XML document found at: 11.');
         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 16.');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('<![CDATA[ one ]]>');

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk('<!'),
            new Chunk('['),
            new Chunk('CDATA'),
            new Chunk('['),
            new Chunk(' one '),
            new Chunk(']]>')
         ]));
      });

      describe('state transitions', () => {

         it('can not appear at the start of a document entity', () => {
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<![CDATA[ test ]]>',
               SyntaxError.ID.CDATA_INVALID_DOC_CONTEXT,
               'A CDATA must not be outside the content of the document entity.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can not appear at the start of the external subset', () => {
            expectSyntaxError(EntityMetaData.TYPE.EXTERNALSUBSET,
               '<![CDATA[ test ]]>',
               SyntaxError.ID.CDATA_INVALID_SUBSET_CONTEXT,
               'A CDATA must not be in the external subset.',
               new Offset(0, 0, 0),
               [ {
                  offset: new Offset(0, 0, 0),
                  location: new EntityLocation()
               } ]);
         });

         it('can appear at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('<![CDATA[ test ]]>');

            expectTokenType(s, tokens.CData);
         });

         it('can appear with element content in a document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?><name><![CDATA[ test ]]></name>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.ElementStart);

            expectTokenType(s, tokens.CData);

         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeLaxExternalSubsetStream('<?xml encoding="UTF-8"?><![CDATA[ test ]]>');
            ignoreToken(s, tokens.TextDeclaration);

            expectError(s, SyntaxError.ID.CDATA_INVALID_SUBSET_CONTEXT,
               'A CDATA must not be in the external subset.');
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="UTF-8"?><![CDATA[ test ]]>');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.CData);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<![CDATA[ test ]]><?xml encoding="UTF-8"?>');
            ignoreToken(s, tokens.CData);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

   describe('invalid characters', () => {

      it('reports no errors if a comment has no questionable characters', () => {
         const s = makeLaxExternalSubsetStream('<!-- all good -->');

         expectTokenType(s, tokens.Comment);
      });

      it('reports an error if an invalid character appears in a comment', () => {
         const s = makeLaxExternalSubsetStream('<!-- \u0001 -->');

         expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
            'Characters that do not match the syntax for XML document found at: 5.');
      });

      it('reports an error if multiple invalid character appears in a comment', () => {
         const s = makeLaxExternalSubsetStream('<!-- \u0001  \u0002 -->');

         expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
            'Characters that do not match the syntax for XML document found at: 5, 8.');
      });

      describe('in range', () => {
         const versions = [ {
            version: 1.0,
            rev: 1
         }, {
            version: 1.0,
            rev: 2
         }, {
            version: 1.0,
            rev: 3
         }, {
            version: 1.0,
            rev: 4
         }, {
            version: 1.0,
            rev: 5
         }, {
            version: 1.1,
            rev: 1
         }, {
            version: 1.1,
            rev: 2
         } ];
         const v10Indices = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
            28, 29, 30, 31 ];
         const v11Indices = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
            28, 29, 30, 31, 0x7f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e,
            0x8f, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f ];
         versions[0].indices = v10Indices;
         versions[1].indices = v10Indices;
         versions[2].indices = v10Indices;
         versions[3].indices = v10Indices;
         versions[4].indices = v10Indices;
         versions[5].indices = v11Indices;
         versions[6].indices = v11Indices;

         const chars = [];

         for (let index = 0; index < 256; index++) {
            chars.push(String.fromCharCode(index));
         }

         const input = `<!-- ${chars.join('')} -->`;

         function buildTestForVersion(entry) {
            it('0-255 in version ' + entry.version + '/' + entry.rev, () => {
               const s = makeLaxStream(input,
                  new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, entry.version, entry.rev));
               const newIndices = entry.indices.map((num) => num + 5); // adjust indices to account for <!--

               expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
                  `Characters that do not match the syntax for XML document found at: ${newIndices.join(', ')}.`);
            });

            it('at 0xFFFE and FF in version ' + entry.version + '/' + entry.rev, () => {
               const s = makeLaxStream('<!-- \uFFFE \uFFFD \uFFFF \uFFFC -->',
                  new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, entry.version, entry.rev));

               expectError(s, SyntaxError.ID.CHARDATA_INVALID_CHAR,
                  'Characters that do not match the syntax for XML document found at: 5, 9.');
            });

         }

         for (let index = 0; index < versions.length; index++) {
            buildTestForVersion(versions[index]);
         }

      });

   });

   describe('discouraged characters', () => {

      it('reports a warning if a discouraged character appears in a comment', () => {
         const s = makeLaxExternalSubsetStream('<!-- \uFDD0 -->');

         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 5.');
      });

      it('reports a warning if multiple discouraged characters appear in a comment', () => {
         const s = makeLaxExternalSubsetStream('<!-- \uFDD0  \uFDD0 -->');

         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 5, 8.');
      });

      describe('in range', () => {
         const versions = [ {
            version: 1.0,
            rev: 1
         }, {
            version: 1.0,
            rev: 2
         }, {
            version: 1.0,
            rev: 3
         }, {
            version: 1.0,
            rev: 4
         }, {
            version: 1.0,
            rev: 5
         }, {
            version: 1.1,
            rev: 1
         }, {
            version: 1.1,
            rev: 2
         } ];
         const v10r12LowIndices = [];
         const v10r345LowIndices = [ 0x7f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d,
            0x8e, 0x8f, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e,
            0x9f ];
         const v11r12LowIndices = []; // There are discouraged chars, but all are also restricted.
         versions[0].lowIndices = v10r12LowIndices;
         versions[1].lowIndices = v10r12LowIndices;
         versions[2].lowIndices = v10r345LowIndices;
         versions[3].lowIndices = v10r345LowIndices;
         versions[4].lowIndices = v10r345LowIndices;
         versions[5].lowIndices = v11r12LowIndices;
         versions[6].lowIndices = v11r12LowIndices;

         const v10r12MidIndices = [];
         const d0ToDf = [ 0xD0, 0xD1, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDa, 0xDb, 0xDc, 0xDd, 0xDe,
            0xDf ];
         const d0ToEf = d0ToDf.concat([ 0xE0, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEa, 0xEb, 0xEc,
            0xEd, 0xEe, 0xEf ]);
         versions[0].midIndices = v10r12MidIndices;
         versions[1].midIndices = v10r12MidIndices;
         versions[2].midIndices = d0ToDf;
         versions[3].midIndices = d0ToDf;
         versions[4].midIndices = d0ToEf; // note the change in 1.0/5!
         versions[5].midIndices = d0ToDf;
         versions[6].midIndices = d0ToDf;

         const v10r12HighIndices = [];
         const otherHighIndices = [];
         let offset = 0;
         for (let index = 0x10000; index < 0x110000; index += 0x10000) {
            otherHighIndices.push(offset + 3);  // first char of each 2 surrogate pair
            otherHighIndices.push(offset + 5);
            offset += 8;
         }
         versions[0].highIndices = v10r12HighIndices;
         versions[1].highIndices = v10r12HighIndices;
         versions[2].highIndices = otherHighIndices;
         versions[3].highIndices = otherHighIndices;
         versions[4].highIndices = otherHighIndices;
         versions[5].highIndices = otherHighIndices;
         versions[6].highIndices = otherHighIndices;

         // from http://www.2ality.com/2013/09/javascript-unicode.html
         function toSurrogates(codePoint) {
            const TEN_BITS = parseInt('1111111111', 2);
            function u(codeUnit) {
               return String.fromCharCode(codeUnit);
            }

            if (codePoint <= 0xFFFF) {
               return u(codePoint);
            }
            codePoint -= 0x10000;

            // Shift right to get to most significant 10 bits
            const leadSurrogate = 0xD800 + (codePoint >> 10);

            // Mask to get least significant 10 bits
            const tailSurrogate = 0xDC00 + (codePoint & TEN_BITS);

            return u(leadSurrogate) + u(tailSurrogate);
         }

         const chars = [];
         const midChars = [];
         const highChars = [];

         for (let index = 0; index < 255; index++) {
            chars.push(String.fromCharCode(index));
         }

         for (let index = 0xFD00; index <= 0xFE00; index++) {
            midChars.push(String.fromCharCode(index));
         }

         // now characters around 0xFFFE/0xFFFF on each of several planes
         for (let index = 0x10000; index < 0x110000; index += 0x10000) {
            highChars.push(toSurrogates(index + 0xFFFD));
            highChars.push(toSurrogates(index + 0xFFFE));
            highChars.push(toSurrogates(index + 0xFFFF));
            highChars.push(toSurrogates(index + 0x10000));
         }

         const input = `<!-- ${chars.join('')} -->`;
         const midInput = `<!-- ${midChars.join('')} -->`;
         const highInput = `<!-- ${highChars.join('')} -->`;

         function buildTestForVersion(entry) {
            it('0-255 are reported in version ' + entry.version + '/' + entry.rev, () => {
               const s = makeLaxStream(input,
                  new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, entry.version, entry.rev));
               const newIndices = entry.lowIndices.map((num) => num + 5); // adjust indices to account for <!--
               const t = s.read();
               expect(t.id).toEqual(SyntaxError.ID.CHARDATA_INVALID_CHAR);

               if (entry.lowIndices.length === 0) {
                  expectTokenType(s, tokens.Comment);
               } else {
                  expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
                     `Characters that are disouraged in XML documents found at: ${newIndices.join(', ')}.`);
               }
            });

            it('high 16bits are reported in version ' + entry.version + '/' + entry.rev, () => {
               const s = makeLaxStream(midInput,
                  new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, entry.version, entry.rev));
               const newIndices = entry.midIndices.map((num) => num + 5); // adjust indices to account for <!--

               if (entry.midIndices.length === 0) {
                  expectTokenType(s, tokens.Comment);
               } else {
                  expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
                     `Characters that are disouraged in XML documents found at: ${newIndices.join(', ')}.`);
               }
            });

            it('astral characters are reported in version ' + entry.version + '/' + entry.rev, () => {
               const s = makeLaxStream(highInput,
                  new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, entry.version, entry.rev));
               const newIndices = entry.highIndices.map((num) => num + 5); // adjust indices to account for <!--

               if (entry.midIndices.length === 0) {
                  expectTokenType(s, tokens.Comment);
               } else {
                  expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
                     `Characters that are disouraged in XML documents found at: ${newIndices.join(', ')}.`);
               }
            });
         }

         for (let index = 0; index < versions.length; index++) {
            buildTestForVersion((versions[index]));
         }

      });

      it('reports no warnings if an ordinarily discouraged character appears in a 1.0/1 comment', () => {
         const s = makeLaxStream('<!-- \uFDD0 -->',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 1));

         expectTokenType(s, tokens.Comment);
      });

      it('reports no warnings if an ordinarily discouraged character appears in a 1.0/2 comment', () => {
         const s = makeLaxStream('<!-- \uFDD0 -->',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 2));

         expectTokenType(s, tokens.Comment);
      });

      it('reports a warning if uFDEE character appears in a comment in 1.0/5', () => {
         const s = makeLaxStream('<!-- \uFDEE -->',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 5));

         expectError(s, XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            'Characters that are disouraged in XML documents found at: 5.');
      });

      it('reports no warning if uFDEE character appears in a comment in 1.0/4', () => {
         const s = makeLaxStream('<!-- \uFDEE -->',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 4));

         expectTokenType(s, tokens.Comment);
      });

      it('reports no warning if uFDEE character appears in a comment in 1.0/3', () => {
         const s = makeLaxStream('<!-- \uFDEE -->',
            new EntityMetaData(EntityMetaData.TYPE.EXTERNALSUBSET, 1.0, 3));

         expectTokenType(s, tokens.Comment);
      });

   });

   describe('parsing character reference', () => {

      it('retrieves a token of type CharRef', () => {
         const s = makeStrictExternalEntityStream('&#65;');

         expectTokenType(s, tokens.CharRef);
      });

      it('produces a token with the specified character using a decimal reference', () => {
         const s = makeStrictExternalEntityStream('&#65;');

         const t = s.read();
         expect(t.text).toEqual('A');
      });

      it('produces a token with the specified character using a hex reference', () => {
         const s = makeStrictExternalEntityStream('&#x4E;');

         const t = s.read();
         expect(t.text).toEqual('N');
      });

      it('throws no errors when an invalid character is referenced', () => {
         const s = makeStrictExternalEntityStream('&#x08;');

         const t = s.read();
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

         expect(s.read().text).toEqual('N');
      });

      it('can read when not at the beginning of the cursor', () => {
         const s = makeStrictExternalEntityStream('<start>&#65;</start>');
         ignoreToken(s, tokens.ElementStart);

         const t = s.read();
         expect(t.text).toEqual('A');
      });

      it('retrieves the expected chunks', () => {
         const s = makeStrictExternalEntityStream('&#x42;');

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk('&'),
            new Chunk('#'),
            new Chunk('x'),
            new Chunk('42'),
            new Chunk(';')
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
            let strictError;
            s.on('error', (err) => {
               strictError = err;
            });

            s.read();

            expect(strictError.message).toEqual('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>&#50;');
            ignoreToken(s, tokens.XmlDeclaration);

            expect(() => {
               s.read();
            }).toThrowError('A character reference must not be outside the content of the document entity.');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>&#50;');
            ignoreToken(s, tokens.TextDeclaration);

            expect(() => {
               s.read();
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

   describe('parseQuotedValue()', () => {
      let standardCursor;

      beforeEach(() => {
         standardCursor = new XmlStringCursor('"zero &#49; &#x32; &three; %four;" extra');
      });

      it('retrieves a single chunk if all options are false', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(standardCursor);

         expect(result).toEqual({
            startQuoteChunk: makeChunk('"', 0, 1),
            items: [ makeChunk('zero &#49; &#x32; &three; %four;', 1, 33) ],
            stopQuoteChunk: makeChunk('"', 33, 34)
         });
      });

      it('recognizes a character reference if instructed to do so', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(standardCursor, { charRef: true });

         expect(result.items.length).toEqual(5);
         expect(result.items[0].text).toEqual('zero ');
         expect(result.items[1]).toEqual({
            type: XmlTokenStreamMisc.TYPE.CHAR_REF,
            parsed: {
               startChunk: makeChunk('&', 6, 7),
               postStartSpaceChunk: undefined,
               hashChunk: makeChunk('#', 7, 8),
               postHashSpaceChunk: undefined,
               hexMarkerChunk: undefined,
               postHexSpaceChunk: undefined,
               digitsChunk: makeChunk('49', 8, 10),
               postDigitsSpaceChunk: undefined,
               semicolonChunk: makeChunk(';', 10, 11),
               character: '1'
            }
         });
         expect(result.items[2].text).toEqual(' ');
         expect(result.items[3]).toEqual({
            type: XmlTokenStreamMisc.TYPE.CHAR_REF,
            parsed: {
               startChunk: makeChunk('&', 12, 13),
               postStartSpaceChunk: undefined,
               hashChunk: makeChunk('#', 13, 14),
               postHashSpaceChunk: undefined,
               hexMarkerChunk: makeChunk('x', 14, 15),
               postHexSpaceChunk: undefined,
               digitsChunk: makeChunk('32', 15, 17),
               postDigitsSpaceChunk: undefined,
               semicolonChunk: makeChunk(';', 17, 18),
               character: '2'
            }
         });
         expect(result.items[4].text).toEqual(' &three; %four;');
      });

      it('recognizes a parameter entity reference if instructed to do so', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(standardCursor, { peRef: true });

         expect(result.items.length).toEqual(2);
         expect(result.items[0].text).toEqual('zero &#49; &#x32; &three; ');
         expect(result.items[1]).toEqual({
            type: XmlTokenStreamMisc.TYPE.PARAMETER_REF,
            parsed: {
               startChunk: makeChunk('%', 27, 28),
               postStartSpaceChunk: undefined,
               nameChunk: makeChunk('four', 28, 32),
               postNameSpaceChunk: undefined,
               semicolonChunk: makeChunk(';', 32, 33)
            }
         });
      });

      it('recognizes a general entity reference if instructed to do so', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(standardCursor, { geRef: true });

         expect(result.items.length).toEqual(3);
         expect(result.items[0].text).toEqual('zero &#49; &#x32; ');
         expect(result.items[1]).toEqual({
            type: XmlTokenStreamMisc.TYPE.GENERAL_REF,
            parsed: {
               startChunk: makeChunk('&', 19, 20),
               postStartSpaceChunk: undefined,
               nameChunk: makeChunk('three', 20, 25),
               postNameSpaceChunk: undefined,
               semicolonChunk: makeChunk(';', 25, 26)
            }
         });
         expect(result.items[2].text).toEqual(' %four;');
      });

      it('recognizes all types when asked to', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(standardCursor, {
            geRef: true,
            peRef: true,
            charRef: true
         });

         expect(result.items.length).toEqual(8);
         expect(result.items[0].text).toEqual('zero ');
         expect(result.items[1]).toEqual({
            type: XmlTokenStreamMisc.TYPE.CHAR_REF,
            parsed: {
               startChunk: makeChunk('&', 6, 7),
               postStartSpaceChunk: undefined,
               hashChunk: makeChunk('#', 7, 8),
               postHashSpaceChunk: undefined,
               hexMarkerChunk: undefined,
               postHexSpaceChunk: undefined,
               digitsChunk: makeChunk('49', 8, 10),
               postDigitsSpaceChunk: undefined,
               semicolonChunk: makeChunk(';', 10, 11),
               character: '1'
            }
         });
         expect(result.items[2].text).toEqual(' ');
         expect(result.items[3]).toEqual({
            type: XmlTokenStreamMisc.TYPE.CHAR_REF,
            parsed: {
               startChunk: makeChunk('&', 12, 13),
               postStartSpaceChunk: undefined,
               hashChunk: makeChunk('#', 13, 14),
               postHashSpaceChunk: undefined,
               hexMarkerChunk: makeChunk('x', 14, 15),
               postHexSpaceChunk: undefined,
               digitsChunk: makeChunk('32', 15, 17),
               postDigitsSpaceChunk: undefined,
               semicolonChunk: makeChunk(';', 17, 18),
               character: '2'
            }
         });
         expect(result.items[4].text).toEqual(' ');
         expect(result.items[5]).toEqual({
            type: XmlTokenStreamMisc.TYPE.GENERAL_REF,
            parsed: {
               startChunk: makeChunk('&', 19, 20),
               postStartSpaceChunk: undefined,
               nameChunk: makeChunk('three', 20, 25),
               postNameSpaceChunk: undefined,
               semicolonChunk: makeChunk(';', 25, 26)
            }
         });
         expect(result.items[6].text).toEqual(' ');
         expect(result.items[7]).toEqual({
            type: XmlTokenStreamMisc.TYPE.PARAMETER_REF,
            parsed: {
               startChunk: makeChunk('%', 27, 28),
               postStartSpaceChunk: undefined,
               nameChunk: makeChunk('four', 28, 32),
               postNameSpaceChunk: undefined,
               semicolonChunk: makeChunk(';', 32, 33)
            }
         });
      });

      it('stops when a specified terminator is found', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(standardCursor, {
            terminators: [ 'o' ]
         });

         expect(result).toEqual({
            startQuoteChunk: makeChunk('"', 0, 1),
            items: [ makeChunk('zer', 1, 4) ],
            stopQuoteChunk: undefined
         });
      });

      it('copes with an entity reference starting at EOF', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(new XmlStringCursor('"zero &'), {
            geRef: true
         });

         expect(result.items.length).toEqual(2);
         expect(result.items[0].text).toEqual('zero ');
         expect(result.items[1]).toEqual({
            type: XmlTokenStreamMisc.TYPE.GENERAL_REF,
            parsed: {
               startChunk: makeChunk('&', 6, 7),
               postStartSpaceChunk: undefined,
               nameChunk: undefined,
               postNameSpaceChunk: undefined,
               semicolonChunk: undefined
            }
         });
      });

      it('copes with a missing quote when no items specified', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(new XmlStringCursor('"zero one'));

         expect(result.items).toEqual([ makeChunk('zero one', 1, 9) ]);
      });

      it('copes with a malformed ref at the end', () => {
         const result = XmlTokenStreamMisc.parseQuotedValue(new XmlStringCursor('"&"'), {
            charRef: true
         });

         expect(result.items).toEqual([ makeChunk('&', 1, 2) ]);
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

         const t = s.read();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new Chunk('&'),
            new Chunk('lt'),
            new Chunk(';')
         ]));
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

            expectTokenType(s, tokens.EntityReference);
         });

         it('transitions to after Text Declaration if appears at the start of an external entity', () => {
            const s = makeStrictExternalEntityStream('&amp;<?xml encoding="usascii"?>');
            let strictError;
            s.on('error', (err) => {
               strictError = err;
            });
            expectTokenType(s, tokens.EntityReference);
            expect(s.read()).toBeNull();  // goose the stream into reading the next token which will find the error

            expect(strictError.message).toEqual('An XML or Text Declaration must be the first thing in the entity.');
         });

         it('throws an error if after the XML Declaration in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0"?>&amp;');
            ignoreToken(s, tokens.XmlDeclaration);

            expect(() => {
               s.read();
            }).toThrowError('An entity reference must not be outside the content of the document entity.');
         });

         it('can not appear after the Text Declaration in the external subset', () => {
            const s = makeStrictExternalSubsetStream('<?xml encoding="usascii"?>&amp;');
            ignoreToken(s, tokens.TextDeclaration);

            expect(() => {
               s.read();
            }).toThrowError('An entity reference must not be in the external subset.');
         });

         it('can appear after the Text Declaration of an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="usascii"?>&amp;');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.EntityReference);
         });

         it('can appear within elements in the document entity', () => {
            const s = makeStrictStream('<?xml version="1.0" encoding="usascii"?><one>&amp;</one>');
            ignoreToken(s, tokens.XmlDeclaration);
            ignoreToken(s, tokens.ElementStart);

            expectTokenType(s, tokens.EntityReference);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('&amp;<?xml encoding="UTF-8"?>');
            ignoreToken(s, tokens.EntityReference);

            expectError(s, SyntaxError.ID.XMLDECL_INVALID_CONTEXT,
               'An XML or Text Declaration must be the first thing in the entity.');
         });

      });

   });

});
