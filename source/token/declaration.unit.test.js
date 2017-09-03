/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import { WellFormedError } from '../error';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as declaration from './declaration.js';

describe('declaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does not do any other parsing if no declaration type is found', () => {
         const sourceLToken = makeLTokenMaker();
         const expectedLToken = makeLTokenMaker();
         const openLToken = sourceLToken('<!');
         mockSource = new MockLTokenSource([
            sourceLToken(' '),
            undefined,
            undefined,
         ]);

         declaration.parse(mockSource, openLToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'UNKNOWNDECL',
            open: expectedLToken('<!'),
            postOpenSpace: expectedLToken(' '),
            declType: undefined,
            postDeclTypeSpace: undefined,
         } ] ]);
      });

      it('does not do any other parsing if the declaration type is not known', () => {
         const sourceLToken = makeLTokenMaker();
         const expectedLToken = makeLTokenMaker();
         const openLToken = sourceLToken('<!');
         mockSource = new MockLTokenSource([
            sourceLToken(' '),
            sourceLToken('BOGUS'),
            undefined,
         ]);

         declaration.parse(mockSource, openLToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'UNKNOWNDECL',
            open: expectedLToken('<!'),
            postOpenSpace: expectedLToken(' '),
            declType: expectedLToken('BOGUS'),
            postDeclTypeSpace: undefined,
         } ] ]);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let sourceLToken;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         sourceLToken = makeLTokenMaker();
         parsed = {
            type: declaration.TYPE,
            open: sourceLToken('<!'),
            postOpenSpace: undefined,
            declType: sourceLToken('DOCTYPE'),
            postDeclTypeSpace: sourceLToken(' '),
         };
      });

      it('returns an an error collector', () => {
         const errors = declaration.checkWellFormed(parsed, mockErrorCollector);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('reports an error if there is a space after the opening <!', () => {
         parsed.postOpenSpace = sourceLToken(' ');

         declaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.BANGITEM_OPEN_XTRA_SPACE_AFTER,
            params: undefined,
            position: parsed.postOpenSpace,
         });
      });

      it('reports an error if there is no declaration type provided', () => {
         delete parsed.declType;

         declaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.BANGITEM_NO_DECLTYPE,
            params: undefined,
            position: undefined,
            lastPosition: parsed.open,
         });
      });

      it('reports an error if the type is not capitalized', () => {
         parsed.declType.text = 'docType';

         declaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.BANGITEM_DECLTYPE_INVALID_CASE,
            params: [ 'DOCTYPE', 'docType' ],
            position: parsed.declType,
         });
      });

      it('reports an error if the type is not capitalized', () => {
         parsed.declType.text = 'BOGUSTYPE';

         declaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.BANGITEM_UNKNOWN,
            params: [ 'BOGUSTYPE' ],
            position: parsed.declType,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the tokens found in the parsed value', () => {
         const sourceLToken = makeLTokenMaker();
         const parsed = {
            open: sourceLToken('<!'),
            postOpenSpace: sourceLToken(' '),
            declType: sourceLToken('DOCTYPE'),
            postDeclTypeSpace: sourceLToken(' '),
         };

         const token = declaration.makeToken(parsed);

         expect(token).toEqual(new declaration.Token([
            parsed.open,
            parsed.postOpenSpace,
            parsed.declType,
            parsed.postDeclTypeSpace,
         ]));
      });

   });

});
