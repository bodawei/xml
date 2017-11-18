/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/test';

import * as envelope from './envelope.js';

describe('envelope (integration)', () => {
   let envelopePToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      envelopePToken = {
         type: envelope.PTYPE,
         postOpenSpace: makeSToken(' '),
         envelopeType: makeSToken('FOO'),
         postEnvelopeTypeSpace: makeSToken(' '),
         bracket: makeSToken('['),
      };
      envelopePToken.open = makeSToken('<![');
   });

   describe('parse()', () => {

      it('produces a full PToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText(' FOO [');
         source.endText();

         envelope.parse(source, envelopePToken.open, (parsing) => {
            expect(parsing).toEqual(envelopePToken);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports error if type has an invalid character type', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('F\u0000xx[');
         source.endText();

         envelope.parse(source, envelopePToken.open, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            envelope.checkWellFormed(parsing, true, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
