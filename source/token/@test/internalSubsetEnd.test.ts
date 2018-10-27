/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   InternalSubsetEndXToken,
   INTERNAL_SUBSET_END_XTOKEN,
} from '../internalSubsetEnd';

describe('internalSubsetEnd (unit)', () => {

   describe('InternalSubsetEndXToken', () => {

      it('has only a type property', () => {
         const token = new InternalSubsetEndXToken();

         expect(token).toEqualShape({
            type: INTERNAL_SUBSET_END_XTOKEN,
         });
      });

   });

   describe('INTERNAL_SUBSET_START_XTOKEN', () => {

      it('has a value', () => {
         expect(INTERNAL_SUBSET_END_XTOKEN).toEqual('INTERNAL_SUBSET_END_XTOKEN');
      });

   });
});
