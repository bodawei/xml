/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import * as docTypeEnd from '../docTypeEnd';

describe('docTypeEnd (integration)', () => {
   let docTypeEndPToken: docTypeEnd.DocTypeEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      docTypeEndPToken = {
         type: 'DOCTYPE_END',
         closeInternalSubset: makeSToken(']'),
         postCloseInternalSubsetSpace: makeSToken('\t'),
         close: makeSToken('>'),
      } as any;
   });

   describe('parse()', () => {

      it('produces a full PToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText(']\t>');
         source.endText();

         docTypeEnd.parse(source, (parsing) => {
            expect(Object.assign({}, parsing)).toEqual(docTypeEndPToken);
            done();
         });
      });

   });

});
