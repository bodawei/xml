/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Offset = require('./shared/Offset.js');
const EntityMetaData = require('./shared/EntityMetaData.js');
const SyntaxError = require('./error/SyntaxError.js');
const TextChunk = require('./shared/TextChunk.js');
const tokens = require('./XmlToken.js');

const makeStrictStream = require('./XmlTokenStream-util.test.js').makeStrictStream;
const makeStrictExternalEntityStream = require('./XmlTokenStream-util.test.js').makeStrictExternalEntityStream;
const makeLaxExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeLaxExternalSubsetStream;
const makeStrictExternalSubsetStream = require('./XmlTokenStream-util.test.js').makeStrictExternalSubsetStream;
const makeLaxExternalEntityStream = require('./XmlTokenStream-util.test.js').makeLaxExternalEntityStream;
const expectSyntaxError = require('./XmlTokenStream-util.test.js').expectSyntaxError;
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
            [ new Offset(0, 0, 0) ]);
      });

      it('throws an error if no --> found immediately after the opening', () => {
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
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
         expectSyntaxError(EntityMetaData.TYPE.EXTERNAL,
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
            expectSyntaxError(EntityMetaData.TYPE.DOCUMENT,
               '<!-- testComment -->',
               SyntaxError.ID.COMMENT_INVALID_CONTEXT,
               'A comment must not be the first thing in the document entity.',
               new Offset(0, 0, 0),
               [ new Offset(0, 0, 0) ]);
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
            const s = makeStrictExternalSubsetStream('<?xml encoding="foo"?><!-- testComment -->');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.Comment);
         });

         it('can not appear after the Text Declaration in an external entity', () => {
            const s = makeStrictExternalEntityStream('<?xml encoding="foo"?><!-- testComment -->');
            ignoreToken(s, tokens.TextDeclaration);

            expectTokenType(s, tokens.Comment);
         });

         it('changes state in an external entity to be in content', () => {
            const s = makeLaxExternalEntityStream('<!-- testComment --><?xml encoding="foo"?>');
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

});
