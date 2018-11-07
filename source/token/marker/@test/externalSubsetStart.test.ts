/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   ExternalSubsetStartXToken,
   EXTERNAL_SUBSET_START_XTOKEN,
} from '../externalSubsetStart';

describe('ExternalSubsetStart (unit)', () => {

   describe('ExternalSubsetStartXToken', () => {

      it('has a type property', () => {
         const token = new ExternalSubsetStartXToken();

         expect(token).toEqualShape({
            type: EXTERNAL_SUBSET_START_XTOKEN,
         });
      });

   });

   describe('INTERNAL_SUBSET_START_XTOKEN', () => {

      it('has a value', () => {
         expect(EXTERNAL_SUBSET_START_XTOKEN).toEqual('EXTERNAL_SUBSET_START_XTOKEN');
      });

   });
});
