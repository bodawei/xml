/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import { makeSTokenMaker, STokenMaker } from 'sToken-test';

import { ParameterEntityReferencePToken } from '../../parameterEntityReference';
import unassigned from '../unassigned';
import { TextPToken } from '../../text';

describe('unassigned (integration)', () => {
   let source: STokenSource;
   let makeSToken: STokenMaker;

   beforeEach(() => {
      source = new STokenSource(defaultExtractors);
      makeSToken = makeSTokenMaker();
   });

   describe('checkForPERef()', () => {

      it('returns nothing when there is no parameter entity reference', (done) => {
         source.addText('asdf');
         source.endText();

         unassigned.checkForPERef(source, (pieces) => {
            expect(pieces).toBeUndefined();
            done();
         });
      });

      it('returns an array of unassigned values when a param entity ref found', (done) => {
         source.addText('%peref; "double"whatever\'single\'%peref;>');
         source.endText();

         unassigned.checkForPERef(source, (pieces) => {
            expect(pieces).toEqual([{
               type: 'reference',
               token: new ParameterEntityReferencePToken({
                  open: makeSToken('%'),
                  openSpace: undefined,
                  name: makeSToken('peref'),
                  nameSpace: undefined,
                  close: makeSToken(';'),
               }),
            },
            unassigned.spaceFromSToken(makeSToken(' ')),
            {
               type: 'literal',
               token: {
                  openQuote: makeSToken('"'),
                  value: [ new TextPToken({ text: makeSToken('double') }) ],
                  closeQuote: makeSToken('"'),
               }
            },
            unassigned.wordFromSToken(makeSToken('whatever')),
            {
               type: 'literal',
               token: {
                  openQuote: makeSToken('\''),
                  value: [ new TextPToken({ text: makeSToken('single') }) ],
                  closeQuote: makeSToken('\''),
               },
            }, {
               type: 'reference',
               token: new ParameterEntityReferencePToken({
                  open: makeSToken('%'),
                  openSpace: undefined,
                  name: makeSToken('peref'),
                  nameSpace: undefined,
                  close: makeSToken(';'),
               }),
            }
         ] as any);
            done();
         });
      });

   });

   describe('parseNextValue()', () => {

      it('delivers an undefined value', (done) => {
         source.addText('%peref; "double"whatever\'single\'%peref;>');
         source.endText();

         unassigned.parseNextValue(source, false, (value) => {
            expect(value).toEqual({
               type: 'reference',
               token: new ParameterEntityReferencePToken({
                  open: makeSToken('%'),
                  openSpace: undefined,
                  name: makeSToken('peref'),
                  nameSpace: undefined,
                  close: makeSToken(';'),
               },
            )} as any);
            done();
         });
      });

   });

});
