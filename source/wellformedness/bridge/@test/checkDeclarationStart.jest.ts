/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { MockErrorCollector } from 'basic-test';
import { WellFormedError } from 'error';
import { toSToken } from 'sToken';
import { DeclarationStart } from 'token';
import { makeCharRef } from 'token-test';

import { checkDeclarationStart } from '../checkDeclarationStart';

describe('checkDeclarationStart()', () => {
   let mockErrorCollector: MockErrorCollector;
   let startPToken: DeclarationStart;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      startPToken = makeCharRef();
   });

   it('reports an error if there is a space after the opening ("<!") (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      };

      checkDeclarationStart(startPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.DECL_OPEN_XTRA_SPACE_AFTER,
         params: undefined,
         position: startPToken.openSpace,
         lastPosition: undefined,
      });
   });

   it('reports an error if the declaration type is not a known one (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('frog'),
      };

      checkDeclarationStart(startPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.DECL_UNKNOWN,
         params: ['frog'],
         position: startPToken.declType,
         lastPosition: undefined,
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
            open: toSToken('<!'),
            declType: toSToken('type'),
            declTypeSpace: toSToken(' '),
         };

         checkDeclarationStart(startPToken, mockErrorCollector);

         expect(mockErrorCollector).toNotReportError(WellFormedError.ID.DECL_UNKNOWN);
      });
   });

   it('reports an error if the declaration type is not upper case (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('notation'),
      };

      checkDeclarationStart(startPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.DECL_DECLTYPE_INVALID_CASE,
         params: ['NOTATION', 'notation'],
         position: startPToken.declType,
         lastPosition: undefined,
      });
   });

   it('reports an error if there is no declaration type (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      };

      checkDeclarationStart(startPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.DECL_NO_DECLTYPE,
         params: undefined,
         position: startPToken.declType,
         lastPosition: startPToken.openSpace,
      });
   });

   it('reports an error if there is no space after the declaration type (productions [28], [45], [52], [71], [72], [82])', () => {
      startPToken = {
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('notation'),
      };

      checkDeclarationStart(startPToken, mockErrorCollector);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.DECL_TYPE_NO_SPACE_AFTER,
         params: ['notation'],
         position: startPToken.declType,
         lastPosition: undefined,
      });
   });
});
