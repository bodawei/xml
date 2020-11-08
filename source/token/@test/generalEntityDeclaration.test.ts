/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken, toSToken } from 'sToken';

import { GeneralEntityDeclarationPToken, GeneralEntityDeclarationXToken } from '../generalEntityDeclaration';
import * as externalId from '../common/externalId';
import { EXTERNAL_ID } from '../common/externalId';
import literal from '../common/literal';
import { TextPToken } from '../text';
import { ExternalIdX } from 'xToken';

describe('generalEntityDeclaration (unit)', () => {
   let pToken: GeneralEntityDeclarationPToken;

   beforeEach(() => {
      pToken = new GeneralEntityDeclarationPToken({
         name: SToken.fromString('entityName'),
         nameSpace: SToken.fromString(' '),
         externalIdSpace: SToken.fromString(' '),
         value: [ SToken.fromString('value') ],
         close: SToken.fromString('>'),
      });
   });

   describe('toXToken()', () => {
      it('returns an entity declaration token with the name and value found in the parsing', () => {
         delete (pToken as any).parameter;

         const token = pToken.toXToken();

         expect(token).toEqual(new GeneralEntityDeclarationXToken('entityName', (pToken as any).value,
            undefined, '', pToken));
      });

      it('returns a entity declaration with a blank name if there is no name', () => {
         delete (pToken as any).parameter;
         delete (pToken as any).name;

         const xToken = pToken.toXToken();

         expect(xToken).toEqual(new GeneralEntityDeclarationXToken('', (pToken as any).value, undefined, '', pToken));
      });

      it('returns a entity declaration with an undefined value if there is no value', () => {
         delete (pToken as any).parameter;
         (pToken as any).value = [];

         const xToken = pToken.toXToken();

         expect(xToken).toEqual(new GeneralEntityDeclarationXToken('entityName', [], undefined, '', pToken));
      });

      it('returns a entity declaration with an ExternalIdX', () => {
         pToken = new GeneralEntityDeclarationPToken({
            name: SToken.fromString('entityName'),
            nameSpace: SToken.fromString(' '),
            externalIdSpace: SToken.fromString(' '),
            externalId: {
               type: EXTERNAL_ID,
               system: {
                  value: [new TextPToken({ text: toSToken('system.xml') }) ],
               },
            },
            value: [],
            close: SToken.fromString('>'),
         });
   
         const xToken = pToken.toXToken();

         expect(xToken).toEqual(new GeneralEntityDeclarationXToken('entityName', [], new ExternalIdX('system.xml'), '', pToken));
      });

   });

   describe('toSTokenArray()', () => {

      beforeEach(() => {
         spyOn(literal, 'getSTokens').and.returnValue([ SToken.fromString('literal') ]);
         spyOn(externalId, 'getSTokens').and.returnValue([ SToken.fromString('external') ]);
      });

      it('returns all the STokens', () => {
         expect(pToken.toSTokenArray()).toEqual([
            pToken.name,
            pToken.nameSpace,
            SToken.fromString('external'),
            SToken.fromString('literal'),
            pToken.externalIdSpace,
            pToken.close,
         ] as any);
      });

   });

});