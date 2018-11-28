/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from 'basic';
import { MockErrorCollector } from 'error-test';
import { MockSTokenSource } from 'sToken-test';
import { WellFormedError } from 'error';
import { SToken } from 'sToken';

import {
   GeneralEntityReferencePToken,
   GeneralEntityReferenceXToken,
   parseGeneralEntityReference,
} from '../generalEntityReference';

describe('generalEntityReference (unit)', () => {
   let pePToken: GeneralEntityReferencePToken;
   let emd: EntityMetaData;

   beforeEach(() => {
      pePToken = new GeneralEntityReferencePToken({
         open: SToken.fromString('&'),
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
            [ ' ', 'space' ],
            [ 'entityName', 'word', [ ';' ] ],
            [ ' ', 'space' ],
            [ ';', 'match', ';' ],
         ]);

         parseGeneralEntityReference(mockSource, SToken.fromString('&'), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(pePToken);
      });

      it('copes with eof mid-stream', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         parseGeneralEntityReference(mockSource, SToken.fromString('&'), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: SToken.fromString('&'),
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
      });

      it('reports an error if there is a space after the opening %', () => {
         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_SPACE,
            params: [ 'entityName' ],
            position: pePToken.openSpace,
         });
      });

      it('reports an error if there is no name', () => {
         pePToken = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: SToken.fromString(';'),
         });

         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_NAME,
            params: undefined,
            lastPosition: pePToken.open,
         });
      });

      it('reports an error if there is a space after the entity name', () => {
         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_XTRA_TRAILING_SPACE,
            params: [ 'entityName' ],
            position: pePToken.nameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         pePToken = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            openSpace: undefined,
            name: SToken.fromString('refName'),
            nameSpace: undefined,
            close: undefined,
         });

         pePToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.REFERENCE_NO_SEMICOLON,
            params: [ 'refName' ],
            lastPosition: pePToken.name,
         });
      });

   });

   describe('pToken.toXToken()', () => {

      it('returns a GeneralEntityReferenceXToken', () => {
         const token = pePToken.toXToken();

         expect(token).toEqual(new GeneralEntityReferenceXToken('entityName', pePToken));
      });

      it('returns an entity reference token with a blank name when the name could not be found', () => {
         pePToken = new GeneralEntityReferencePToken({
            open: SToken.fromString('&'),
            close: SToken.fromString(';'),
         });
            const token = pePToken.toXToken();

         expect(token).toEqual(new GeneralEntityReferenceXToken('', pePToken));
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
