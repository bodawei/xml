/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const WellFormednessError = require('./WellFormednessError.js');

describe('WellFormednessError', () => {

   describe('class values', () => {

      it('populates the ID property', () => {
         expect(WellFormednessError.ID.ELEMENT_UNBALANCED).toEqual('ELEMENT_UNBALANCED');
      });

   });

   describe('construction', () => {

      it('throws no error when constructed', () => {
         expect(() => {
            new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new WellFormednessError('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('sets the id', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED).id)
            .toEqual(WellFormednessError.ID.ELEMENT_UNBALANCED);
      });

      it('sets the code', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED).code)
            .toEqual(1501);
      });

      it('sets the message', () => {
         expect(new WellFormednessError(WellFormednessError.ID.ELEMENT_UNBALANCED).message)
            .toEqual('Expected end tag "{0}". Found "{1}".');
      });

   });

});
