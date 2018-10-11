/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic/index';
import { defaultExtractors } from '../../extractor/index';
import { STokenSource } from '../../sToken/index';
import { makeSTokenMaker } from '../../sToken/@test/helper';

import unassigned from '../unassigned';
import nameList, {
   ContentParticlePToken,
   NameListPToken,
   NamePToken,
} from '../common/nameList.js';

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

         nameList.parse(source, 'ANY', (result) => {
            expect(result).toEqual(nlPToken);
            done();
         });
      });

      it('parses name list with a PE Ref in it', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one+ | %fred;');
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
         source.addText('( one+ | ( ( two | three)+ , four)? | five)');
         source.endText();

         nameList.parse(source, 'ANY', (result) => {
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

   describe('assignUnassigned()', () => {

      it('fills in a simple list of names', (done) => {
         const makeSToken = makeSTokenMaker();
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         source.addText('( one+ | ( ( two | three)+ , four)? | five)');
         source.endText();

         unassigned.parseAllValues(source, true, (unassignedValues) => {
            const listToken = new nameList.NameListPToken();
            const expected = new nameList.NameListPToken();
            expected.open = makeSToken('(');
            expected.postOpenSpace = makeSToken(' ');
            const first: ContentParticlePToken = {
               particle: {
                  name: makeSToken('one'),
                  repeat: makeSToken('+'),
                  postRepeatSpace: makeSToken(' '),
               },
               delimiter: makeSToken('|'),
               postDelimiterSpace: makeSToken(' '),
            };
            expected.names.push(first);
            const secondParticle: NameListPToken = new nameList.NameListPToken({
               open: makeSToken('('),
               postOpenSpace: makeSToken(' '),
            });
            const second: ContentParticlePToken = {
               particle: secondParticle,
            };
            const secondAParticle: NameListPToken = new nameList.NameListPToken({
               open: makeSToken('('),
               postOpenSpace: makeSToken(' '),
            });
            const secondA: ContentParticlePToken = {
               particle: secondAParticle,
            };
            const secondAOne: ContentParticlePToken = {
               particle: {
                  name: makeSToken('two'),
                  postNameSpace: makeSToken(' '),
               },
               delimiter: makeSToken('|'),
               postDelimiterSpace: makeSToken(' '),
            };
            const secondATwo: ContentParticlePToken = {
               particle: {
                  name: makeSToken('three'),
               },
            };
            secondAParticle.names.push(secondAOne);
            secondAParticle.names.push(secondATwo);
            secondAParticle.close = makeSToken(')');
            secondA.particle!.repeat = makeSToken('+');
            secondA.particle!.postRepeatSpace = makeSToken(' ');
            secondA.delimiter = makeSToken(',');
            secondA.postDelimiterSpace = makeSToken(' ');
            const secondB: ContentParticlePToken = {
               particle: {
                  name: makeSToken('four'),
               },
            };
            secondParticle.names.push(secondA);
            secondParticle.names.push(secondB);
            secondParticle.close = makeSToken(')');
            second.particle!.repeat = makeSToken('?');
            second.particle!.postRepeatSpace = makeSToken(' ');
            second.delimiter = makeSToken('|');
            second.postDelimiterSpace = makeSToken(' ');
            expected.names.push(second);
            const third: ContentParticlePToken = {
               particle: {
                  name: makeSToken('five'),
               },
            };
            expected.names.push(third);
            expected.close = makeSToken(')');

            nameList.assignUnassigned(listToken, unassignedValues!);

            expect(listToken).toEqual(expected);
            done();
         });
      });

   });

});
