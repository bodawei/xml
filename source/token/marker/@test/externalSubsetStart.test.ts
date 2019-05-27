/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   ExternalSubsetStartToken,
   EXTERNAL_SUBSET_START_TOKEN,
} from '../externalSubsetStart';

describe('ExternalSubsetStart (unit)', () => {

   describe('ExternalSubsetStartToken', () => {

      it('has a type property', () => {
         const token = new ExternalSubsetStartToken();

         expect(token).toEqualShape({
            type: EXTERNAL_SUBSET_START_TOKEN,
         });
      });

   });

   describe('INTERNAL_SUBSET_START_TOKEN', () => {

      it('has a value', () => {
         expect(EXTERNAL_SUBSET_START_TOKEN).toEqual('EXTERNAL_SUBSET_START_TOKEN');
      });

   });
});
