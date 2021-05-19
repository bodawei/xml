/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ValidityError } from '../ValidityError';

describe('ValidityCheckError', () => {
   describe('class values', () => {
      it('populates the ID property', () => {
         expect(ValidityError.ID.ELEMENT_MISMATCH_ROOT_TYPE).toEqual('ELEMENT_MISMATCH_ROOT_TYPE');
      });
   });

   describe('construction', () => {
      it('throws no error when constructed', () => {
         expect(() => {
            new ValidityError(ValidityError.ID.ELEMENT_MISMATCH_ROOT_TYPE);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new ValidityError('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('sets the id', () => {
         expect(new ValidityError(ValidityError.ID.ELEMENT_MISMATCH_ROOT_TYPE).id).toEqual(
            ValidityError.ID.ELEMENT_MISMATCH_ROOT_TYPE,
         );
      });

      it('sets the code', () => {
         expect(new ValidityError(ValidityError.ID.ELEMENT_MISMATCH_ROOT_TYPE).code).toEqual(10001);
      });

      it('sets the message', () => {
         expect(new ValidityError(ValidityError.ID.ELEMENT_MISMATCH_ROOT_TYPE).message).toEqual(
            'The name of the root element must match the type "{0}" in the document type declaration (§2.8.0). Found "{1}".',
         );
      });
   });
});
