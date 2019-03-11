/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from 'basic';
import { MockErrorCollector } from 'error-test';
import { MockSTokenSource } from 'sToken-test';
import { WellFormedError } from 'error';
import { SToken } from 'sToken';

import * as misc from '../common/misc';

import {
   ParameterEntityReferencePToken,
   ParameterEntityReferenceXToken,
   parseParameterEntityReference
} from '../parameterEntityReference';

describe('parameterEntityReference (unit)', () => {
   let pePToken: ParameterEntityReferencePToken;
   let emd: EntityMetaData;

   beforeEach(() => {
      pePToken = new ParameterEntityReferencePToken({
         open: SToken.fromString('%'),
         openSpace: SToken.fromString(' '),
         name: SToken.fromString('entityName'),
         nameSpace: SToken.fromString(' '),
         close: SToken.fromString(';'),
      });
   });

   describe('paramParse()', () => {
      let callback: jasmine.Spy;

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

         parseParameterEntityReference(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(pePToken);
      });

      it('copes with no reference at all', () => {
         const mockSource = new MockSTokenSource([
            undefined,
         ]);

         parseParameterEntityReference(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith(undefined);
      });

      it('copes with eof mid-stream', () => {
         const mockSource = new MockSTokenSource([
            [ '%', 'match', '%' ],
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         parseParameterEntityReference(mockSource, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: SToken.fromString('%'),
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: undefined,
         });
      });
   });

   describe('pToken.checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkName');
      });

      it('checks that the name is a valid name', () => {

         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(pePToken.name, mockErrorCollector, emd, WellFormedError.ID.PEREF_NAME_INVALID);
      });

      it('reports an error if there is a space after the opening %', () => {
         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PEREF_XTRA_SPACE,
            params: [ 'entityName' ],
            position: pePToken.openSpace,
         });
      });

      it('reports an error if there is no name', () => {
         pePToken = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: SToken.fromString(';'),
         });

         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PEREF_NO_NAME,
            params: undefined,
            lastPosition: pePToken.open,
         });
      });

      it('reports an error if there is a space after the entity name', () => {
         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PEREF_XTRA_TRAILING_SPACE,
            params: [ 'entityName' ],
            position: pePToken.nameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         pePToken = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            openSpace: undefined,
            name: SToken.fromString('refName'),
            nameSpace: undefined,
            close: undefined,
         });

         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PEREF_NO_SEMICOLON,
            params: [ 'refName' ],
            lastPosition: pePToken.name,
         });
      });

   });

   describe('pToken.toXToken()', () => {

      it('returns a ParameterEntityReferenceXToken', () => {
         const token = pePToken.toXToken();

         expect(token).toEqual(new ParameterEntityReferenceXToken('entityName', pePToken));
      });

      it('returns an entity reference token with a blank name when the name could not be found', () => {
         pePToken = new ParameterEntityReferencePToken({
            open: SToken.fromString('%'),
            close: SToken.fromString(';'),
         });
            const token = pePToken.toXToken();

         expect(token).toEqual(new ParameterEntityReferenceXToken('', pePToken));
      });
   });

   describe('toSTokenArray()', () => {

      it('returns all the STokens', () => {
         expect(pePToken.toSTokenArray()).toEqual([
            pePToken.open!,
            pePToken.openSpace!,
            pePToken.name!,
            pePToken.nameSpace!,
            pePToken.close!,
         ]);
      });

   });

});
