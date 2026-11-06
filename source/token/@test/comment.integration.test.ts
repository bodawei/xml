/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken, STokenSource } from 'basic';
import { makeSTokenMaker } from 'pToken-test';

import { CommentPToken, parseComment } from '../comment';

describe('comment (integration)', () => {
   let commentPToken: CommentPToken;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      const expectedSToken = makeSTokenMaker();
      commentPToken = new CommentPToken({
         open: toSToken(''),
         text: [ expectedSToken('my comment') ],
         close: expectedSToken('-->'),
      });
      (commentPToken as any).open = expectedSToken('<!--');
   });

   describe('parse()', () => {

      it('produces a full PToken result', (done) => {
         const source = new STokenSource();
         source.addText('my comment-->');
         source.endText();

         parseComment(source, commentPToken.open, (parsing) => {
            expect(parsing).toEqual(commentPToken);
            done();
         });
      });

      it('parses a comment with double hyphens in it that ends early', (done) => {
         const source = new STokenSource();
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

});
