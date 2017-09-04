/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ValidityError } from '../error';
import {
   docTypeStart,
   elementStart,
   xmlDeclaration,
} from '../xToken';

import ValidityStream from './ValidityStream.js';

describe('ValidityStream (unit)', () => {
   let validator;

   beforeEach(() => {
      validator = new ValidityStream();
   });

   describe('_transform', () => {

      beforeEach(() => {
      });

      it('passes initial tokens through', () => {
         const xmlDecl = new xmlDeclaration.Token([], []);
         validator.write(xmlDecl);

         expect(validator.read()).toEqual(xmlDecl);
      });

      it('stops passing through when encountering a docTypeStart', () => {
         const dtStart = new docTypeStart.Token('foo', undefined, false, []);
         validator.write(dtStart);

         expect(validator.read()).toEqual(null);
      });

      it('resumes passing through when encountering an elementStart after docTypeStart', () => {
         const dtStart = new docTypeStart.Token('foo', undefined, false, []);
         const elStart = new elementStart.Token('foo', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart);
         expect(validator.read()).toEqual(elStart);
      });

      it('adds an error if the DOCTYPE name and the element start name do not match', () => {
         const dtStart = new docTypeStart.Token('docTypeName', undefined, false, []);
         const elStart = new elementStart.Token('elementName', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
            [ 'docTypeName', 'elementName' ]));
         expect(validator.read()).toEqual(dtStart);
      });

   });

});
