/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { defaultExtractors } from 'extractor';
import { SToken, STokenSource, toSToken } from 'sToken';
import {
   wordFromSToken,
   spaceFromSToken,
   ParameterEntityReferencePToken,
   UnassignedType,
   ParameterEntityStartPToken,
   AttListPToken,
   ParameterEntityEndPToken,
   UnassignedArray,
   parseAttListDeclaration,
   WordListType,
   WordListPToken,
} from 'token';
import { makeInsertedRange } from 'token-test';

import { assignAttListDeclaration } from '../assignAttListDeclaration';

describe('assignAttListDeclaration() (integration)', () => {
   it('fills in the missing properties, including the preceeding declaration space', (done) => {
      const source = new STokenSource(defaultExtractors, new EntityMetaData());
      source.addText('%foo;>');
      source.endText();

      parseAttListDeclaration(source, { open: toSToken('<!') }, (pToken: AttListPToken) => {
         if (!pToken) {
            throw new Error('Unexpected undefined PToken.');
         }

         // "expand" what should be there.
         const unassignedValue: UnassignedArray = [
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
            wordFromSToken(toSToken('entityName')),
            spaceFromSToken(toSToken(' ')),
            {
               type: UnassignedType.ENTITY_END,
               token: new ParameterEntityEndPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
         ] as any;

         assignAttListDeclaration(unassignedValue, pToken);

         expect(pToken).toEqualRangeless(
            new AttListPToken({
               open: toSToken('<!'),
               declTypeSpace: new SToken(' ', ' ', [makeInsertedRange()]),
               elementName: toSToken('entityName'),
               postElementNameSpace: new SToken('  ', '  ', [
                  new Range(new EntityLocation()),
                  makeInsertedRange(),
               ]),
               close: toSToken('>'),
               peRefPlus: pToken.unassigned,
               nextPropName: 'elementName',
               unassigned: pToken.unassigned,
               extra: [],
            }),
         );
         done();
      });
   });

   it('fills in the missing attributes', (done) => {
      const source = new STokenSource(defaultExtractors, new EntityMetaData());
      source.addText('elName at1 CDATA %foo;>');
      source.endText();

      parseAttListDeclaration(source, { open: toSToken('<!') }, (pToken: AttListPToken) => {
         if (!pToken) {
            throw new Error('Unexpected undefined PToken.');
         }

         // "expand" what should be there.
         const unassignedValue: UnassignedArray = [
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
            wordFromSToken(toSToken('at2')),
            spaceFromSToken(toSToken(' ')),
            wordFromSToken(toSToken('ENTITIES')),
            spaceFromSToken(toSToken(' ')),
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityEndPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
         ] as any;

         assignAttListDeclaration(unassignedValue, pToken);

         const expected = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            postElementNameSpace: toSToken(' '),
            attDefs: [
               {
                  name: toSToken('at1'),
                  postNameSpace: toSToken(' '),
                  type: toSToken('CDATA'),
                  postTypeSpace: toSToken(' '),
                  value: [],
               },
               {
                  name: toSToken('at2'),
                  postNameSpace: toSToken(' '),
                  type: toSToken('ENTITIES'),
                  postTypeSpace: toSToken(' '),
                  // value: [],
               },
            ] as any,
            close: toSToken('>'),
            peRefPlus: pToken.unassigned,
            unassigned: pToken.unassigned,
            nextPropName: 'defaultType',
            extra: [],
         });
         (expected as any).attDefs[0].postTypeSpace.str += ' ';
         (expected as any).attDefs[0].postTypeSpace.originalStr += ' ';
         (expected as any).attDefs[0].postTypeSpace.ranges.push(makeInsertedRange());
         (expected as any).attDefs[1].postTypeSpace.str += ' ';
         (expected as any).attDefs[1].postTypeSpace.originalStr += ' ';
         (expected as any).attDefs[1].postTypeSpace.ranges.push(makeInsertedRange());
         expect(pToken).toEqualRangeless(new AttListPToken(expected));
         done();
      });
   });

   it('identifies an enumeration if the type value is missing', (done) => {
      const source = new STokenSource(defaultExtractors, new EntityMetaData());
      source.addText('elName at1 CDATA %foo;>');
      source.endText();

      parseAttListDeclaration(source, { open: toSToken('<!') }, (pToken: AttListPToken) => {
         if (!pToken) {
            throw new Error('Unexpected undefined PToken.');
         }

         // "expand" what should be there.
         const unassignedValue: UnassignedArray = [
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
            wordFromSToken(toSToken('at2')),
            spaceFromSToken(toSToken(' ')),
            wordFromSToken(toSToken('(')),
            wordFromSToken(toSToken('one')),
            wordFromSToken(toSToken(')')),
            wordFromSToken(toSToken('#ENTITIES')),
            spaceFromSToken(toSToken(' ')),
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
         ] as any;

         const rawExpected = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            postElementNameSpace: toSToken(' '),
            attDefs: [
               {
                  name: toSToken('at1'),
                  postNameSpace: toSToken(' '),
                  type: toSToken('CDATA'),
                  postTypeSpace: toSToken(' '),
                  value: [],
               },
               {
                  name: toSToken('at2'),
                  postNameSpace: toSToken(' '),
                  enumeration: new WordListPToken(WordListType.ENUMERATION, {
                     open: toSToken('('),
                     words: [
                        {
                           word: toSToken('one'),
                           wordSpace: undefined,
                           connector: undefined,
                           connectorSpace: undefined,
                        },
                     ],
                     close: toSToken(')'),
                  }),
                  defaultType: toSToken('#ENTITIES'),
                  postDefaultTypeSpace: toSToken(' '),
                  // value: [],
               },
            ] as any,
            close: toSToken('>'),
            nextPropName: 'defaultType',
            unassigned: pToken.unassigned,
            peRefPlus: pToken.unassigned,
            extra: [],
         });
         // work around some kind of ts issue
         const expected = new AttListPToken(rawExpected);
         (expected as any).attDefs[0].postTypeSpace!.str += ' ';
         (expected as any).attDefs[0].postTypeSpace!.originalStr += ' ';
         (expected as any).attDefs[0].postTypeSpace!.ranges.push(makeInsertedRange());
         (expected as any).attDefs[1].postDefaultTypeSpace!.str += ' ';
         (expected as any).attDefs[1].postDefaultTypeSpace!.originalStr += ' ';
         (expected as any).attDefs[1].postDefaultTypeSpace!.ranges.push(makeInsertedRange());

         assignAttListDeclaration(unassignedValue, pToken);

         expect(pToken).toEqualRangeless(expected);
         done();
      });
   });

   it('will expand a list that is in progress', (done) => {
      const source = new STokenSource(defaultExtractors, new EntityMetaData());
      source.addText('elName at1 (one|%foo;>');
      source.endText();

      parseAttListDeclaration(source, { open: toSToken('<!') }, (pToken: AttListPToken) => {
         if (!pToken) {
            throw new Error('Unexpected undefined PToken.');
         }

         // "expand" what should be there.
         const unassignedValue: UnassignedArray = [
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityStartPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
            wordFromSToken(toSToken('two')),
            wordFromSToken(toSToken(')')),
            wordFromSToken(toSToken('#REQUIRED')),
            {
               type: UnassignedType.ENTITY_START,
               token: new ParameterEntityEndPToken(
                  new ParameterEntityReferencePToken({ open: toSToken('%') }),
               ),
            },
         ] as any;

         const rawExpected = new AttListPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            postElementNameSpace: toSToken(' '),
            attDefs: [
               {
                  name: toSToken('at1'),
                  postNameSpace: toSToken(' '),
                  enumeration: new WordListPToken(WordListType.ENUMERATION, {
                     open: toSToken('('),
                     openSpace: undefined,
                     words: [
                        {
                           word: toSToken('one'),
                           wordSpace: undefined,
                           connector: toSToken('|'),
                           connectorSpace: undefined,
                        },
                        {
                           word: toSToken('two'),
                           wordSpace: undefined,
                           connector: undefined,
                           connectorSpace: undefined,
                        },
                     ],
                     close: toSToken(')'),
                     closeSpace: undefined,
                  }),
                  defaultType: toSToken('#REQUIRED'),
                  value: [],
               },
            ],
            close: toSToken('>'),
            nextPropName: 'defaultType',
            unassigned: pToken.unassigned,
            peRefPlus: pToken.unassigned,
            extra: [],
         });
         // work around some kind of ts issue
         const expected = new AttListPToken(rawExpected);
         const spaceToken = toSToken(' ');
         spaceToken.ranges = [makeInsertedRange()];
         ((expected as any).attDefs[0].enumeration!.words[0] as any).connectorSpace = spaceToken;
         (expected as any).attDefs[0].postDefaultTypeSpace = spaceToken;

         assignAttListDeclaration(unassignedValue, pToken);

         expect(pToken).toEqualRangeless(expected);
         done();
      });
   });
});
