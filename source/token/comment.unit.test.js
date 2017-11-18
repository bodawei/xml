/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Offset } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeSTokenMaker, MockSTokenSource } from '../sToken/test';
import { WellFormedError } from '../error';

import * as comment from './comment.js';
import * as misc from './common/misc.js';

describe('comment (unit)', () => {
   let commentPToken;
   let expectedSToken;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      commentPToken = {
         type: 'COMMENT',
         open: expectedSToken('<!--'),
         text: [ expectedSToken('commentText') ],
         close: expectedSToken('-->'),
      };
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            const pToken = new comment.PToken(commentPToken);

            expect(pToken.getSTokenArray()).toEqual([
               pToken.open,
               pToken.text[0],
               pToken.close,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a simple parse', () => {
         const mockSource = new MockSTokenSource([
            [ 'commentText', 'all', [ '--' ] ],
            [ '-->', 'match', '-->' ],
         ], 4, 0, 4);

         comment.parse(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

      it('parses a comment with the illegal "--" in it', () => {
         const expectedSToken = makeSTokenMaker();
         commentPToken = {
            type: 'COMMENT',
            open: expectedSToken('<!--'),
            text: [
               expectedSToken('part1'),
               expectedSToken('--'),
               expectedSToken('part2'),
            ],
            close: expectedSToken('-->'),
         };
         const mockSource = new MockSTokenSource([
            [ 'part1', 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ '--', 'match', '--' ],
            [ 'part2', 'all', [ '--' ] ],
            [ '-->', 'match', '-->' ],
         ], 4, 0, 4);

         comment.parse(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

      it('copes with EOF', () => {
         commentPToken.text = [];
         commentPToken.close = undefined;
         const mockSource = new MockSTokenSource([
            [ undefined, 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ]);

         comment.parse(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

      it('copes with EOF after the first chunk of text', () => {
         const expectedSToken = makeSTokenMaker();
         commentPToken = {
            type: 'COMMENT',
            open: expectedSToken('<!--'),
            text: [
               expectedSToken('part1'),
            ],
            close: undefined,
         };
         const mockSource = new MockSTokenSource([
            'part1',
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ], 4, 0, 4);

         comment.parse(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

      it('copes with EOF after the first chunk of text and --', () => {
         const expectedSToken = makeSTokenMaker();
         commentPToken = {
            type: 'COMMENT',
            open: expectedSToken('<!--'),
            text: [
               expectedSToken('part1'),
               expectedSToken('--'),
            ],
            close: undefined,
         };
         const mockSource = new MockSTokenSource([
            [ 'part1', 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ '--', 'match', '--' ],
            [ undefined, 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ], 4, 0, 4);

         comment.parse(mockSource, commentPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(commentPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkWellFormedText');
         emd = new EntityMetaData();
      });

      it('asks the misc.checkWellFormedText() to validate the text', () => {
         commentPToken.text = [
            commentPToken.open,  // just need another token here
            expectedSToken('commentText'),
         ];
         comment.checkWellFormed(commentPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(commentPToken.text[0], mockErrorCollector, emd);
         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(commentPToken.text[1], mockErrorCollector, emd);
      });

      it('reports an error if the content ends with a hyphen', () => {
         commentPToken.text[0].text += '-';
         commentPToken.text[0].originalText += '-';

         comment.checkWellFormed(commentPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_ENDS_WITH_HYPHEN,
            params: undefined,
            position: new Offset(emd.location, 14, 0, 14),
         });
      });

      it('reports an error there is a "--" in the comment text', () => {
         commentPToken.text.push(expectedSToken('--'));
         commentPToken.text.push(expectedSToken(' illegal'));

         comment.checkWellFormed(commentPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_DOUBLE_HYPHEN,
            params: undefined,
            position: commentPToken.text[1],
         });
      });

      it('reports an error if there was no closing', () => {
         delete commentPToken.close;

         comment.checkWellFormed(commentPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: commentPToken.text[0],
         });
      });

      it('reports an error if there was no text and no closing', () => {
         delete commentPToken.text;
         delete commentPToken.close;

         comment.checkWellFormed(commentPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: commentPToken.open,
         });
      });

      it('reports an error if there was an empty text and no closing', () => {
         commentPToken.text = [];
         delete commentPToken.close;

         comment.checkWellFormed(commentPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: commentPToken.open,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns comment with the text of the comment', () => {
         const token = comment.pTokenToXToken(commentPToken);

         expect(token.text).toEqual('commentText');
      });

      it('returns the text as an empty string if nothing was found in the source', () => {
         delete commentPToken.text;

         const token = comment.pTokenToXToken(commentPToken);

         expect(token.text).toEqual('');
      });

      it('returns the text as an empty string if no text values present', () => {
         commentPToken.text = [];

         const token = comment.pTokenToXToken(commentPToken);

         expect(token.text).toEqual('');
      });

      it('returns a comment token with all the expected values', () => {
         const token = comment.pTokenToXToken(commentPToken);

         expect(token).toEqual(new comment.XToken('commentText', commentPToken));
      });

      it('returns a comment token from a PToken with all STokens', () => {
         const pToken = {
            type: 'COMMENT',
            open: expectedSToken('<!--'),
            text: [
               expectedSToken('part1'),
               expectedSToken('--'),
            ],
            close: expectedSToken('-->'),
         };
         const token = comment.pTokenToXToken(pToken);

         expect(token).toEqual(new comment.XToken('part1--', pToken));
      });

   });

});
