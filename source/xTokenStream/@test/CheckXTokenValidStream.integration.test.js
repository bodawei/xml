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

   it('reports an error when the an element type appears at an invalid place in the content', (done) => {
      const results = [];
      validator.on('data', result => results.push(result));
      validator.on('end', () => {
         expect(results[25]).toEqual(new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'one', 'two' ],
            new Offset(new EntityLocation(), 226, 0, 226)));
         done();
      });

      parser.addText('<?xml version="1.0"?><!DOCTYPE one [');
      parser.addText('  <!ELEMENT two ANY >');
      parser.addText('  <!ELEMENT three ANY >');
      parser.addText('  <!ELEMENT four ANY >');
      parser.addText('  <!ELEMENT five ANY >');
      parser.addText('  <!ELEMENT one ( two+, ( three | four), five) > ');
      parser.addText(']>');
      parser.addText('<one>');
      parser.addText('  <two></two>');
      parser.addText('  <two></two>');
      parser.addText('  <three></three>');
      parser.addText('  <two></two>');
      parser.addText('  <five></five>');
      parser.addText('</one>');
      parser.endText();
   });

   it('reports an error when the an element type appears at an invalid place in child content', (done) => {
      const results = [];
      validator.on('data', result => results.push(result));
      validator.on('end', () => {
         expect(results[24]).toEqual(new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'three', 'one' ],
            new Offset(new EntityLocation(), 243, 0, 243)));
         done();
      });

      parser.addText('<?xml version="1.0"?><!DOCTYPE one [');
      parser.addText('  <!ELEMENT two ANY >');
      parser.addText('  <!ELEMENT four ANY >');
      parser.addText('  <!ELEMENT five ANY >');
      parser.addText('  <!ELEMENT three ( four+ | two | five)  >');
      parser.addText('  <!ELEMENT one ( two+, ( three | four), five) > ');
      parser.addText(']>');
      parser.addText('<one>');
      parser.addText('  <two></two>');
      parser.addText('  <three>');
      parser.addText('     <two></two>');
      parser.addText('     <one></one>');
      parser.addText('  </three>');
      parser.addText('  <five></five>');
      parser.addText('</one>');
      parser.endText();
   });

});
