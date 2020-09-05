/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { defaultExtractors } from 'extractor';
import { toSToken, STokenSource } from 'sToken';
import { ContentParticlePToken, NameListPToken, parseAllUnassignedValues } from 'token';

import { assignNameList } from '../assignNameList';

describe('assignNameList() (integration)', () => {
   it('fills in a simple list of names', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('( one+ | ( ( two | three)+ , four)? | five)');
      source.endText();

      parseAllUnassignedValues(source, true, (unassignedValues) => {
         const listToken = new NameListPToken();
         const expected = new NameListPToken();
         expected.open = toSToken('(');
         expected.postOpenSpace = toSToken(' ');
         const first: ContentParticlePToken = {
            particle: {
               name: toSToken('one'),
               repeat: toSToken('+'),
               postRepeatSpace: toSToken(' '),
            },
            delimiter: toSToken('|'),
            postDelimiterSpace: toSToken(' '),
         };
         expected.names.push(first);
         const secondParticle: NameListPToken = new NameListPToken({
            open: toSToken('('),
            postOpenSpace: toSToken(' '),
         });
         const second: ContentParticlePToken = {
            particle: secondParticle,
         };
         const secondAParticle: NameListPToken = new NameListPToken({
            open: toSToken('('),
            postOpenSpace: toSToken(' '),
         });
         const secondA: ContentParticlePToken = {
            particle: secondAParticle,
         };
         const secondAOne: ContentParticlePToken = {
            particle: {
               name: toSToken('two'),
               postNameSpace: toSToken(' '),
            },
            delimiter: toSToken('|'),
            postDelimiterSpace: toSToken(' '),
         };
         const secondATwo: ContentParticlePToken = {
            particle: {
               name: toSToken('three'),
            },
         };
         secondAParticle.names.push(secondAOne);
         secondAParticle.names.push(secondATwo);
         secondAParticle.close = toSToken(')');
         secondA.particle!.repeat = toSToken('+');
         secondA.particle!.postRepeatSpace = toSToken(' ');
         secondA.delimiter = toSToken(',');
         secondA.postDelimiterSpace = toSToken(' ');
         const secondB: ContentParticlePToken = {
            particle: {
               name: toSToken('four'),
            },
         };
         secondParticle.names.push(secondA);
         secondParticle.names.push(secondB);
         secondParticle.close = toSToken(')');
         second.particle!.repeat = toSToken('?');
         second.particle!.postRepeatSpace = toSToken(' ');
         second.delimiter = toSToken('|');
         second.postDelimiterSpace = toSToken(' ');
         expected.names.push(second);
         const third: ContentParticlePToken = {
            particle: {
               name: toSToken('five'),
            },
         };
         expected.names.push(third);
         expected.close = toSToken(')');

         assignNameList(listToken, unassignedValues!);

         expect(listToken).toEqualRangeless(expected);
         done();
      });
   });
});
