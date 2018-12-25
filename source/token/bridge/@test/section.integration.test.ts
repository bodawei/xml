/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { defaultExtractors } from '../../../extractor';
import { SToken, STokenSource } from 'sToken';
import { makeSTokenMaker } from 'sToken-test';

import { CdataPToken } from '../../cdata';
import { parseSection } from '../section';

describe('section (integration)', () => {

   describe('parse()', () => {

      it('produces a full PToken', (done) => {
         const source = new STokenSource(defaultExtractors, new EntityMetaData());
         const makeSToken = makeSTokenMaker()
         source.addText(' CDATA [ FOO ]]>');
         source.endText();

         parseSection(source, SToken.fromString('<!['), (parsing) => {
            const expected = new CdataPToken({
               open: SToken.fromString('<!['),
               openSpace: makeSToken(' '),
               sectionType: makeSToken('CDATA'),
               sectionTypeSpace: makeSToken(' '),
               bracket: makeSToken('['),
               text: makeSToken(' FOO '),
               close: makeSToken(']]>'),
            });

            expect(parsing).toEqual(expected);
            done();
         });
      });

   });

});
