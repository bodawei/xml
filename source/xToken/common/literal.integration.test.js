/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError, ErrorCollector } from '../../error';
import { defaultExtractors, LTokenSource } from '../../lToken';
import { makeLTokenMaker } from '../../lToken/test';

import * as entityReference from '../entityReference.js';
import * as literal from './literal.js';

describe('literal (integration)', () => {

   describe('parse()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('ignores PE and GE References if not told to attend to them', (done) => {
         const parsed = {};
         source.addText('"one%peref;two&geref;&geref2;three"');
         source.endText();

         literal.parse(source, {
            prefix: 'x',
            parsed: parsed,
         }, () => {
            const makeLToken = makeLTokenMaker();
            expect(parsed).toEqual({
               xOpenQuote: makeLToken('"'),
               xValue: [
                  makeLToken('one%peref;two&geref;&geref2;three'),
               ],
               xCloseQuote: makeLToken('"'),
            });
            done();
         });
      });

      it('parses PE and GE References when told to attend to them', (done) => {
         const parsed = {};
         source.addText('"one%peref;two&geref;&geref2;three"');
         source.endText();

         literal.parse(source, {
            prefix: 'x',
            parsed: parsed,
            peRef: true,
            geRef: true,
         }, () => {
            const makeLToken = makeLTokenMaker();
            expect(parsed).toEqual({
               xOpenQuote: makeLToken('"'),
               xValue: [
                  makeLToken('one'), {
                     type: entityReference.PARAM_TYPE,
                     open: makeLToken('%'),
                     postOpenSpace: undefined,
                     name: makeLToken('peref'),
                     postEntityNameSpace: undefined,
                     close: makeLToken(';'),
                  },
                  makeLToken('two'), {
                     type: entityReference.TYPE,
                     open: makeLToken('&'),
                     postOpenSpace: undefined,
                     name: makeLToken('geref'),
                     postEntityNameSpace: undefined,
                     close: makeLToken(';'),
                  }, {
                     type: entityReference.TYPE,
                     open: makeLToken('&'),
                     postOpenSpace: undefined,
                     name: makeLToken('geref2'),
                     postEntityNameSpace: undefined,
                     close: makeLToken(';'),
                  },
                  makeLToken('three'),
               ],
               xCloseQuote: makeLToken('"'),
            });
            done();
         });
      });

   });

   describe('checkWellFormed()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

      it('reports an error if the value has a bad character (misc.checkWellFormedText())', (done) => {
         const pToken = {};
         source.addText('"b\u0000d"');
         source.endText();
         literal.parse(source, {
            prefix: 'x',
            parsed: pToken,
         }, () => {
            const ec = new ErrorCollector({}, WellFormedError);

            literal.checkWellFormed('x', pToken, ec, emd, 'aType');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error if an entity reference is malformed', (done) => {
         const pToken = {};
         source.addText('"good& bad;"');
         source.endText();
         literal.parse(source, {
            prefix: 'x',
            parsed: pToken,
            geRef: true,
         }, () => {
            const ec = new ErrorCollector({}, WellFormedError);

            literal.checkWellFormed('x', pToken, ec, emd, 'aType');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.REFERENCE_XTRA_SPACE);
            done();
         });
      });

   });

});
