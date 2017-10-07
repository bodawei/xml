/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { defaultExtractors, LTokenSource } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as envelope from './envelope.js';

describe('envelope (integration)', () => {
   let parsedEnvelope;

   beforeEach(() => {
      const sourceLToken = makeLTokenMaker();
      parsedEnvelope = {
         type: envelope.TYPE,
         postOpenSpace: sourceLToken(' '),
         envelopeType: sourceLToken('FOO'),
         postEnvelopeTypeSpace: sourceLToken(' '),
         bracket: sourceLToken('['),
      };
      parsedEnvelope.open = sourceLToken('<![');
   });

   describe('parse()', () => {

      it('produces a full parsed result', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText(' FOO [');
         source.endText();

         envelope.parse(source, parsedEnvelope.open, (parsing) => {
            expect(parsing).toEqual(parsedEnvelope);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports error if type has an invalid character type', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText('F\u0000xx[');
         source.endText();

         envelope.parse(source, parsedEnvelope.open, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            envelope.checkWellFormed(parsing, true, ec, new EntityMetaData());

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
