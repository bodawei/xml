/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityId, Offset } from 'basic';
import { gatherStreamResults } from 'basic-test';
import { ValidityError, } from 'valid';
import { PTokenStream } from '../../pTokenStream';
import { EntityExpanderStream } from '../../nodeStream/EntityExpanderStream';

import CheckXTokenValidStream from '../CheckXTokenValidStream';
import PToXTokenStream from '../PToXTokenStream';
import { STokenSource } from 'sToken';

describe('CheckXTokenValidStream (integration)', () => {
   let validator: CheckXTokenValidStream;
   let parser: PTokenStream;
   let replacer: EntityExpanderStream;


   function expectStream(validator: CheckXTokenValidStream, expected: any, done: () => void) {
      gatherStreamResults<any>(validator, (tokens) => {
         (expect(tokens) as any).toHaveError(expected); // typeHack
         done();
      });
   }

   beforeEach(() => {
      const tokenizer = new PToXTokenStream();

      parser = new PTokenStream(new STokenSource());
      validator = new CheckXTokenValidStream();
      replacer = new EntityExpanderStream(true);
      (parser as any).pipe(replacer).pipe(tokenizer).pipe(validator); // typeHack
   });

   it('reports an error when the DOCTYPE and first element do not match', (done) => {
      const expected = new ValidityError(ValidityError.ID.MISMATCH_ROOT_ELEMENT_TYPE, ['one', 'two'],
         new Offset(new EntityId(), 23, 0, 23));

      parser.addText('<?xml version="1.0"?><!DOCTYPE one><two></two>');
      parser.endText();

      expectStream(validator, expected, done);
   });

   it('reports an error when the NOTATION is added twice', (done) => {
      const error = new ValidityError(ValidityError.ID.NOTATION_NOT_UNIQUE, ['one'],
         new Offset(new EntityId(), 70, 0, 70));

      parser.addText('<?xml version="1.0"?><!DOCTYPE one [<!NOTATION one SYSTEM "-//test">' +
         '<!NOTATION one SYSTEM "-//foo">]>');
      parser.endText();

      expectStream(validator, error, done);
   });

   describe('ATTLIST', () => {

      it('reports an error when the an IDREF is not a valid name', (done) => {
         const error = new ValidityError(ValidityError.ID.ATTLISTDECL_BAD_IDREF_DEFAULT, ['root', 'reference', '$good'],
            new Offset(new EntityId(), 118, 3, 17));

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
