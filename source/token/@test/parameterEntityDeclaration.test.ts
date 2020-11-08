/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken, toSToken } from 'sToken';

import { ParameterEntityDeclarationPToken, ParameterEntityDeclarationXToken } from '../parameterEntityDeclaration';
import * as externalId from '../common/externalId';
import literal from '../common/literal';
import { ExternalIdX } from 'xToken';
import { TextPToken } from '../text';

describe('ParameterEntityDeclaration (unit)', () => {
   let pToken: ParameterEntityDeclarationPToken;

   beforeEach(() => {
      pToken = new ParameterEntityDeclarationPToken({
         parameter: SToken.fromString('%'),
         parameterSpace: SToken.fromString(' '),
         name: SToken.fromString('entityName'),
         nameSpace: SToken.fromString(' '),
         value: [ SToken.fromString('value') ],
         close: SToken.fromString('>'),
      });
   });

   describe('pToken.toXToken()', () => {

      it('returns a parameter entity declaration token with the name and value found in the parsing', () => {
         const xToken = pToken.toXToken();

         expect(xToken).toEqual(new ParameterEntityDeclarationXToken('entityName', (pToken as any).value,
            undefined, pToken));
      });

      it('returns a entity declaration with a blank name if there is no name', () => {
         delete (pToken as any).name;

         const xToken = pToken.toXToken();

         expect(xToken).toEqual(new ParameterEntityDeclarationXToken('', (pToken as any).value, undefined, pToken));
      });

      it('returns a entity declaration with an undefined value if there is no value', () => {
         (pToken as any).value = [];

         const xToken = pToken.toXToken();

         expect(xToken).toEqual(new ParameterEntityDeclarationXToken('entityName', [], undefined, pToken));
      });

      it('returns a notation declaration with an externalId', () => {
         pToken = new ParameterEntityDeclarationPToken({
            parameter: SToken.fromString('%'),
            parameterSpace: SToken.fromString(' '),
            name: SToken.fromString('entityName'),
            nameSpace: SToken.fromString(' '),
            value: [ SToken.fromString('value') ],
            close: SToken.fromString('>'),
               externalId: { type: externalId.EXTERNAL_ID, system: {
               value: [ new TextPToken({ text: toSToken('system.xml') }) ],
            }, public: {
               value: [ new TextPToken({ text: toSToken('- // public') }) ],
             },
            },
         });

         const token = pToken.toXToken();

         expect(token.externalId).toEqual(new ExternalIdX('system.xml', '- // public'));
      });
   });

   describe('toSTokenArray()', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens').and.returnValue([ SToken.fromString('literal') ]);
         spyOn(externalId, 'getSTokens').and.returnValue([ SToken.fromString('external') ]);
      });

      it('returns all the STokens', () => {
         expect(pToken.toSTokenArray()).toEqual([
            pToken.parameter,
            pToken.parameterSpace,
            pToken.name,
            pToken.nameSpace,
            SToken.fromString('external'),
            SToken.fromString('literal'),
            pToken.close,
         ] as any);
      });

   });

});