/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, Offset } from '../basic';
import { ValidityError } from '../error';
import { ParsedStream } from '../parse';
import { TokenStream } from '../tokenize';

import ValidityStream from './ValidityStream.js';

describe('ValidityStream (integration)', () => {
   let validator;
   let parser;

   beforeEach(() => {
      parser = new ParsedStream();
      const tokenizer = new TokenStream();
      validator = new ValidityStream();
      parser.pipe(tokenizer).pipe(validator);
   });

   it('reports an error when the DOCTYPE and first element do not match', (done) => {
      const results = [];
      validator.on('data', result => results.push(result));
      validator.on('end', () => {
         expect(results[2]).toEqual(new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ 'one', 'two' ],
            new Offset(new EntityLocation(), 23, 0, 23), new Offset(new EntityLocation(), 21, 0, 21)));
         done();
      });

      parser.addText('<?xml version="1.0"?><!DOCTYPE one><two></two>');
      parser.endText();
   });

});
