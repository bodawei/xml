/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { makeDocTypeStart } from 'token-test';

import { ValidateState } from '../../validateState';
import { docTypeStartUpdateState } from '../docTypeStartUpdateState';

describe('docTypeStartUpdateState (unit)', () => {
   let state: ValidateState;

   beforeEach(async () => {
      state = new ValidateState({});
   });

   it('adds the docType name to the state', () => {
      const newState = docTypeStartUpdateState(makeDocTypeStart(), state);

      expect(newState).toEqual({
         ...state,
         docType: 'root',
      });
   });
});
