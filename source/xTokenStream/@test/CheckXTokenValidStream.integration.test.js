/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Offset } from '../../basic';
import { ValidityError } from '../../error';
import { PTokenStream } from '../../pTokenStream';

import CheckXTokenValidStream from '../CheckXTokenValidStream';
import PToXTokenStream from '../PToXTokenStream';

describe('CheckXTokenValidStream (integration)', () => {
   let validator;
   let parser;

   beforeEach(() => {
      parser = new PTokenStream();
      const tokenizer = new PToXTokenStream();
      validator = new CheckXTokenValidStream();
      parser.pipe(tokenizer).pipe(validator);
   });

   it('reports an error when the DOCTYPE and first element do not match', (done) => {
      const results = [];
      validator.on('data', result => results.push(result));
      validator.on('end', () => {
         expect(results[4]).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ 'one', 'two' ],
            new Offset(new EntityLocation(), 23, 0, 23)));
         done();
      });

      parser.addText('<?xml version="1.0"?><!DOCTYPE one><two></two>');
      parser.endText();
   });

   it('reports an error when the NOTATION is added twice', (done) => {
      const results = [];
      validator.on('data', result => results.push(result));
      validator.on('end', () => {
         expect(results[4]).toEqual(new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ 'one' ],
            new Offset(new EntityLocation(), 70, 0, 70)));
         done();
      });

      parser.addText('<?xml version="1.0"?><!DOCTYPE one [<!NOTATION one SYSTEM "-//test">' +
         '<!NOTATION one SYSTEM "-//foo">]>');
      parser.endText();
   });

});
