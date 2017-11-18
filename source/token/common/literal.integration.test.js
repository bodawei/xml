/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError, ErrorCollector } from '../../error';
import { defaultExtractors } from '../../extractor';
import { STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/test';

import * as entityReference from '../entityReference.js';
import * as literal from './literal.js';

describe('literal (integration)', () => {

   describe('parse()', () => {
      let emd;
      let source;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
      });

      it('ignores PE and GE References if not told to attend to them', (done) => {
         const pToken = {};
         source.addText('"one%peref;two&geref;&geref2;three"');
         source.endText();

         literal.parse(source, {
            pToken: pToken,
         }, () => {
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual({
               openQuote: makeSToken('"'),
               value: [
                  makeSToken('one%peref;two&geref;&geref2;three'),
               ],
               closeQuote: makeSToken('"'),
            });
            done();
         });
      });

      it('parses PE and GE References when told to attend to them', (done) => {
         const pToken = {};
         source.addText('"one%peref;two&geref;&geref2;three"');
         source.endText();

         literal.parse(source, {
            pToken: pToken,
            peRef: true,
            geRef: true,
         }, () => {
            const makeSToken = makeSTokenMaker();
            expect(pToken).toEqual({
               openQuote: makeSToken('"'),
               value: [
                  makeSToken('one'),
                  new entityReference.ParamPToken({
                     type: entityReference.PARAM_PTYPE,
                     open: makeSToken('%'),
                     postOpenSpace: undefined,
                     name: makeSToken('peref'),
                     postNameSpace: undefined,
                     close: makeSToken(';'),
                  }),
                  makeSToken('two'),
                  new entityReference.PToken({
                     open: makeSToken('&'),
                     postOpenSpace: undefined,
                     name: makeSToken('geref'),
                     postNameSpace: undefined,
                     close: makeSToken(';'),
                  }),
                  new entityReference.PToken({
                     open: makeSToken('&'),
                     postOpenSpace: undefined,
                     name: makeSToken('geref2'),
                     postNameSpace: undefined,
                     close: makeSToken(';'),
                  }),
                  makeSToken('three'),
               ],
               closeQuote: makeSToken('"'),
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
         source = new STokenSource(defaultExtractors, emd);
      });

      it('reports an error if the value has a bad character (misc.checkWellFormedText())', (done) => {
         const pToken = {};
         source.addText('"b\u0000d"');
         source.endText();
         literal.parse(source, {
            pToken: pToken,
         }, () => {
            const ec = new ErrorCollector({}, WellFormedError);

            literal.checkWellFormed(pToken, ec, emd, 'aType');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
            done();
         });
      });

      it('reports an error if an entity reference is malformed', (done) => {
         const pToken = {};
         source.addText('"good& bad;"');
         source.endText();
         literal.parse(source, {
            pToken: pToken,
            geRef: true,
         }, () => {
            const ec = new ErrorCollector({}, WellFormedError);

            literal.checkWellFormed(pToken, ec, emd, 'aType');

            expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.REFERENCE_XTRA_SPACE);
            done();
         });
      });

   });

});
