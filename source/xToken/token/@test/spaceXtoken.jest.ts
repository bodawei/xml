/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { toSToken } from 'basic';
import { SpacePToken } from 'token';

import { SpaceXToken } from '../spaceXtoken';

describe('space (unit)', () => {
   let spacePToken: SpacePToken;

   beforeEach(() => {
      spacePToken = new SpacePToken({
         text: toSToken(' '),
      });
   });

   it('returns space token with the whitespace', () => {
      const token = new SpaceXToken(spacePToken);

      expect(token).toMatchObject({
         text: ' ',
         pToken: spacePToken,
      });
   });

   it('returns space token with the provided string', () => {
      const token = new SpaceXToken('\t');

      expect(token).toMatchInlineSnapshot(`
         SpaceXToken {
           "text": "	",
           "type": "SPACE_XTOKEN",
         }
      `);
   });
});
