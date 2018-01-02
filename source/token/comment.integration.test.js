/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { defaultExtractors } from '../extractor';
import { STokenSource } from '../sToken';
import { makeSTokenMaker } from '../sToken/@test/helper';

import * as comment from './comment.js';

describe('comment (integration)', () => {
   let commentPToken;
   let emd;
   let expectedSToken;

   beforeEach(() => {
      expectedSToken = makeSTokenMaker();
      emd = new EntityMetaData();
      commentPToken = {
         type: 'COMMENT',
         text: [ expectedSToken('my comment') ],
         close: expectedSToken('-->'),
      };

      commentPToken.open = expectedSToken('<!--');
   });

   describe('parse()', () => {

      it('produces a full PToken result', (done) => {
         const source = new STokenSource(defaultExtractors, emd);
         source.addText('my comment-->');
         source.endText();

         comment.parse(source, commentPToken.open, (parsing) => {
            expect(parsing).toEqual(commentPToken);
            done();
         });
      });

      it('parses a comment with double hyphens in it that ends early', (done) => {
         const source = new STokenSource(defaultExtractors, emd);
         const expectedSToken = makeSTokenMaker();
         const pToken = {
            type: 'COMMENT',
            open: commentPToken.open,
            text: [
               expectedSToken('my '),
               expectedSToken('--'),
               expectedSToken('comment'),
               expectedSToken('--'),
            ],
            close: undefined,
         };
         source.addText('my --comment--');
         source.endText();

         comment.parse(source, pToken.open, (parsing) => {
            expect(parsing).toEqual(pToken);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports on invalid characters in the comment', (done) => {
         const source = new STokenSource(defaultExtractors, emd);
         source.addText('x\u0000y-->');
         source.endText();

         comment.parse(source, commentPToken.open, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            comment.checkWellFormed(parsing, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
