/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   InternalSubsetStartToken,
   INTERNAL_SUBSET_START_TOKEN,
} from '../internalSubsetStart';

describe('InternalSubsetStart (unit)', () => {

   describe('InternalSubsetStartToken', () => {

      it('has a type property', () => {
         const token = new InternalSubsetStartToken();

         expect(token).toEqualShape({
            type: INTERNAL_SUBSET_START_TOKEN,
         });
      });

   });

   describe('INTERNAL_SUBSET_START_TOKEN', () => {

      it('has a value', () => {
         expect(INTERNAL_SUBSET_START_TOKEN).toEqual('INTERNAL_SUBSET_START_TOKEN');
      });

   });
});
