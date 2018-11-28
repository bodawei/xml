/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import stream from 'readable-stream';

import { EntityMetaData } from 'basic';
import { PTokenStream } from '../../pTokenStream';
import * as tokens from '../../token';
import { XmlDeclarationXToken } from '../../token';

import PToXTokenStream from '../PToXTokenStream';
import CommentFixingStream from '../CommentFixingStream';

describe('CommentFixingStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let xTokenStream: PToXTokenStream;

   function gatherTokens(stream: stream.Transform, done: (result: Array<any>) => void) {
      const results: Array<any> = [];

      stream.on('data', (data: any) => {
         results.push(data);
      });
      stream.on('end', () => {
         done(results);
      });
   }

   function testTransformation(before: string, after: string, done: () => void) {
      const cf = new CommentFixingStream();
      pTokenStream = new PTokenStream(new EntityMetaData());
      xTokenStream = new PToXTokenStream();

      pTokenStream.addText('<?xml encoding="utf-8"?><!--' + before + '-->');
      pTokenStream.endText();
      (pTokenStream as any).pipe(xTokenStream).pipe(cf); // typeHack

      gatherTokens(cf, (results) => {
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
         pTokenStream = new PTokenStream(new EntityMetaData());
         xTokenStream = new PToXTokenStream();

         pTokenStream.addText('<?xml encoding="utf-8"?><!--test--><one>foo</one>');
         pTokenStream.endText();

         const cf = new CommentFixingStream();
         (pTokenStream as any).pipe(xTokenStream).pipe(cf); // typeHack

         gatherTokens(cf, (results) => {
            expect(results[1] instanceof XmlDeclarationXToken).toEqual(true);
            expect(results[2] instanceof tokens.comment.CommentXToken).toEqual(true);
            expect(results[3] instanceof tokens.elementStart.XToken).toEqual(true);
            expect(results[4] instanceof tokens.charData.XToken).toEqual(true);
            expect(results[5] instanceof tokens.elementEnd.XToken).toEqual(true);
            done();
         });
      });

   });

});
