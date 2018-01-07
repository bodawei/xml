/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { ErrorCollector, WellFormedError } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import * as cdata from '../cdata.js';
import * as envelope from '../bridge/envelope.js';

describe('cdata (integration)', () => {
   let emd;
   let source;
   let envelopePToken;
   let cDataPToken;

   beforeEach(() => {
      const expectedSToken = makeSTokenMaker();

      emd = new EntityMetaData();
      source = new STokenSource(defaultExtractors, emd);

      envelopePToken = new envelope.PToken(undefined, {
         open: expectedSToken('<!['),
         postOpenSpace: undefined,
         envelopeType: expectedSToken('CDATA'),
         postEnvelopeTypeSpace: undefined,
         bracket: expectedSToken('['),
      });
      cDataPToken = {
         type: 'CDATA',
         text: expectedSToken('some text<foo>'),
         close: expectedSToken(']]>'),
      };
   });

   describe('parse()', () => {

      it('parses up to the ]]>', (done) => {
         const expected = new cdata.PToken(envelopePToken);
         expected.text = cDataPToken.text;
         expected.close = cDataPToken.close;
         source.addText('some text<foo>]]>other', new Range(new EntityLocation(), 9, 0, 9));

         cdata.parse(source, envelopePToken, (result) => {
            expect(result).toEqual(expected);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports an error a bad character is in the text (checks misc.checkWellFormedText())', (done) => {
         source.addText('bad\u0000&]]>');
         source.endText();

         cdata.parse(source, envelopePToken, (pToken) => {
            const ec = new ErrorCollector(pToken.open, WellFormedError);

            cdata.checkWellFormed(pToken, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error a bad character is in the text (checks envelope.checkWellFormed())', (done) => {
         envelopePToken.envelopeType.text = 'CD\u0000ATA';
         source.addText('goodStuff]]>');
         source.endText();

         cdata.parse(source, envelopePToken, (pToken) => {
            const ec = new ErrorCollector(pToken.open, WellFormedError);

            cdata.checkWellFormed(pToken, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
