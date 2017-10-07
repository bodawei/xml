/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { WellFormedError } from '../error';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as misc from './common/misc.js';
import * as envelope from './envelope.js';

describe('envelope (unit)', () => {
   let parsedEnvelope;

   beforeEach(() => {
      const sourceLToken = makeLTokenMaker();
      parsedEnvelope = {
         type: envelope.TYPE,
         open: sourceLToken('<!['),
         postOpenSpace: sourceLToken(' '),
         envelopeType: sourceLToken('CDATA'),
         postEnvelopeTypeSpace: sourceLToken(' '),
         bracket: sourceLToken('['),
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
            [ 'CDATA', 'word', [ '[', '>' ] ],
            [ ' ', 'space' ],
            [ '[', 'match', '[' ],
         ], 3, 0, 3);

         envelope.parse(mockSource, parsedEnvelope.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedEnvelope);
      });

      it('copes with EOF', () => {
         mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ]);
         parsedEnvelope.postOpenSpace = undefined;
         parsedEnvelope.envelopeType = undefined;
         parsedEnvelope.postEnvelopeTypeSpace = undefined;
         parsedEnvelope.bracket = undefined;

         envelope.parse(mockSource, parsedEnvelope.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedEnvelope);
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
         envelope.checkWellFormed(parsedEnvelope, true, mockErrorCollector, emd);

         expect(misc.checkWellFormedText)
            .toHaveBeenCalledWith(parsedEnvelope.envelopeType, mockErrorCollector, emd);
      });

      it('returns an an error collector', () => {
         const errors = envelope.checkWellFormed(parsedEnvelope, true, mockErrorCollector, emd);

         expect(errors).toEqual(mockErrorCollector);
      });

      it('reports an error if there is no envelope type provided', () => {
         delete parsedEnvelope.envelopeType;

         envelope.checkWellFormed(parsedEnvelope, true, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_NO_TYPE,
            params: undefined,
            position: undefined,
            lastPosition: parsedEnvelope.postOpenSpace,
         });
      });

      it('reports an error if the type is not capitalized', () => {
         parsedEnvelope.envelopeType.text = 'cdata';

         envelope.checkWellFormed(parsedEnvelope, true, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_INVALID_CASE,
            params: [ 'CDATA', 'cdata' ],
            position: parsedEnvelope.envelopeType,
         });
      });

      it('reports an error if the type is not a known type', () => {
         parsedEnvelope.envelopeType.text = 'BOGUSTYPE';

         envelope.checkWellFormed(parsedEnvelope, true, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_UNKNOWN,
            params: [ 'BOGUSTYPE' ],
            position: parsedEnvelope.envelopeType,
         });
      });

      it('reports an error if there is a no bracket after the type', () => {
         delete parsedEnvelope.bracket;

         envelope.checkWellFormed(parsedEnvelope, true, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_NO_SECOND_BRACKET,
            params: [ 'CDATA' ],
            lastPosition: parsedEnvelope.postEnvelopeTypeSpace,
         });
      });

      it('reports an error if there is a space after the <![ but there should not be', () => {
         envelope.checkWellFormed(parsedEnvelope, false, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_XTRA_SPACE_AFTER_OPEN,
            params: [ 'CDATA' ],
            position: parsedEnvelope.postOpenSpace,
         });
      });

      it('reports an error if there is a space after the envelope type but there should not be', () => {
         envelope.checkWellFormed(parsedEnvelope, false, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENVELOPE_XTRA_SPACE_AFTER_TYPE,
            params: [ 'CDATA' ],
            position: parsedEnvelope.postEnvelopeTypeSpace,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the tokens found in the parsed value', () => {
         const token = envelope.makeToken(parsedEnvelope);
         const expected = new envelope.Token([]);
         expected.parsed = parsedEnvelope;

         expect(token).toEqual(expected);
      });

   });

   describe('makeTypedEnvelope()', () => {

      it('adds all declaration items as well as the specified type', () => {
         const results = envelope.makeTypedEnvelope('foo', parsedEnvelope);

         expect(results).toEqual({
            type: 'foo',
            open: parsedEnvelope.open,
            postOpenSpace: parsedEnvelope.postOpenSpace,
            envelopeType: parsedEnvelope.envelopeType,
            postEnvelopeTypeSpace: parsedEnvelope.postEnvelopeTypeSpace,
            bracket: parsedEnvelope.bracket,
         });
      });

   });

});
