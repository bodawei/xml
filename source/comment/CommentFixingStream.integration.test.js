/* Copyright ® 2016-2017 by David John Burrowes. All rights reserved. */
/* eslint-env jasmine */

import { ParsedStream } from '../parse';
import { TokenStream } from '../tokenize';
import * as tokens from '../xToken';

import CommentFixingStream from './CommentFixingStream.js';

describe('CommentFixingStream (integration)', () => {
   let parsedStream;
   let tokenStream;

   function testTransformation(before, after, done) {
      const cf = new CommentFixingStream();
      parsedStream = new ParsedStream();
      tokenStream = new TokenStream();
      const results = [];

      parsedStream.addText('<?xml encoding="utf-8"?><!--' + before + '-->');
      parsedStream.endText();
      parsedStream.pipe(tokenStream).pipe(cf);

      cf.on('data', (data) => {
         results.push(data);
      });
      cf.on('end', () => {
         expect(results[2].text).toEqual(after);
         done();
      });
   }

   describe('transformation', () => {

      it('passes through an a comment with no character references', (done) => {
         testTransformation(' this is a test ', ' this is a test ', done);
      });

      it('passes through a decimal character reference', (done) => {
         testTransformation(' this is &#97; test ', ' this is a test ', done);
      });

      it('passes through a hex character reference', (done) => {
         testTransformation(' this is &#x61; test ', ' this is a test ', done);
      });

      it('passes through multiple character references', (done) => {
         testTransformation(' this &#105;s &#x61; test ', ' this is a test ', done);
      });

      it('handles a character reference at the start', (done) => {
         testTransformation('&#32;this &#105;s &#x61; test ', ' this is a test ', done);
      });

      it('handles a character reference at the end', (done) => {
         testTransformation('&#32;this &#105;s &#x61; test&#32;', ' this is a test ', done);
      });

   });

   describe('passthrough', () => {

      it('passes all tokens through', (done) => {
         parsedStream = new ParsedStream();
         tokenStream = new TokenStream();

         parsedStream.addText('<?xml encoding="utf-8"?><!--test--><one>foo</one>');
         parsedStream.endText();

         const cf = new CommentFixingStream();
         const results = [];
         parsedStream.pipe(tokenStream).pipe(cf);

         cf.on('data', (data) => {
            results.push(data);
         });
         cf.on('end', () => {
            expect(results[1] instanceof tokens.xmlDeclaration.Token).toEqual(true);
            expect(results[2] instanceof tokens.comment.Token).toEqual(true);
            expect(results[3] instanceof tokens.elementStart.Token).toEqual(true);
            expect(results[4] instanceof tokens.charData.Token).toEqual(true);
            expect(results[5] instanceof tokens.elementEnd.Token).toEqual(true);
            done();
         });
      });

   });

});
