/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import { ParameterEntityReferencePToken } from 'pToken';
import {  STokenSource, toSToken } from 'basic';
import { CdataPToken, ConditionalStartPToken,  } from 'token';

import { parseSection } from '../section';

describe('section (integration)', () => {

   describe('parse()', () => {

      it('produces a full CDATA PToken', (done) => {
         const source = new STokenSource();
         source.addText(' CDATA [ FOO ]]>');
         source.endText();

         parseSection(source, toSToken('<!['), (parsing) => {
            const expected = new CdataPToken({
               open: toSToken('<!['),
               openSpace: toSToken(' '),
               sectionType: toSToken('CDATA'),
               sectionTypeSpace: toSToken(' '),
               bracket: toSToken('['),
               text: toSToken(' FOO '),
               close: toSToken(']]>')
            });

            expect(parsing).toEqualRangeless(expected);
            done();
         });
      });

      it('produces a full other valued PToken', (done) => {
         const source = new STokenSource();
         source.addText(' INCLUDE [ FOO ]]>');
         source.endText();

         parseSection(source, toSToken('<!['), (parsing) => {
            const expected = new ConditionalStartPToken({
               open: toSToken('<!['),
               openSpace: toSToken(' '),
               sectionType: toSToken('INCLUDE'),
               sectionTypeSpace: toSToken(' '),
               bracket: toSToken('['),
            });

            expect(parsing).toEqualRangeless(expected);
            done();
         });
      });

      it('produces a full token with a parameter entity reference', (done) => {
         const source = new STokenSource();
         const peRef = new ParameterEntityReferencePToken({
            open: toSToken('%'),
            openSpace: toSToken(' '),
            name: toSToken('foo'),
            nameSpace: toSToken(' '),
            close: toSToken(';'),
         });
         source.addText(' % foo ; [ FOO ]]>');
         source.endText();

         parseSection(source, toSToken('<!['), (parsing) => {
            const expected = new ConditionalStartPToken({
               open: toSToken('<!['),
               openSpace: toSToken(' '),
               unexpanded: {
                  peRef,
                  propName: 'sectionType',
               }
            });

            expect(parsing).toEqualRangeless(expected);
            done();
         });
      });

   });

});
