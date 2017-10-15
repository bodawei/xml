/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as cdata from './cdata.js';

describe('cdata (integration)', () => {
   let emd;
   let source;
   let parsedEnvelope;
   let parsedCdata;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();

      emd = new EntityMetaData();
      source = new LTokenSource(defaultExtractors, emd);

      parsedEnvelope = {
         open: expectedLToken('<!['),
         postOpenSpace: undefined,
         envelopeType: expectedLToken('CDATA'),
         postEnvelopeTypeSpace: undefined,
         bracket: expectedLToken('['),
      };
      parsedCdata = {
         type: 'CDATA',
         text: expectedLToken('some text<foo>'),
         close: expectedLToken(']]>'),
      };
   });

   describe('parse()', () => {

      // commented out due to 97 bug with range in cdata integration
      xit('parses up to the ]]>', (done) => {
         source.addText('some text<foo>]]>other', new Range(new EntityLocation(), 9, 0, 9));

         cdata.parse(source, parsedEnvelope, (result) => {
            parsedEnvelope.type = parsedCdata.type;
            parsedEnvelope.text = parsedCdata.text;
            parsedEnvelope.close = parsedCdata.close;
            expect(result).toEqual(parsedEnvelope);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports an error a bad character is in the text (checks misc.checkWellFormedText())', (done) => {
         source.addText('bad\u0000&]]>');
         source.endText();

         cdata.parse(source, parsedEnvelope, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            cdata.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error a bad character is in the text (checks envelope.checkWellFormed())', (done) => {
         parsedEnvelope.envelopeType.text = 'CD\u0000ATA';
         source.addText('goodStuff]]>');
         source.endText();

         cdata.parse(source, parsedEnvelope, (parsed) => {
            const ec = new ErrorCollector(parsed.open, WellFormedError);

            cdata.checkWellFormed(parsed, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
