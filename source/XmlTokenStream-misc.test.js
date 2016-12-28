/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./shared/Offset.js');
const EntityLocation = require('./shared/EntityLocation.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./shared/TextChunk.js');
const tokens = require('./XmlToken.js');
const XmlWarning = require('./error/XmlWarning.js');

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

describe('XmlTokenStream (Misc)', () => {

   describe('parsing comments', () => {

      it('retrieves a token of type COMMENT', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         expectTokenType(s, tokens.Comment);
      });

      it('retrieves the content of the comment', () => {
         const s = makeStrictExternalEntityStream('<!-- one -->');

         expect(s.getNext().content).toEqual(' one ');
      });

      it('retrieves undefined as the value for an empty comment', () => {
         const s = makeStrictExternalEntityStream('<!---->');

         expect(s.getNext().content).toEqual('');
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

         expect(s.getNext().content).toEqual('junk comment');
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

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<!--'),
            new TextChunk.WithSpaceChunk(' one ', ' one '),
            new TextChunk.PlainChunk('-->')
         ]));
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
         expect(t.content).toEqual('');
      });

      it('allows whitespace but no content', () => {
         const s = makeStrictExternalEntityStream('<?foo    ?>');

         const t = s.getNext();
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

         const t = s.getNext();
         expect(t.place).toEqual(new Offset(0, 2, 2));
      });

      it('returns the content up to EOF if no ?> found in lax mode', () => {
         const s = makeLaxExternalEntityStream('<?foo glorky');
         ignoreError(s, SyntaxError.ID.PI_NO_CLOSE);

         expect(s.getNext().content).toEqual('glorky');
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

         const t = s.getNext();
         expect(t.chunks).toEqual(makeStringTokenArray([
            new TextChunk.PlainChunk('<?'),
            new TextChunk.WordChunk('target', true, true),
            new TextChunk.WithSpaceChunk(' ', ' '),
            new TextChunk.WithSpaceChunk('blah blah', 'blah blah'),
            new TextChunk.PlainChunk('?>')
         ]));
      });

      describe('discuraged target', () => {

         it('allows a target to start with "XML-" if this is 1.0/5', () => {
            const s = makeStrictStream('<?XML-Foo foo?>',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5));

            const t = s.getNext();
            expect(t.target).toEqual('XML-Foo');
         });

         it('allows a name to start with just "xml" if this is 1.0/5', () => {
            const s = makeStrictStream('<?xmlFoo blah ?>',
               new EntityMetaData(EntityMetaData.TYPE.EXTERNAL, 1.0, 5));

            const t = s.getNext();
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

});
