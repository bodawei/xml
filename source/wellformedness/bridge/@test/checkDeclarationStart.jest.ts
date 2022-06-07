/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ParamCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { DeclarationStart } from 'token';
import { makeCharRef } from 'token-test';

import { wellFormedErrorCodes } from '../../error/wellFormedError';

import { checkDeclarationStart } from '../checkDeclarationStart';

const WFEID = wellFormedErrorCodes.id;

describe('checkDeclarationStart()', () => {
   let collector: ParamCollector;
   let startPToken: DeclarationStart;

   beforeEach(() => {
      collector = new ParamCollector();
      startPToken = makeCharRef();
   });

   it('reports an error if there is a space after the opening ("<!") (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      };

      checkDeclarationStart(startPToken, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.DECL_OPEN_XTRA_SPACE_AFTER,
         lastPosition: undefined,
         params: [],
         position: startPToken.openSpace,
      });
   });

   it('reports an error if the declaration type is not a known one (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         declType: toSToken('frog'),
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      };

      checkDeclarationStart(startPToken, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.DECL_UNKNOWN,
         lastPosition: undefined,
         params: ['frog'],
         position: startPToken.declType,
      });
   });

   [
      ['ATTLIST', 52],
      ['ELEMENT', 45],
      ['DOCTYPE', 45],
      ['ENTITY', '71], [72'],
      ['NOTATION', 82],
   ].forEach(([type, production]) => {
      it(`does not report an error if the declaration type is ${type} (production [${production}])`, () => {
         startPToken = {
            declType: toSToken('type'),
            declTypeSpace: toSToken(' '),
            open: toSToken('<!'),
         };

         checkDeclarationStart(startPToken, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveProblem(WFEID.DECL_UNKNOWN);
      });
   });

   it('reports an error if the declaration type is not upper case (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         declType: toSToken('notation'),
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      };

      checkDeclarationStart(startPToken, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.DECL_DECLTYPE_INVALID_CASE,
         lastPosition: undefined,
         params: ['NOTATION', 'notation'],
         position: startPToken.declType,
      });
   });

   it('reports an error if there is no declaration type (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      };

      checkDeclarationStart(startPToken, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.DECL_NO_DECLTYPE,
         lastPosition: startPToken.openSpace,
         params: [],
         position: startPToken.declType,
      });
   });

   it('reports an error if there is no space after the declaration type (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         declType: toSToken('notation'),
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      };

      checkDeclarationStart(startPToken, collector);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.DECL_TYPE_NO_SPACE_AFTER,
         lastPosition: undefined,
         params: ['notation'],
         position: startPToken.declType,
      });
   });
});
