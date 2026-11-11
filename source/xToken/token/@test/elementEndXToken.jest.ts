/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ElementEndPToken } from 'token';
import { describe, expect, it } from 'vitest';

import { ELEMENT_END_XTOKEN, ElementEndXToken } from '../elementEndXToken';

describe('elementEnd', () => {
   let elementEndPToken: ElementEndPToken;

   beforeEach(() => {
      elementEndPToken = new ElementEndPToken({
         open: toSToken('</'),
         openSpace: undefined,
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });
   });

   it('constructs with just a string', () => {
      const token = new ElementEndXToken('MyElement');

      expect(token).toEqual({
         type: ELEMENT_END_XTOKEN,
         name: 'MyElement',
      });
   });

   it('returns a token with an empty string if no name was found', () => {
      const token = new ElementEndXToken(elementEndPToken);
      expect(token).toEqual({
         type: ELEMENT_END_XTOKEN,
         name: 'elemName',
         pToken: elementEndPToken,
      });
   });

   it('returns a token constructed with just a string name', () => {
      const token = new ElementEndXToken('foo');

      expect(token).toEqual({
         type: ELEMENT_END_XTOKEN,
         name: 'foo',
      });
   });
});
