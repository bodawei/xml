/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { XmlWarning } from '../XmlWarning';

describe('XmlWarning', () => {

   describe('class values', () => {

      it('populates the ID property', () => {
         expect(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).toEqual('ELEMENT_NAME_XML_RESERVED');
      });

   });

   describe('construction', () => {

      it('throws no error when constructed', () => {
         expect(() => {
            new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
         }).not.toThrow();
      });

      it('throws an error if the code is not a known one', () => {
         expect(() => {
            new XmlWarning('BOGUS');
         }).toThrowError('The Error id "BOGUS" is not a legal id.');
      });

      it('sets the the subtype', () => {
         const warning = new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);

         expect(warning.subtype).toEqual('WARNING');
      });

      it('sets the id', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).id)
            .toEqual(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      it('sets the code', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).code)
            .toEqual(3001);
      });

      it('sets the message', () => {
         expect(new XmlWarning(XmlWarning.ID.ELEMENT_NAME_XML_RESERVED).message)
            .toEqual('Element names should not start with [Xx][Mm][Ll]. Found "{0}".');
      });

   });

});
