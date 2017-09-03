/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, ErrorCollector } from '../basic';
import { WellFormedError } from '../error';
import { LTokenSource, defaultExtractors } from '../lToken';

import * as externalId from './externalId.js';

describe('externalId (integration)', () => {

   describe('checkWellFormed()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('reports an error when the SYSTEM value has bad text (check misc.checkWellFormedText())', (done) => {
         source.addText('SYSTEM "bad\u0000" ');
         externalId.parse(source, [], (result) => {
            const ec = new ErrorCollector({}, WellFormedError);

            externalId.checkWellFormed(result, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
