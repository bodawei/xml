/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { makeNotationDeclaration } from 'token-test';

import { notationDeclarationValidate } from '../notationDeclarationValidate';
import { ValidateState } from '../../validateState';
import { validityConstraint } from '../../error/validityConstraint';
import { NotationDeclarationPToken, ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';

const VID = validityConstraint.id;

describe('notationDeclarationValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      state = new ValidateState();
   });

   describe('Proper Declaration/PE Nesting (§2.8.0)', () => {
      it('reports an error if a markup-internal PERef has been expanded and included the trailing > (§2.8.0)', () => {
         const notationDecl = new NotationDeclarationPToken({
            extra: toSToken('>'),
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         notationDeclarationValidate(notationDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.PEREF_INVALID_END_NESTING,
            lastPosition: undefined,
            params: ['NOTATION'],
            position: notationDecl.open,
         });
      });

      it('reports no error if a markup-internal PERef has been expanded and included no extra text (§2.8.0)', () => {
         const notationDecl = new NotationDeclarationPToken({
            extra: false,
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         notationDeclarationValidate(notationDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
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
         lastPosition: undefined,
         params: ['notationName'],
         position: notationDecl.name,
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
