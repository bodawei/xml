/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import stream from 'readable-stream';

import { EntityLocation, Offset } from '../../basic';
import { ValidityError } from '../../error';
import { PTokenStream } from '../../pTokenStream';
import { EntityExpandingStream } from '../../expand';

import EntityManager from '../../expand/EntityManager.js';

import CheckXTokenValidStream from '../CheckXTokenValidStream';
import PToXTokenStream from '../PToXTokenStream';

describe('CheckXTokenValidStream (integration)', () => {
   let validator: CheckXTokenValidStream;
   let parser: PTokenStream;
   let replacer: EntityExpandingStream;

   function gatherTokens(stream: stream.Transform, cb: (tokens: any) => void) {
      const tokens: any = [];

      stream.on('data', (item: any) => {
         tokens.push(item);
      });
      stream.on('end', () => {
         cb(tokens);
      });
   }

   function expectStream(validator: CheckXTokenValidStream, expected: any, done: () => void) {
      gatherTokens(validator, (tokens) => {
         (expect(tokens) as any).toHaveError(expected); // typeHack
         done();
      });
   }

   beforeEach(() => {
      parser = new PTokenStream();
      const tokenizer = new PToXTokenStream();
      validator = new CheckXTokenValidStream(new EntityManager());
      replacer = new EntityExpandingStream(new EntityManager());
      (parser as any).pipe(tokenizer).pipe(replacer).pipe(validator); // typeHack
   });

   it('reports an error when the DOCTYPE and first element do not match', (done) => {
      const expected = new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, [ 'one', 'two' ],
         new Offset(new EntityLocation(), 23, 0, 23));

      parser.addText('<?xml version="1.0"?><!DOCTYPE one><two></two>');
      parser.endText();

      expectStream(validator, expected, done);
   });

   it('reports an error when the NOTATION is added twice', (done) => {
      const error = new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, [ 'one' ],
            new Offset(new EntityLocation(), 70, 0, 70));

      parser.addText('<?xml version="1.0"?><!DOCTYPE one [<!NOTATION one SYSTEM "-//test">' +
         '<!NOTATION one SYSTEM "-//foo">]>');
      parser.endText();

      expectStream(validator, error, done);
   });

   it('reports an error when the an element type appears at an invalid place in the content', (done) => {
      const error = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'one', 'two' ],
         new Offset(new EntityLocation(), 226, 0, 226));

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

      expectStream(validator, error, done);
   });

   it('reports an error when the an element type appears at an invalid place in child content', (done) => {
      const error = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'three', 'one' ],
         new Offset(new EntityLocation(), 243, 0, 243));

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

      expectStream(validator, error, done);
   });

   describe('ATTLIST', () => {

      xit('reports an error when the an IDREF is not a valid name', (done) => {
         const error = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, [ 'three', 'one' ],
            new Offset(new EntityLocation(), 243, 0, 243));
   
         parser.addText(`<?xml version="1.0"?><!DOCTYPE root [
            <!ENTITY bad "$">
            <!ELEMENT root ANY >
               <!ATTLIST root
                  reference IDREF "&bxxad;good"
               >
            ]>
            <root>
            </root>`);
         parser.endText();
   
         expectStream(validator, error, done);
      });
   
   });
});
