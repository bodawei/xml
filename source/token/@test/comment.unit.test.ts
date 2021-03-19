/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';

import {
   CommentPToken,
   CommentXToken,
   parseComment,
} from '../comment';

describe('comment (unit)', () => {
   let commentPToken: CommentPToken;
   let expectedSToken: STokenMaker;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      commentPToken = new CommentPToken({
         open: expectedSToken('<!--'),
         text: [ expectedSToken('commentText') ],
         close: expectedSToken('-->'),
      });
   });

   describe('PToken', () => {

      describe('sTokensFromPToken()', () => {

         it('returns all the STokens', () => {
            const pToken = new CommentPToken(commentPToken);
            const result = pToken.toSTokenArray();
            const expected = [
               pToken.open,
               pToken.text[0],
               pToken.close!,
            ];

            expect(result).toEqual(expected);
         });

      });

   });

   describe('parseComment()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a simple parse', () => {
         const mockSource = new MockSTokenSource([
            [ 'commentText', 'all', [ '--' ] ],
            [ '-->', 'match', '-->' ],
         ], 4, 0, 4);

         parseComment(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

      it('parses a comment with the illegal "--" in it', () => {
         const expectedSToken = makeSTokenMaker();
         commentPToken = new CommentPToken({
            open: expectedSToken('<!--'),
            text: [
               expectedSToken('part1'),
               expectedSToken('--'),
               expectedSToken('part2'),
            ],
            close: expectedSToken('-->'),
         });
         const mockSource = new MockSTokenSource([
            [ 'part1', 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ '--', 'match', '--' ],
            [ 'part2', 'all', [ '--' ] ],
            [ '-->', 'match', '-->' ],
         ], 4, 0, 4);

         parseComment(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

      it('copes with EOF', () => {
         (commentPToken.text as any).pop();
         (commentPToken as any).close = undefined;
         const mockSource = new MockSTokenSource([
            [ undefined, 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ]);

         parseComment(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

      it('copes with EOF after the first chunk of text', () => {
         const expectedSToken = makeSTokenMaker();
         commentPToken = new CommentPToken({
            open: expectedSToken('<!--'),
            text: [
               expectedSToken('part1'),
            ],
            close: undefined,
         });
         const mockSource = new MockSTokenSource([
            'part1',
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ], 4, 0, 4);

         parseComment(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

      it('copes with EOF after the first chunk of text and --', () => {
         const expectedSToken = makeSTokenMaker();
         commentPToken = new CommentPToken({
            open: expectedSToken('<!--'),
            text: [
               expectedSToken('part1'),
               expectedSToken('--'),
            ],
            close: undefined,
         });
         const mockSource = new MockSTokenSource([
            [ 'part1', 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ '--', 'match', '--' ],
            [ undefined, 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ], 4, 0, 4);

         parseComment(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

   });

   describe('toXToken()', () => {

      it('returns comment with the text of the comment', () => {
         const token = commentPToken.toXToken();

         expect(token.text).toEqual('commentText');
      });

      it('returns the text as an empty string when no text values present', () => {
         (commentPToken.text as any).pop();

         const token = commentPToken.toXToken();

         expect(token.text).toEqual('');
      });

      it('returns a comment token with all the expected values', () => {
         const token = commentPToken.toXToken();

         expect(token).toEqual(new CommentXToken('commentText', commentPToken));
      });

      it('returns a comment token from a PToken with all STokens', () => {
         const pToken = new CommentPToken({
            open: expectedSToken('<!--'),
            text: [
               expectedSToken('part1'),
               expectedSToken('--'),
            ],
            close: expectedSToken('-->'),
         });
         const token = pToken.toXToken();

         expect(token).toEqual(new CommentXToken('part1--', pToken));
      });

   });

});
