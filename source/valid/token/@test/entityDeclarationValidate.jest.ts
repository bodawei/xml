/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import { GeneralEntityDeclarationPToken, ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';

import { ValidityState } from '../../common/validityState';
import { entityDeclarationValueValidate } from '../../common/entityDeclarationValueValidate';
import { validCodes } from '../../error/validCodes';
import { entityDeclarationValidate } from '../entityDeclarationValidate';

const VID = validCodes.id;

jest.mock('../../common/entityDeclarationValueValidate');

describe('entityDeclarationValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidityState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      state = new ValidityState();
   });

   describe('Proper Declaration/PE Nesting (§2.8.0)', () => {
      it('reports an error if a markup-internal PERef has been expanded and included the trailing > (§2.8.0)', () => {
         const geDecl = new GeneralEntityDeclarationPToken({
            extra: toSToken('>'),
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         entityDeclarationValidate(geDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.PEREF_INVALID_END_NESTING,
            lastPosition: undefined,
            params: ['ENTITY'],
            position: geDecl.open,
         });
      });

      it('reports no error if a markup-internal PERef has been expanded and included no extra text (§2.8.0)', () => {
         const geDecl = new GeneralEntityDeclarationPToken({
            extra: false,
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         entityDeclarationValidate(geDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports calls entityDeclarationValueValidate() (§4.1.0)', () => {
         const geDecl = new GeneralEntityDeclarationPToken({
            extra: false,
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         entityDeclarationValidate(geDecl, state, mockErrorCollector);

         expect(entityDeclarationValueValidate).toHaveBeenCalledWith(
            geDecl,
            state,
            mockErrorCollector,
         );
      });
   });
});
