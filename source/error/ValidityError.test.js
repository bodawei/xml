/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import ValidityError from './ValidityError.js';

describe('ValidityCheckError', () => {

   describe('class values', () => {

      it('populates the ID property', () => {
         expect(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE).toEqual('MISMATCH_ROOT_ELEMENT_TYPE');
      });

   });

   describe('construction', () => {

      it('throws no error when constructed', () => {
         expect(() => {
            new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new ValidityError('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('sets the id', () => {
         expect(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE).id)
            .toEqual(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE);
      });

      it('sets the code', () => {
         expect(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE).code)
            .toEqual(10001);
      });

      it('sets the message', () => {
         expect(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE).message)
            .toEqual('The name ("{0}") in the document type declaration must match the ' +
               'element type of the root element. Found ("{1}").');
      });

   });

});
