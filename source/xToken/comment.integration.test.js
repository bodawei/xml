/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { ErrorCollector, WellFormedError } from '../error';
import { defaultExtractors, LTokenSource } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as comment from './comment.js';

describe('comment (integration)', () => {
   let defaultParsed;
   let emd;
   let expectedLToken;

   beforeEach(() => {
      expectedLToken = makeLTokenMaker();
      emd = new EntityMetaData();
      defaultParsed = {
         type: 'COMMENT',
         text: [ expectedLToken('my comment') ],
         close: expectedLToken('-->'),
      };

      defaultParsed.open = expectedLToken('<!--');
   });

   describe('parse()', () => {

      it('produces a full parsed result', (done) => {
         const source = new LTokenSource(defaultExtractors, emd);
         source.addText('my comment-->');
         source.endText();

         comment.parse(source, defaultParsed.open, (parsing) => {
            expect(parsing).toEqual(defaultParsed);
            done();
         });
      });

      it('parses a comment with double hyphens in it that ends early', (done) => {
         const source = new LTokenSource(defaultExtractors, emd);
         const expectedLToken = makeLTokenMaker();
         const localParsed = {
            type: 'COMMENT',
            open: defaultParsed.open,
            text: [
               expectedLToken('my '),
               expectedLToken('--'),
               expectedLToken('comment'),
               expectedLToken('--'),
            ],
            close: undefined,
         };
         source.addText('my --comment--');
         source.endText();

         comment.parse(source, localParsed.open, (parsing) => {
            expect(parsing).toEqual(localParsed);
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {

      it('reports on invalid characters in the comment', (done) => {
         const source = new LTokenSource(defaultExtractors, emd);
         source.addText('x\u0000y-->');
         source.endText();

         comment.parse(source, defaultParsed.open, (parsing) => {
            const ec = new ErrorCollector(undefined, WellFormedError);

            comment.checkWellFormed(parsing, ec, emd);

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

   });

});
