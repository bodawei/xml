/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'pToken-test';

import {
   CommentPToken,
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
});
