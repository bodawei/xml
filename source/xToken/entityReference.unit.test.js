/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError } from '../error';

import * as entityReference from './entityReference.js';

describe('entityReference', () => {
   let parsedGeneralEntity;
   let parsedParameterEntity;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedGeneralEntity = {
         type: 'ENTITYREF',
         open: expectedLToken('&'),
         postOpenSpace: expectedLToken(' '),
         name: expectedLToken('entityName'),
         postEntityNameSpace: expectedLToken(' '),
         close: expectedLToken(';'),
      };

      const makeToken = makeLTokenMaker();
      parsedParameterEntity = {
         type: 'PARAMETERENTITYREF',
         open: makeToken('%'),
         postOpenSpace: makeToken(' '),
         name: makeToken('entityName'),
         postEntityNameSpace: makeToken(' '),
         close: makeToken(';'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a full parse', () => {
         const mockSource = new MockLTokenSource([
            [ '&', 'match', '&' ],
            [ ' ', 'space' ],
            [ 'entityName', 'word', [ ';' ] ],
            [ ' ', 'space' ],
            [ ';', 'match', ';' ],
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedGeneralEntity);
      });

      it('copes with eof', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityReference.parse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITYREF',
            open: undefined,
            postOpenSpace: undefined,
            name: undefined,
            postEntityNameSpace: undefined,
            close: undefined,
         });
      });

   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a full parse', () => {
         const mockSource = new MockLTokenSource([
            [ '%', 'match', '%' ],
            [ ' ', 'space' ],
            [ 'entityName', 'word', [ ';' ] ],
            [ ' ', 'space' ],
            [ ';', 'match', ';' ],
         ]);

         entityReference.paramParse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedParameterEntity);
      });

      it('copes with eof', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityReference.paramParse(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'PARAMETERENTITYREF',
            open: undefined,
            postOpenSpace: undefined,
            name: undefined,
            postEntityNameSpace: undefined,
            close: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;
      let expectedLToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         expectedLToken = makeLTokenMaker();

         parsed = {
            open: expectedLToken('&'),
            postOpenSpace: undefined,
            name: expectedLToken('theName'),
            postEntityNameSpace: undefined,
            close: expectedLToken(';'),
         };
      });

      it('reports an error if there is a space after the opening &', () => {
         parsed.postOpenSpace = expectedLToken(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_SPACE,
            params: [ 'theName' ],
            position: parsed.postOpenSpace,
         });
      });

      it('reports an error if there is no name', () => {
         delete parsed.name;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_NAME,
            params: undefined,
            lastPosition: parsed.open,
         });
      });

      it('reports an error if there is a space after the entity name', () => {
         parsed.postEntityNameSpace = expectedLToken(' ');

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_TRAILING_SPACE,
            params: [ 'theName' ],
            position: parsed.postEntityNameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete parsed.close;

         entityReference.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_SEMICOLON,
            params: [ 'theName' ],
            lastPosition: parsed.name,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const token = entityReference.makeToken(parsedGeneralEntity);

         expect(token).toEqual(new entityReference.Token('entityName', [
            parsedGeneralEntity.open,
            parsedGeneralEntity.postOpenSpace,
            parsedGeneralEntity.name,
            parsedGeneralEntity.postEntityNameSpace,
            parsedGeneralEntity.close,
         ]));
      });

      it('returns an entity reference token with a blank name when the name could not be found', () => {
         delete parsedGeneralEntity.name;
         const token = entityReference.makeToken(parsedGeneralEntity);
         token.lTokens = [];

         expect(token).toEqual(new entityReference.Token('', []));
      });

      it('returns a ParameterEntityReference if the parsed is a parameterEntity', () => {
         const token = entityReference.makeToken(parsedParameterEntity);

         expect(token).toEqual(new entityReference.ParamToken('entityName', [
            parsedParameterEntity.open,
            parsedParameterEntity.postOpenSpace,
            parsedParameterEntity.name,
            parsedParameterEntity.postEntityNameSpace,
            parsedParameterEntity.close,
         ]));
      });
   });

});
