/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { TextPToken } from 'pToken';
import { describe, expect, it } from 'vitest';

import {
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   ParameterEntityDeclarationPToken,
} from '../parameterEntityDeclaration';

describe('parameterEntityDeclaration (unit)', () => {
   let geDecl: ParameterEntityDeclarationPToken;

   beforeEach(() => {
      geDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         parameter: toSToken('%'),
         parameterSpace: toSToken(' '),
         name: toSToken('peName'),
         nameSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         value: [],
         valueSpace: toSToken('\t'),
         close: toSToken('>'),
      });
   });

   describe('construction', () => {
      it('can construct with a declaration start', () => {
         const newPToken = new ParameterEntityDeclarationPToken({
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
         });

         expect(newPToken).toEqual({
            type: PARAMETER_ENTITY_DECLARATION_PTOKEN,
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
            parameter: undefined,
            parameterSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            externalId: undefined,
            externalIdSpace: undefined,
            value: [],
            valueSpace: undefined,
            unexpanded: undefined,
            extra: undefined,
            close: undefined,
         });
      });

      it('can overide properties with the second parameter', () => {
         const newPToken = new ParameterEntityDeclarationPToken(geDecl, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
            parameter: toSToken('10'),
            parameterSpace: toSToken('9'),
            name: toSToken('5'),
            nameSpace: toSToken('6'),
            externalId: {},
            externalIdSpace: toSToken('7'),
            value: undefined,
            valueSpace: toSToken('8'),
            unexpanded: {
               tokens: [],
               propName: 'foo',
            },
            extra: toSToken('13'),
            close: toSToken('14'),
         });

         expect(newPToken).toEqual(
            new ParameterEntityDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: toSToken('3'),
               declTypeSpace: toSToken('4'),
               parameter: toSToken('10'),
               parameterSpace: toSToken('9'),
               name: toSToken('5'),
               nameSpace: toSToken('6'),
               externalId: {},
               externalIdSpace: toSToken('7'),
               value: [],
               valueSpace: toSToken('8'),
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
         const newPToken = new ParameterEntityDeclarationPToken(geDecl, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
            parameter: toSToken('10'),
            parameterSpace: toSToken('9'),
            name: toSToken('5'),
            value: [new TextPToken({ text: toSToken('foo') })],
         });

         expect(newPToken).toEqual(
            new ParameterEntityDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: toSToken('3'),
               declTypeSpace: toSToken('4'),
               parameter: toSToken('10'),
               parameterSpace: toSToken('9'),
               name: toSToken('5'),
               nameSpace: toSToken(' '),
               externalId: {},
               externalIdSpace: toSToken(' '),
               value: [new TextPToken({ text: toSToken('foo') })],
               valueSpace: toSToken('\t'),
               close: toSToken('>'),
            }),
         );
      });

      it('is no value is provided in the first parameter, will use a default', () => {
         const newPToken = new ParameterEntityDeclarationPToken({
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: toSToken('3'),
            declTypeSpace: toSToken('4'),
            name: toSToken('5'),
            value: undefined,
         });

         expect(newPToken).toEqual(
            new ParameterEntityDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: toSToken('3'),
               declTypeSpace: toSToken('4'),
               parameter: undefined,
               parameterSpace: undefined,
               name: toSToken('5'),
               nameSpace: undefined,
               externalId: undefined,
               externalIdSpace: undefined,
               value: [],
               valueSpace: undefined,
               unexpanded: undefined,
               extra: undefined,
               close: undefined,
            }),
         );
      });
   });
});
