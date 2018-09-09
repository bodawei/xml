/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Range } from '../../basic/index';
import { MockErrorCollector } from '../../error/@test/helper';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError } from '../../error';
import { SToken } from '../../sToken/index';

import entityReference from '../entityReference.js';

describe('entityReference (unit)', () => {
   let generalEntityPToken;
   let parameterEntityPToken;
   let openSToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();

      openSToken = new SToken('&', '&', new Range(0, 0, 0, 1, 0, 1));

      generalEntityPToken = new entityReference.PToken({
         open: openSToken,
         postOpenSpace: makeSToken(' '),
         name: makeSToken('entityName'),
         postNameSpace: makeSToken(' '),
         close: makeSToken(';'),
      });

      const makeToken = makeSTokenMaker();
      parameterEntityPToken = new entityReference.ParamPToken({
         open: makeToken('%'),
         postOpenSpace: makeToken(' '),
         name: makeToken('entityName'),
         postNameSpace: makeToken(' '),
         close: makeToken(';'),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(generalEntityPToken.getSTokenArray()).toEqual([
               generalEntityPToken.open,
               generalEntityPToken.postOpenSpace,
               generalEntityPToken.name,
               generalEntityPToken.postNameSpace,
               generalEntityPToken.close,
            ]);
         });

      });

   });

   describe('ParamPToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(parameterEntityPToken.getSTokenArray()).toEqual([
               parameterEntityPToken.open,
               parameterEntityPToken.postOpenSpace,
               parameterEntityPToken.name,
               parameterEntityPToken.postNameSpace,
               parameterEntityPToken.close,
            ]);
         });

      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a full parse', () => {
         const mockSource = new MockSTokenSource([
            [ ' ', 'space' ],
            [ 'entityName', 'word', [ ';' ] ],
            [ ' ', 'space' ],
            [ ';', 'match', ';' ],
         ]);
         generalEntityPToken.open = openSToken;

         entityReference.parse(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(generalEntityPToken);
      });

      it('copes with eof', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityReference.parse(mockSource, openSToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            type: 'ENTITYREF',
            open: openSToken,
            postOpenSpace: undefined,
            name: undefined,
            postNameSpace: undefined,
            close: undefined,
         });
      });

   });

   describe('paramParse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a full parse', () => {
         const mockSource = new MockSTokenSource([
            [ '%', 'match', '%' ],
            [ ' ', 'space' ],
            [ 'entityName', 'word', [ ';' ] ],
            [ ' ', 'space' ],
            [ ';', 'match', ';' ],
         ]);

         entityReference.paramParse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(parameterEntityPToken);
      });

      it('copes with eof', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityReference.paramParse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps({
            type: 'PARAMETERENTITYREF',
            open: undefined,
            postOpenSpace: undefined,
            name: undefined,
            postNameSpace: undefined,
            close: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let pToken;
      let makeSToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         makeSToken = makeSTokenMaker();

         pToken = {
            open: makeSToken('&'),
            postOpenSpace: undefined,
            name: makeSToken('theName'),
            postNameSpace: undefined,
            close: makeSToken(';'),
         };
      });

      it('reports an error if there is a space after the opening &', () => {
         pToken.postOpenSpace = makeSToken(' ');

         entityReference.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_SPACE,
            params: [ 'theName' ],
            position: pToken.postOpenSpace,
         });
      });

      it('reports an error if there is no name', () => {
         delete pToken.name;

         entityReference.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_NAME,
            params: undefined,
            lastPosition: pToken.open,
         });
      });

      it('reports an error if there is a space after the entity name', () => {
         pToken.postNameSpace = makeSToken(' ');

         entityReference.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_TRAILING_SPACE,
            params: [ 'theName' ],
            position: pToken.postNameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete pToken.close;

         entityReference.checkWellFormed(pToken, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_SEMICOLON,
            params: [ 'theName' ],
            lastPosition: pToken.name,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const token = entityReference.pTokenToXToken(generalEntityPToken);

         expect(token).toEqual(new entityReference.XToken('entityName', generalEntityPToken));
      });

      it('returns an entity reference token with a blank name when the name could not be found', () => {
         delete generalEntityPToken.name;
         const token = entityReference.pTokenToXToken(generalEntityPToken);

         expect(token).toEqual(new entityReference.XToken('', generalEntityPToken));
      });

      it('returns a ParameterEntityReference if the PToken is a parameterEntity', () => {
         const token = entityReference.pTokenToXToken(parameterEntityPToken);

         expect(token).toEqual(new entityReference.ParamXToken('entityName', parameterEntityPToken));
      });
   });

});
