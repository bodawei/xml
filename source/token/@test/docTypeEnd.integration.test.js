/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import * as docTypeEnd from '../docTypeEnd.js';

describe('docTypeStart (integration)', () => {
   let docTypeEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      docTypeEndPToken = {
         type: 'DOCTYPE_END',
         closeInternalSubset: makeSToken(']'),
         postCloseInternalSubsetSpace: makeSToken('\t'),
         close: makeSToken('>'),
      };
   });

   describe('parse()', () => {

      it('produces a full PToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText(']\t>');
         source.endText();

         docTypeEnd.parse(source, (parsing) => {
            expect(parsing).toEqual(docTypeEndPToken);
            done();
         });
      });

   });

});
