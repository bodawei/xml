/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Transform } from 'stream';

import { EntityLocation, EntityMetaData, Offset } from 'basic';
import { ValidityError, WellFormedError } from 'error';
import { PTokenStream } from '../../pTokenStream';
import { EntityExpanderStream } from '../../expand/index';

import CheckXTokenValidStream from '../CheckXTokenValidStream';
import PToXTokenStream from '../PToXTokenStream';

describe('CheckXTokenValidStream (integration)', () => {
   let validator: CheckXTokenValidStream;
   let parser: PTokenStream;
   let replacer: EntityExpanderStream;

   function gatherTokens(stream: Transform, cb: (tokens: any) => void) {
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
      const tokenizer = new PToXTokenStream();

      parser = new PTokenStream(new EntityMetaData());
      validator = new CheckXTokenValidStream();
      replacer = new EntityExpanderStream(true);
      (parser as any).pipe(replacer).pipe(tokenizer).pipe(validator); // typeHack
   });

   it('reports an error when the DOCTYPE and first element do not match', (done) => {
      const expected = new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, ['one', 'two'],
         new Offset(new EntityLocation(), 23, 0, 23));

      parser.addText('<?xml version="1.0"?><!DOCTYPE one><two></two>');
      parser.endText();

      expectStream(validator, expected, done);
   });

   it('reports an error when the NOTATION is added twice', (done) => {
      const error = new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, ['one'],
         new Offset(new EntityLocation(), 70, 0, 70));

      parser.addText('<?xml version="1.0"?><!DOCTYPE one [<!NOTATION one SYSTEM "-//test">' +
         '<!NOTATION one SYSTEM "-//foo">]>');
      parser.endText();

      expectStream(validator, error, done);
   });

   it('reports an error if a non-deterministic content model is found', (done) => {
      const error = new WellFormedError(WellFormedError.ID.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC,
         ['b (/1/1,/2/1)'], new Offset(new EntityLocation(), 100, 0, 100));

      parser.addText('<?xml version="1.0"?><!DOCTYPE one [');
      parser.addText('  <!ELEMENT a ANY > ');
      parser.addText('  <!ELEMENT b ANY > ');
      parser.addText('  <!ELEMENT c ANY > ');
      parser.addText('  <!ELEMENT one ((b , a) | ( b, c)) > ');
      parser.addText(']>');
      parser.addText('<one>');
      parser.addText('</one>');
      parser.endText();

      expectStream(validator, error, done);
   });

   it('reports an error when the an element type appears at an invalid place in the content', (done) => {
      const error = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, ['one', 'two'],
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
      const error = new ValidityError(ValidityError.ID.INVALID_ELEMENT_IN_CONTENT, ['three', 'one'],
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

      it('reports an error when the an IDREF is not a valid name', (done) => {
         const error = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_IDREF_DEFAULT, ['root', 'reference', '$good'],
            new Offset(new EntityLocation(), 118, 3, 17));

         parser.addText(`<?xml version="1.0"?><!DOCTYPE root [
            <!ENTITY bad "$">
            <!ELEMENT root ANY >
               <!ATTLIST root
                  reference IDREF "&bad;good"
               >
            ]>
            <root>
            </root>`);
         parser.endText();

         expectStream(validator, error, done);
      });

   });
});
