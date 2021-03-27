/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';

import { CONFORMANCE_VERSION, ENTITY_ID } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import {
   COMMENT_XTOKEN,
   CHARDATA_XTOKEN,
   ELEMENT_END_XTOKEN
} from 'token';
import {    ELEMENT_START_XTOKEN, XMLDECL_XTOKEN } from 'xToken';

import { PTokenStream } from '../../pTokenStream';
import PToXTokenStream from '../PToXTokenStream';
import CommentFixingStream from '../CommentFixingStream';
import { XToken } from 'source/xToken/types';

describe('CommentFixingStream (integration)', () => {
   let pTokenStream: PTokenStream;
   let xTokenStream: PToXTokenStream;

   function testTransformation(before: string, after: string, done: () => void) {
      const cf = new CommentFixingStream();
      pTokenStream = new PTokenStream(new STokenSource(defaultExtractors));
      xTokenStream = new PToXTokenStream();

      pTokenStream.addText('<?xml encoding="utf-8"?><!--' + before + '-->');
      pTokenStream.endText();
      (pTokenStream as any).pipe(xTokenStream).pipe(cf); // typeHack

      gatherStreamResults<any>(cf, (results) => {
         const result = results.find(r => r.type === COMMENT_XTOKEN);

         expect(result.text).toEqual(after);
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
         pTokenStream = new PTokenStream(new STokenSource(defaultExtractors));
         xTokenStream = new PToXTokenStream();

         pTokenStream.addText('<?xml encoding="utf-8"?><!--test--><one>foo</one>');
         pTokenStream.endText();

         const cf = new CommentFixingStream();
         (pTokenStream as any).pipe(xTokenStream).pipe(cf); // typeHack

         gatherStreamResults<any>(cf, (results) => {
            const types = results.map(r => r.type);

            expect(types).toEqual([CONFORMANCE_VERSION, ENTITY_ID, XMLDECL_XTOKEN, COMMENT_XTOKEN, ELEMENT_START_XTOKEN, CHARDATA_XTOKEN, ELEMENT_END_XTOKEN]);
            done();
         });
      });

   });

});
