/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import nameList, {
   NameListPToken,
   NamePToken,
} from '../nameList';

describe('nameList (integration)', () => {
   let nlPToken: NameListPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      nlPToken = new nameList.PToken({
         open: makeSToken('('),
         postOpenSpace: makeSToken(' '),
         names: [ {
            particle: {
               name: makeSToken('one'),
               postNameSpace: undefined,
               repeat: makeSToken('+'),
               postRepeatSpace: makeSToken(' '),
            },
            delimiter: makeSToken('|'),
            postDelimiterSpace: makeSToken(' '),
         }, {
            particle: {
               name: makeSToken('two'),
               postNameSpace: undefined,
               repeat: undefined,
               postRepeatSpace: undefined,
            },
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
         source.addText('( one+ | two)* ');
         source.endText();

         nameList.parse(source, (result) => {
            expect(result).toEqual(nlPToken);
            done();
         });
      });

      it('parses name list with a PE Ref in it', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one+ | %fred;');
         source.endText();

         nameList.parse(source, (result) => {
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
         source.addText('( one+ | ( ( two | three)+ , four)? | five)');
         source.endText();

         nameList.parse(source, (result) => {
            const listSubOne = result!.names[1].particle as NameListPToken;
            const listSubOneSubZero = listSubOne!.names[0].particle as NameListPToken;
            const listSubOneSubZeroSubZero = listSubOneSubZero.names[0].particle as NamePToken;
            expect(listSubOne!.repeat!.str).toEqual('?');
            expect(listSubOneSubZero.repeat!.str).toEqual('+');
            expect(listSubOneSubZeroSubZero.name!.str).toEqual('two');
            done();
         });
      });

   });

});
