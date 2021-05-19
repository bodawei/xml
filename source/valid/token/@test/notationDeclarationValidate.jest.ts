/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { makeNotationDeclaration } from 'token-test';

import { notationDeclarationValidate } from '../notationDeclarationValidate';
import { ValidateState } from '../../validateState';
import { validityConstraint } from '../../error/validityConstraint';

const VID = validityConstraint.id;

describe('notationDeclarationValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
   });

   it('reports no error when the declaration name has not been seen before', () => {
      state = new ValidateState({
         notationDeclarations: {
            foo: true,
         },
      });

      notationDeclarationValidate(makeNotationDeclaration(), state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the declaration name has already been encountered defined', () => {
      const notationDecl = makeNotationDeclaration();
      state = new ValidateState({
         notationDeclarations: {
            notationName: true,
         },
      });

      notationDeclarationValidate(notationDecl, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.NOTATION_XTRA_DECLARATION,
         params: ['notationName'],
         position: notationDecl.name,
         lastPosition: undefined,
      });
   });

   it('reports no error when the declaration has already been defined, but this is a 1.0 document', () => {
      const notationDecl = makeNotationDeclaration();
      state = new ValidateState({
         confVer: new ConformanceVersion(1.0, 1),
         notationDeclarations: {
            notationName: true,
         },
      });

      notationDeclarationValidate(notationDecl, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
