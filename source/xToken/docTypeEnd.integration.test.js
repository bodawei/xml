/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { defaultExtractors, LTokenSource } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as docTypeEnd from './docTypeEnd.js';

describe('docTypeStart (integration)', () => {
   let parsedDocTypeEnd;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      parsedDocTypeEnd = {
         type: 'DOCTYPE_END',
         closeInternalSubset: expectedLToken(']'),
         postCloseInternalSubsetSpace: expectedLToken('\t'),
         close: expectedLToken('>'),
      };
   });

   describe('parse()', () => {

      it('produces a full parsed result', (done) => {
         const source = new LTokenSource(defaultExtractors, new EntityMetaData());
         source.addText(']\t>');
         source.endText();

         docTypeEnd.parse(source, (parsing) => {
            expect(parsing).toEqual(parsedDocTypeEnd);
            done();
         });
      });

   });

});
