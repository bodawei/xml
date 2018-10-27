/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   InternalSubsetStartXToken,
   INTERNAL_SUBSET_START_XTOKEN,
} from '../internalSubsetStart';

describe('InternalSubsetStart (unit)', () => {

   describe('InternalSubsetStartXToken', () => {

      it('has a type property', () => {
         const token = new InternalSubsetStartXToken();

         expect(token).toEqualShape({
            type: INTERNAL_SUBSET_START_XTOKEN,
         });
      });

   });

   describe('INTERNAL_SUBSET_START_XTOKEN', () => {

      it('has a value', () => {
         expect(INTERNAL_SUBSET_START_XTOKEN).toEqual('INTERNAL_SUBSET_START_XTOKEN');
      });

   });
});
