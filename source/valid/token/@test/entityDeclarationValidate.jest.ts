/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { GeneralEntityDeclarationPToken, ParameterEntityReferencePToken } from 'pToken';

import { entityDeclarationValueValidate } from '../../common/entityDeclarationValueValidate';
import { ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { entityDeclarationValidate } from '../entityDeclarationValidate';

const VID = validityErrorCodes.id;

jest.mock('../../common/entityDeclarationValueValidate');

describe('entityDeclarationValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();
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

         entityDeclarationValidate(geDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
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

         entityDeclarationValidate(geDecl, state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
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

         entityDeclarationValidate(geDecl, state, collector);

         expect(entityDeclarationValueValidate).toHaveBeenCalledWith(geDecl, state, collector);
      });
   });
});
