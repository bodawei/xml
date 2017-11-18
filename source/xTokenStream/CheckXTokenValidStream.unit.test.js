/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ValidityError } from '../error';
import {
   docTypeStart,
   elementStart,
   notationDeclaration,
   xmlDeclaration,
} from '../token';

import CheckXTokenValidStream from './CheckXTokenValidStream.js';

describe('CheckXTokenValidStream (unit)', () => {
   let validator;

   beforeEach(() => {
      validator = new CheckXTokenValidStream();
   });

   describe('_transform', () => {

      beforeEach(() => {
      });

      it('passes initial tokens through', () => {
         const xmlDecl = new xmlDeclaration.XToken([], []);
         validator.write(xmlDecl);

         expect(validator.read()).toEqual(xmlDecl);
      });

      it('stops passing through when encountering a docTypeStart', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);
         validator.write(dtStart);

         expect(validator.read()).toEqual(null);
      });

      it('resumes passing through when encountering an elementStart after docTypeStart', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);
         const elStart = new elementStart.XToken('foo', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(dtStart);
         expect(validator.read()).toEqual(elStart);
      });

      it('resumes passing through if end of stream reached', () => {
         const dtStart = new docTypeStart.XToken('foo', undefined, false, []);

         validator.write(dtStart);
         validator.end();

         expect(validator.read()).toEqual(dtStart);
      });

      it('adds an error if the DOCTYPE name and the element start name do not match', () => {
         const dtStart = new docTypeStart.XToken('docTypeName', undefined, false, []);
         const elStart = new elementStart.XToken('elementName', undefined, []);

         validator.write(dtStart);
         validator.write(elStart);

         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE,
            [ 'docTypeName', 'elementName' ]));
         expect(validator.read()).toEqual(dtStart);
      });

      it('adds an error if the NOTATION name shows up more than once', () => {
         const nOne = new notationDeclaration.XToken('one', undefined, []);
         const nTwo = new notationDeclaration.XToken('one', undefined, []);

         validator.write(nOne);
         validator.write(nTwo);

         expect(validator.read()).toEqual(nOne);
         expect(validator.read()).toEqual(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ 'one' ]));
         expect(validator.read()).toEqual(nTwo);
      });

   });

});
