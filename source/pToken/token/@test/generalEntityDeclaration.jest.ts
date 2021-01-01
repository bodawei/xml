/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { TextPToken } from 'pToken';
import { toSToken } from 'sToken';

import {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   GeneralEntityDeclarationPToken,
} from '../generalEntityDeclaration';

describe('generalEntityDeclaration (unit)', () => {
   let geDecl: GeneralEntityDeclarationPToken;

   beforeEach(() => {
      geDecl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         value: [],
         valueSpace: toSToken('\t'),
         nData: toSToken('NDATA'),
         nDataSpace: toSToken('\n'),
         nDataName: toSToken('foo'),
         nDataNameSpace: toSToken('\t'),
         close: toSToken('>'),
      });
   });

   describe('construction', () => {
      it('can construct with a declaration start', () => {
         const newPToken = new GeneralEntityDeclarationPToken({
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
         });

         expect(newPToken).toEqual({
            type: GENERAL_ENTITY_DECLARATION_PTOKEN,
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
            name: undefined,
            nameSpace: undefined,
            externalId: undefined,
            externalIdSpace: undefined,
            value: [],
            valueSpace: undefined,
            nData: undefined,
            nDataSpace: undefined,
            nDataName: undefined,
            nDataNameSpace: undefined,
            unexpanded: undefined,
            extra: undefined,
            close: undefined,
         });
      });

      it('can overide properties with the second parameter', () => {
         const newPToken = new GeneralEntityDeclarationPToken(geDecl, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
            name: toSToken('5'),
            nameSpace: toSToken('5'),
            externalId: {},
            externalIdSpace: toSToken('7'),
            value: undefined,
            valueSpace: toSToken('8'),
            nData: toSToken('9'),
            nDataSpace: toSToken('10'),
            nDataName: toSToken('11'),
            nDataNameSpace: toSToken('12'),
            unexpanded: {
               tokens: [],
               propName: 'foo',
            },
            extra: toSToken('13'),
            close: toSToken('14'),
         });

         expect(newPToken).toEqual(
            new GeneralEntityDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: toSToken('3'),
               declTypeSpace: toSToken('4'),
               name: toSToken('5'),
               nameSpace: toSToken('5'),
               externalId: {},
               externalIdSpace: toSToken('7'),
               value: [],
               valueSpace: toSToken('8'),
               nData: toSToken('9'),
               nDataSpace: toSToken('10'),
               nDataName: toSToken('11'),
               nDataNameSpace: toSToken('12'),
               unexpanded: {
                  tokens: [],
                  propName: 'foo',
               },
               extra: toSToken('13'),
               close: toSToken('14'),
            }),
         );
      });

      it('can overide the value parameter with the second parameter', () => {
         const newPToken = new GeneralEntityDeclarationPToken(geDecl, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
            name: toSToken('5'),
            value: [new TextPToken({ text: toSToken('foo') })],
         });

         expect(newPToken).toEqual(
            new GeneralEntityDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: toSToken('3'),
               declTypeSpace: toSToken('4'),
               name: toSToken('5'),
               nameSpace: toSToken(' '),
               externalId: {},
               externalIdSpace: toSToken(' '),
               value: [new TextPToken({ text: toSToken('foo') })],
               valueSpace: toSToken('\t'),
               nData: toSToken('NDATA'),
               nDataSpace: toSToken('\n'),
               nDataName: toSToken('foo'),
               nDataNameSpace: toSToken('\t'),
               close: toSToken('>'),
            }),
         );
      });

      it('is no value is provided in the first parameter, will use a default', () => {
         const newPToken = new GeneralEntityDeclarationPToken({
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
            name: toSToken('5'),
            value: undefined,
         });

         expect(newPToken).toEqual(
            new GeneralEntityDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: toSToken('3'),
               declTypeSpace: toSToken('4'),
               name: toSToken('5'),
               nameSpace: undefined,
               externalId: undefined,
               externalIdSpace: undefined,
               value: [],
               valueSpace: undefined,
               nData: undefined,
               nDataSpace: undefined,
               nDataName: undefined,
               nDataNameSpace: undefined,
               unexpanded: undefined,
               extra: undefined,
               close: undefined,
            }),
         );
      });
   });
});
