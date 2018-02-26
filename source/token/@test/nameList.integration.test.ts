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
            delimiter: makeSToken('|'),
            postDelimiterSpace: makeSToken(' '),
         }, {
            name: makeSToken('two'),
            postNameSpace: undefined,
            delimiter: undefined,
            postDelimiterSpace: undefined,
         }],
         close: makeSToken(')'),
         postCloseSpace: undefined,
         repeat: makeSToken('*'),
         postRepeatSpace: makeSToken(' '),
      });
   });

   describe('parse()', () => {

      it('parses name list', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one | two)* ');
         source.endText();

         nameList.parse(source, 'ANY', (result) => {
            expect(result).toEqual(nlPToken);
            done();
         });
      });

      it('parses name list with a PE Ref in it', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one | %fred;');
         source.endText();

         nameList.parse(source, 'ANY', (result) => {
            nlPToken.names.pop();
            nlPToken.close = undefined;
            nlPToken.postCloseSpace = undefined;
            nlPToken.repeat = undefined;
            nlPToken.postRepeatSpace = undefined;

            expect(result).toEqual(nlPToken);
            done();
         });
      });

      it('parses a nested name list with various delimiters', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one | ( ( two | three)+ , four)? | five)');
         source.endText();

         nameList.parse(source, 'ANY', (result) => {
            expect(result.names[1].list.names[0].list.repeat.str).toEqual('+');
            expect(result.names[1].list.repeat.str).toEqual('?');
            expect(result.names[1].list.names[0].list.names[0].name.str).toEqual('two');
            done();
         });
      });

   });

});
