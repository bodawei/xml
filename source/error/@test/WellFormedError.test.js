/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import WellFormedError from '../WellFormedError.js';

describe('WellFormedError', () => {

   describe('class values', () => {

      it('populates the ID property', () => {
         expect(WellFormedError.ID.XMLDECL_NO_CLOSE).toEqual('XMLDECL_NO_CLOSE');
      });

   });

   describe('construction', () => {

      it('throws no error when constructed', () => {
         expect(() => {
            new WellFormedError(WellFormedError.ID.XMLDECL_NO_CLOSE);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new WellFormedError('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('sets the id', () => {
         expect(new WellFormedError(WellFormedError.ID.XMLDECL_NO_CLOSE).id)
            .toEqual(WellFormedError.ID.XMLDECL_NO_CLOSE);
      });

      it('sets the code', () => {
         expect(new WellFormedError(WellFormedError.ID.XMLDECL_NO_CLOSE).code)
            .toEqual(1102);
      });

      it('sets the message', () => {
         expect(new WellFormedError(WellFormedError.ID.XMLDECL_NO_CLOSE).message)
            .toEqual('Missing closing "?>" in an XML or Text Declaration.');
      });

   });

});
