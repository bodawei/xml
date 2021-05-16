/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { makeNotationDeclaration } from 'token-test';

import { ValidateState } from '../../validateState';
import { notationDeclarationUpdateState } from '../notationDeclarationUpdateState';

describe('notationDeclarationUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {
      state = new ValidateState();
   });

   it('adds a declaration to the state', () => {
      const decl = makeNotationDeclaration();

      const result = notationDeclarationUpdateState(decl, state);

      expect(result).toEqual(
         new ValidateState({
            notationDeclarations: {
               notationName: true,
            },
         }),
      );
   });
});
