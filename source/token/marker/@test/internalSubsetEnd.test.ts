/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   InternalSubsetEndToken,
   INTERNAL_SUBSET_END_TOKEN,
} from '../internalSubsetEnd';

describe('internalSubsetEnd (unit)', () => {

   describe('InternalSubsetEndToken', () => {

      it('has only a type property', () => {
         const token = new InternalSubsetEndToken();

         expect(token).toEqualShape({
            type: INTERNAL_SUBSET_END_TOKEN,
         });
      });

   });

   describe('INTERNAL_SUBSET_START_TOKEN', () => {

      it('has a value', () => {
         expect(INTERNAL_SUBSET_END_TOKEN).toEqual('INTERNAL_SUBSET_END_TOKEN');
      });

   });
});
