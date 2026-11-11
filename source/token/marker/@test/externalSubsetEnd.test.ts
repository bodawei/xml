/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { ExternalSubsetEndToken, EXTERNAL_SUBSET_END_TOKEN } from '../externalSubsetEnd';

describe('ExternalSubsetEnd (unit)', () => {
   describe('ExternalSubsetEndToken', () => {
      it('has only a type property', () => {
         const token = new ExternalSubsetEndToken();

         expect(token.type).toEqual(EXTERNAL_SUBSET_END_TOKEN);
      });
   });

   describe('INTERNAL_SUBSET_START_TOKEN', () => {
      it('has a value', () => {
         expect(EXTERNAL_SUBSET_END_TOKEN).toEqual('EXTERNAL_SUBSET_END_TOKEN');
      });
   });
});
