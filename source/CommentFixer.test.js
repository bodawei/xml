/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const CommentFixer = require('./CommentFixer.js');
const tokens = require('./XmlToken.js');

const testUtils = require('./XmlTokenStream-util.test.js');
const makeStrictExternalEntityStream = testUtils.makeStrictExternalEntityStream;

describe('CommentFixer', () => {

   function testTransformation(before, after, done) {
      const s = makeStrictExternalEntityStream('<?xml encoding="utf-8"?><!--' + before + '-->');
      const cf = new CommentFixer();
      const results = [];
      s.pipe(cf);

      cf.on('data', (data) => {
         results.push(data);
      });
      s.on('end', () => {
         expect(results[1].content).toEqual(after);
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
         const s = makeStrictExternalEntityStream('<?xml encoding="utf-8"?> <!--test--><one>foo</one>');
         const cf = new CommentFixer();
         const results = [];
         s.pipe(cf);

         cf.on('data', (data) => {
            results.push(data);
         });
         s.on('end', () => {
            expect(results[0] instanceof tokens.TextDeclaration).toEqual(true);
            expect(results[1] instanceof tokens.Space).toEqual(true);
            expect(results[2] instanceof tokens.Comment).toEqual(true);
            expect(results[3] instanceof tokens.ElementStart).toEqual(true);
            expect(results[4] instanceof tokens.CharData).toEqual(true);
            expect(results[5] instanceof tokens.ElementEnd).toEqual(true);
            done();
         });
      });

   });

});
