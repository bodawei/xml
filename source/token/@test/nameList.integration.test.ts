/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from '../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../error';
import { defaultExtractors } from '../../extractor';
import { SToken, STokenSource } from '../../sToken';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import nameList from '../common/nameList.js';

describe('nameList (integration)', () => {
   let nlPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      nlPToken = new nameList.PToken({
         open: makeSToken('('),
         postOpenSpace: makeSToken(' '),
         names: [ {
            name: makeSToken('one'),
            postNameSpace: makeSToken(' '),
            or: makeSToken('|'),
            postOrSpace: makeSToken(' '),
         }, {
            name: makeSToken('two'),
            postNameSpace: undefined,
            or: undefined,
            postOrSpace: undefined,
         }],
         close: makeSToken(')'),
      });
   });

   describe('parse()', () => {

      it('parses name list', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one | two)');
         source.endText();

         nameList.parse(source, (result) => {
            expect(result).toEqual(nlPToken);
            done();
         });
      });

      it('parses name list with a PE Ref in it', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one | %fred;');
         source.endText();

         nameList.parse(source, (result) => {
            nlPToken.names.pop();
            nlPToken.close = undefined;

            expect(result).toEqual(nlPToken);
            done();
         });
      });

   });

});
