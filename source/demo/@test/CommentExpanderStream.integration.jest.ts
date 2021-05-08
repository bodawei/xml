/* Copyright ® 2016-2021 by 柏大衛. All rights reserved. */

import { CONFORMANCE_VERSION, ENTITY_ID } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { XMLDECL_PTOKEN, ParseToken } from 'pToken';
import { STokenSource } from 'sToken';
import {
   COMMENT_PTOKEN,
   ELEMENT_END_PTOKEN,
   CHARDATA_PTOKEN,
   ELEMENT_START_PTOKEN,
   CommentPToken,
} from 'token';

import { PTokenStream } from '../../pTokenStream';
import { CommentExpanderStream } from '../CommentExpanderStream';

describe('CommentExpanderStream (integration)', () => {
   let pTokenStream: PTokenStream;

   function testTransformation(before: string, after: string, done: () => void) {
      const ces = new CommentExpanderStream();
      pTokenStream = new PTokenStream(new STokenSource());

      pTokenStream.addText('<?xml encoding="utf-8"?><!--' + before + '-->');
      pTokenStream.endText();
      pTokenStream.pipe(ces);

      gatherStreamResults<ParseToken>(ces, (results) => {
         const result = results.find((r) => r.type === COMMENT_PTOKEN);

         expect((result as CommentPToken).text[0].str).toEqual(after);
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
         pTokenStream = new PTokenStream(new STokenSource());

         pTokenStream.addText('<?xml encoding="utf-8"?><!--test--><one>foo</one>');
         pTokenStream.endText();

         const cf = new CommentExpanderStream();
         pTokenStream.pipe(cf);

         gatherStreamResults<ParseToken>(cf, (results) => {
            const types = results.map((r) => r.type);

            expect(types).toEqual([
               CONFORMANCE_VERSION,
               ENTITY_ID,
               XMLDECL_PTOKEN,
               COMMENT_PTOKEN,
               ELEMENT_START_PTOKEN,
               CHARDATA_PTOKEN,
               ELEMENT_END_PTOKEN,
            ]);
            done();
         });
      });
   });
});
