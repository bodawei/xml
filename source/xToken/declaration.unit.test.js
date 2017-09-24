/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { WellFormedError } from '../error';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as declaration from './declaration.js';

describe('declaration (unit)', () => {
   let defaultParsed;

   beforeEach(() => {
      const sourceLToken = makeLTokenMaker();
      defaultParsed = {
         type: declaration.TYPE,
         open: sourceLToken('<!'),
         postOpenSpace: sourceLToken(' '),
         declType: sourceLToken('DOCTYPE'),
         postDeclTypeSpace: sourceLToken(' '),
      };
   });

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does an ordinary full parsing', () => {
         mockSource = new MockLTokenSource([
            [ ' ', 'space' ],
            [ 'DOCTYPE', 'word', [ '>' ] ],
            [ ' ', 'space' ],
         ], 2, 0, 2);

         declaration.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

      it('copes with EOF', () => {
         mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
         ]);
         defaultParsed.postOpenSpace = undefined;
         defaultParsed.declType = undefined;
         defaultParsed.postDeclTypeSpace = undefined;

         declaration.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         delete defaultParsed.postOpenSpace;
      });

      it('returns an an error collector', () => {
         const errors = declaration.checkWellFormed(defaultParsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('reports an error if there is a space after the opening <!', () => {
         const sourceLToken = makeLTokenMaker();
         defaultParsed.postOpenSpace = sourceLToken(' ');

         declaration.checkWellFormed(defaultParsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER,
            params: undefined,
            position: defaultParsed.postOpenSpace,
         });
      });

      it('reports an error if there is no declaration type provided', () => {
         delete defaultParsed.declType;

         declaration.checkWellFormed(defaultParsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DECL_NO_DECLTYPE,
            params: undefined,
            position: undefined,
            lastPosition: defaultParsed.open,
         });
      });

      it('reports an error if the type is not capitalized', () => {
         defaultParsed.declType.text = 'docType';

         declaration.checkWellFormed(defaultParsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DECL_DECLTYPE_INVALID_CASE,
            params: [ 'DOCTYPE', 'docType' ],
            position: defaultParsed.declType,
         });
      });

      it('reports an error if the type is not a valid type', () => {
         defaultParsed.declType.text = 'BOGUSTYPE';

         declaration.checkWellFormed(defaultParsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.DECL_UNKNOWN,
            params: [ 'BOGUSTYPE' ],
            position: defaultParsed.declType,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the tokens found in the parsed value', () => {
         const token = declaration.makeToken(defaultParsed);

         expect(token).toEqual(new declaration.Token([
            defaultParsed.open,
            defaultParsed.postOpenSpace,
            defaultParsed.declType,
            defaultParsed.postDeclTypeSpace,
         ]));
      });

   });

   describe('appendLTokens()', () => {

      it('adds all declaration LTokens', () => {
         const results = [];

         declaration.appendLTokens(results, defaultParsed);

         expect(results).toEqual([
            defaultParsed.open,
            defaultParsed.postOpenSpace,
            defaultParsed.declType,
            defaultParsed.postDeclTypeSpace,
         ]);
      });

   });

   describe('makeTypedDeclaration()', () => {

      it('adds all declaration items as well as the specified type', () => {
         const results = declaration.makeTypedDeclaration('foo', defaultParsed);

         expect(results).toEqual({
            type: 'foo',
            open: defaultParsed.open,
            postOpenSpace: defaultParsed.postOpenSpace,
            declType: defaultParsed.declType,
            postDeclTypeSpace: defaultParsed.postDeclTypeSpace,
         });
      });

   });

});
