/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Offset } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as comment from './comment.js';
import * as misc from './common/misc.js';

describe('comment (unit)', () => {
   let defaultParsed;
   let expectedLToken;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
      defaultParsed = {
         type: 'COMMENT',
         open: expectedLToken('<!--'),
         text: [ expectedLToken('commentText') ],
         close: expectedLToken('-->'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a simple parse', () => {
         const mockSource = new MockLTokenSource([
            [ 'commentText', 'all', [ '--' ] ],
            [ '-->', 'match', '-->' ],
         ], 4, 0, 4);

         comment.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

      it('parses a comment with the illegal "--" in it', () => {
         const expectedLToken = makeLTokenMaker();
         defaultParsed = {
            type: 'COMMENT',
            open: expectedLToken('<!--'),
            text: [
               expectedLToken('part1'),
               expectedLToken('--'),
               expectedLToken('part2'),
            ],
            close: expectedLToken('-->'),
         };
         const mockSource = new MockLTokenSource([
            [ 'part1', 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ '--', 'match', '--' ],
            [ 'part2', 'all', [ '--' ] ],
            [ '-->', 'match', '-->' ],
         ], 4, 0, 4);

         comment.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

      it('copes with EOF', () => {
         defaultParsed.text = [];
         defaultParsed.close = undefined;
         const mockSource = new MockLTokenSource([
            [ undefined, 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ]);

         comment.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

      it('copes with EOF after the first chunk of text', () => {
         const expectedLToken = makeLTokenMaker();
         defaultParsed = {
            type: 'COMMENT',
            open: expectedLToken('<!--'),
            text: [
               expectedLToken('part1'),
            ],
            close: undefined,
         };
         const mockSource = new MockLTokenSource([
            'part1',
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ], 4, 0, 4);

         comment.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

      it('copes with EOF after the first chunk of text and --', () => {
         const expectedLToken = makeLTokenMaker();
         defaultParsed = {
            type: 'COMMENT',
            open: expectedLToken('<!--'),
            text: [
               expectedLToken('part1'),
               expectedLToken('--'),
            ],
            close: undefined,
         };
         const mockSource = new MockLTokenSource([
            [ 'part1', 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ '--', 'match', '--' ],
            [ undefined, 'all', [ '--' ] ],
            [ undefined, 'match', '-->' ],
            [ undefined, 'match', '--' ],
         ], 4, 0, 4);

         comment.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
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
         defaultParsed.text = [
            defaultParsed.open,  // just need another token here
            expectedLToken('commentText'),
         ];
         comment.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(defaultParsed.text[0], mockErrorCollector, emd);
         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(defaultParsed.text[1], mockErrorCollector, emd);
      });

      it('reports an error if the content ends with a hyphen', () => {
         defaultParsed.text[0].text += '-';
         defaultParsed.text[0].originalText += '-';

         comment.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_ENDS_WITH_HYPHEN,
            params: undefined,
            position: new Offset(emd.location, 14, 0, 14),
         });
      });

      it('reports an error there is a "--" in the comment text', () => {
         defaultParsed.text.push(expectedLToken('--'));
         defaultParsed.text.push(expectedLToken(' illegal'));

         comment.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_DOUBLE_HYPHEN,
            params: undefined,
            position: defaultParsed.text[1],
         });
      });

      it('reports an error if there was no closing', () => {
         delete defaultParsed.close;

         comment.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: defaultParsed.text[0],
         });
      });

      it('reports an error if there was no text and no closing', () => {
         delete defaultParsed.text;
         delete defaultParsed.close;

         comment.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: defaultParsed.open,
         });
      });

      it('reports an error if there was an empty text and no closing', () => {
         defaultParsed.text = [];
         delete defaultParsed.close;

         comment.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.COMMENT_NO_CLOSE,
            params: undefined,
            position: undefined,
            lastPosition: defaultParsed.open,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns comment with the text of the comment', () => {
         const token = comment.makeToken(defaultParsed);

         expect(token.text).toEqual('commentText');
      });

      it('returns the text as an empty string if nothing was found in the source', () => {
         delete defaultParsed.text;

         const token = comment.makeToken(defaultParsed);

         expect(token.text).toEqual('');
      });

      it('returns the text as an empty string if no text values present', () => {
         defaultParsed.text = [];

         const token = comment.makeToken(defaultParsed);

         expect(token.text).toEqual('');
      });

      it('returns a comment token with all the expected values', () => {
         const token = comment.makeToken(defaultParsed);

         expect(token).toEqual(new comment.Token('commentText', [
            defaultParsed.open,
            defaultParsed.text[0],
            defaultParsed.close,
         ]));
      });

      it('returns a comment token from a parsed with many bits', () => {
         const localParsed = {
            type: 'COMMENT',
            open: expectedLToken('<!--'),
            text: [
               expectedLToken('part1'),
               expectedLToken('--'),
            ],
            close: expectedLToken('-->'),
         };
         const token = comment.makeToken(localParsed);

         expect(token).toEqual(new comment.Token('part1--', [
            localParsed.open,
            localParsed.text[0],
            localParsed.text[1],
            localParsed.close,
         ]));
      });

   });

});
