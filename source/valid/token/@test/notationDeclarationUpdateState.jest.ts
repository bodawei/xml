/* Copyright ® 2021-2026 by 柏大衛. All rights reserved. */

import { makeNotationDeclaration } from 'token-test';
import { describe, expect, it } from 'vitest';

import { ValidityState } from '../../common/validityState';
import { notationDeclarationUpdateState } from '../notationDeclarationUpdateState';

describe('notationDeclarationUpdateState (unit)', () => {
   let state: ValidityState;

   beforeEach(() => {
      state = new ValidityState();
   });

   it('adds a declaration to the state', () => {
      const decl = makeNotationDeclaration();

      const result = notationDeclarationUpdateState(decl, state);

      expect(result).toEqual(
         new ValidityState({
            notations: {
               notationName: true,
            },
         }),
      );
   });
});
