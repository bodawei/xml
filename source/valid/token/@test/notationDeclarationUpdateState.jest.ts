/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { makeNotationDeclaration } from 'token-test';

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
