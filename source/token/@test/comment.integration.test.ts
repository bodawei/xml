/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { CommentPToken, parseComment } from '../comment';

describe('comment (integration)', () => {
   let commentPToken: CommentPToken;
   let emd: EntityMetaData;

   beforeEach(() => {
      emd = new EntityMetaData();
      const expectedSToken = makeSTokenMaker();
      commentPToken = new CommentPToken({
         open: SToken.fromString(''),
         text: [ expectedSToken('my comment') ],
         close: expectedSToken('-->'),
      });
      (commentPToken as any).open = expectedSToken('<!--');
   });

   describe('parse()', () => {

      it('produces a full PToken result', (done) => {
         const source = new STokenSource(defaultExtractors, emd);
         source.addText('my comment-->');
         source.endText();

         parseComment(source, commentPToken.open, (parsing) => {
            expect(parsing).toEqual(commentPToken);
            done();
         });
      });

      it('parses a comment with double hyphens in it that ends early', (done) => {
         const source = new STokenSource(defaultExtractors, emd);
         const expectedSToken = makeSTokenMaker();
         const pToken = new CommentPToken({
            open: commentPToken.open,
            text: [
               expectedSToken('my '),
               expectedSToken('--'),
               expectedSToken('comment'),
               expectedSToken('--'),
            ],
            close: undefined,
         });
         source.addText('my --comment--');
         source.endText();

         parseComment(source, pToken.open, (parsing) => {
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

         parseComment(source, commentPToken.open, (parsing) => {
            const ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);

            parsing.checkWellFormed(ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
