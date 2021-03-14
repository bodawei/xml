/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { XmlError } from '../XmlError';

describe('XmlError', () => {
   describe('class values', () => {
      it('populates the ID property', () => {
         expect(XmlError.ID.TEST).toEqual('TEST');
      });
   });

   describe('construction', () => {
      it('throws no error when constructed', () => {
         expect(() => {
            new XmlError(XmlError.ID.TEST);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new XmlError('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('sets the id', () => {
         expect(new XmlError(XmlError.ID.TEST).id).toEqual(XmlError.ID.TEST);
      });

      it('sets the code', () => {
         expect(new XmlError(XmlError.ID.TEST).code).toEqual(100);
      });

      it('sets the message', () => {
         expect(new XmlError(XmlError.ID.TEST).message).toEqual('Test {0}.');
      });
   });
});
