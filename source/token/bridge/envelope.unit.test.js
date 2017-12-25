/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError } from '../../error';
import { MockErrorCollector } from '../../error/test';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/test';

import misc from '../common/misc.js';
import * as envelope from './envelope.js';

describe('envelope (unit)', () => {
   let envelopePToken;

   beforeEach(() => {
      const sourceSToken = makeSTokenMaker();
      envelopePToken = {
         type: envelope.PTYPE,
         open: sourceSToken('<!['),
         postOpenSpace: sourceSToken(' '),
         envelopeType: sourceSToken('CDATA'),
         postEnvelopeTypeSpace: sourceSToken(' '),
         bracket: sourceSToken('['),
      };
   });

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does an ordinary full parsing', () => {
         mockSource = new MockSTokenSource([
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '[', '>' ] ],
            [ ' ', 'space' ],
            [ '[', 'match', '[' ],
         ], 3, 0, 3);

         envelope.parse(mockSource, envelopePToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(envelopePToken);
      });

      it('copes with EOF', () => {
         mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         envelopePToken.postOpenSpace = undefined;
         envelopePToken.envelopeType = undefined;
         envelopePToken.postEnvelopeTypeSpace = undefined;
         envelopePToken.bracket = undefined;

         envelope.parse(mockSource, envelopePToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(envelopePToken);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let emd;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();
         spyOn(misc, 'checkWellFormedText');
      });

      it('calls misc.checkWellFormedText() on the type', () => {
         envelope.checkWellFormed(envelopePToken, true, mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(envelopePToken.envelopeType, mockErrorCollector, emd);
      });

      it('returns an an error collector', () => {
         const errors = envelope.checkWellFormed(envelopePToken, true, mockErrorCollector, emd);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('reports an error if there is no envelope type provided', () => {
         delete envelopePToken.envelopeType;

         envelope.checkWellFormed(envelopePToken, true, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_NO_TYPE,
            params: undefined,
            position: undefined,
            lastPosition: envelopePToken.postOpenSpace,
         });
      });

      it('reports an error if the type is not capitalized', () => {
         envelopePToken.envelopeType.text = 'cdata';

         envelope.checkWellFormed(envelopePToken, true, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_INVALID_CASE,
            params: [ 'CDATA', 'cdata' ],
            position: envelopePToken.envelopeType,
         });
      });

      it('reports an error if the type is not a known type', () => {
         envelopePToken.envelopeType.text = 'BOGUSTYPE';

         envelope.checkWellFormed(envelopePToken, true, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_UNKNOWN,
            params: [ 'BOGUSTYPE' ],
            position: envelopePToken.envelopeType,
         });
      });

      it('reports an error if there is a no bracket after the type', () => {
         delete envelopePToken.bracket;

         envelope.checkWellFormed(envelopePToken, true, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_NO_SECOND_BRACKET,
            params: [ 'CDATA' ],
            lastPosition: envelopePToken.postEnvelopeTypeSpace,
         });
      });

      it('reports an error if there is a space after the <![ but there should not be', () => {
         envelope.checkWellFormed(envelopePToken, false, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_XTRA_SPACE_AFTER_OPEN,
            params: [ 'CDATA' ],
            position: envelopePToken.postOpenSpace,
         });
      });

      it('reports an error if there is a space after the envelope type but there should not be', () => {
         envelope.checkWellFormed(envelopePToken, false, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_XTRA_SPACE_AFTER_TYPE,
            params: [ 'CDATA' ],
            position: envelopePToken.postEnvelopeTypeSpace,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns a token with the tokens found in the pToken value', () => {
         const token = envelope.pTokenToXToken(envelopePToken);
         const expected = new envelope.XToken([]);
         expected.pToken = envelopePToken;

         expect(token).toEqual(expected);
      });

   });

});
