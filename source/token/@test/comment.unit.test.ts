/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Offset } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { MockErrorCollector } from'error-test';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';

import {
   CommentPToken,
   CommentXToken,
   parseComment,
} from '../comment';
import misc from '../common/misc';

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

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkWellFormedText');
         emd = new EntityMetaData();
      });

      it('asks the misc.checkWellFormedText() to validate the text', () => {
         (commentPToken.text as any).pop();
         (commentPToken.text as any).push(commentPToken.open);  // just need another token here
         (commentPToken.text as any).push(expectedSToken('commentText'));
         commentPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(commentPToken.text[0], mockErrorCollector, emd);
         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(commentPToken.text[1], mockErrorCollector, emd);
      });

      it('reports an error when the content ends with a hyphen', () => {
         commentPToken.text[0].str += '-';
         commentPToken.text[0].originalStr += '-';

         commentPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_ENDS_WITH_HYPHEN,
            params: undefined,
            position: new Offset(emd.location, 14, 0, 14),
         });
      });

      it('reports an error when the content ends with a hyphen, and there is no range', () => {
         commentPToken.text[0].str += '-';
         commentPToken.text[0].originalStr += '-';
         commentPToken.text[0].ranges = [];

         commentPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_ENDS_WITH_HYPHEN,
            params: undefined,
            position: commentPToken.text[0],
         });
      });

      it('reports an error there is a "--" in the comment text', () => {
         (commentPToken.text as any).push(expectedSToken('--'));
         (commentPToken.text as any).push(expectedSToken(' illegal'));

         commentPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_DOUBLE_HYPHEN,
            params: undefined,
            position: commentPToken.text[1],
         });
      });

      it('reports an error when there was no closing', () => {
         delete (commentPToken as any).close;

         commentPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: commentPToken.text[0],
         });
      });

      it('reports an error when there was an empty text and no closing', () => {
         (commentPToken.text as any).pop();
         delete (commentPToken as any).close;

         commentPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: commentPToken.open,
         });
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
