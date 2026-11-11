/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ParseToken } from 'pToken';
import {
   makeAttListDeclaration,
   makeCdata,
   makeCharData,
   makeCharRef,
   makeComment,
   makeConditionalClose,
   makeConditionalStart,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeElementEmpty,
   makeElementEnd,
   makeElementStart,
   makeGeneralEntityDeclaration,
   makeGeneralEntityEnd,
   makeGeneralEntityReference,
   makeGeneralEntityStart,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterEntityEnd,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeProcessingInstruction,
   makeSpace,
   makeTextDecl,
   makeTextPToken,
   makeXmlDecl,
} from 'token-test';
import { describe, expect, it } from 'vitest';

import { isXmlData } from '../isXmlData';

describe('isXmlData (unit)', () => {
   it('returns false if the token is not one of hte xml data types', () => {
      expect(isXmlData(new ConformanceVersion())).toEqual(false);
   });

   [
      makeAttListDeclaration(),
      makeCdata(),
      makeCharData(),
      makeCharRef(),
      makeComment(),
      makeConditionalClose(),
      makeConditionalStart(),
      makeDocTypeEnd(),
      makeDocTypeStart(),
      makeElementDeclaration(),
      makeElementEmpty(),
      makeElementEnd(),
      makeElementStart(),
      makeGeneralEntityDeclaration(),
      makeGeneralEntityEnd(),
      makeGeneralEntityReference(),
      makeGeneralEntityStart(),
      makeNotationDeclaration(),
      makeParameterEntityDeclaration(),
      makeParameterEntityEnd(),
      makeParameterEntityReference(),
      makeParameterEntityStart(),
      makeProcessingInstruction(),
      makeSpace(),
      makeTextPToken('foo'),
      makeTextDecl(),
      makeXmlDecl(),
   ].forEach((token: ParseToken) => {
      it(`returns true if passed a type of ${token.type}`, () => {
         expect(isXmlData(token)).toEqual(true);
      });
   });
});
