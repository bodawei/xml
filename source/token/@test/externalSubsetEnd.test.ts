/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   ExternalSubsetEndXToken,
   EXTERNAL_SUBSET_END_XTOKEN,
} from '../externalSubsetEnd';

describe('ExternalSubsetEnd (unit)', () => {

   describe('ExternalSubsetEndXToken', () => {

      it('has only a type property', () => {
         const token = new ExternalSubsetEndXToken();

         expect(token).toEqualShape({
            type: EXTERNAL_SUBSET_END_XTOKEN,
         });
      });

   });

   describe('INTERNAL_SUBSET_START_XTOKEN', () => {

      it('has a value', () => {
         expect(EXTERNAL_SUBSET_END_XTOKEN).toEqual('EXTERNAL_SUBSET_END_XTOKEN');
      });

   });
});
