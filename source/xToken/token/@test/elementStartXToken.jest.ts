/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ElementStartPToken } from 'token';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { AttributeX, cloneAttributeX } from '../../common/attributeX';
import { ElementStartXToken, ELEMENT_START_XTOKEN } from '../elementStartXToken';
import { TEXT_XTOKEN } from '../textXToken';

vi.mock('../../common/attributeX');

describe('elementStartXToken (unit)', () => {
   let elementStartPToken: ElementStartPToken;

   beforeEach(() => {
      elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         name: toSToken('elemName'),
         nameSpace: toSToken(' '),
         attributes: [{}],
         close: toSToken('>'),
      });

      (cloneAttributeX as Mock).mockReturnValue({ name: 'clonedAttr' });
   });

   it('constructs with just a string', () => {
      const token = new ElementStartXToken('MyElement');

      expect(token).toEqual({
         type: ELEMENT_START_XTOKEN,
         name: 'MyElement',
         attributes: [],
      });
   });

   it('constructs with a string and attributes', () => {
      const token = new ElementStartXToken('MyElement', [
         {
            name: 'attr1',
            value: [{ type: TEXT_XTOKEN, text: 'whee' }],
         },
      ]);

      expect(token).toEqual({
         type: ELEMENT_START_XTOKEN,
         name: 'MyElement',
         attributes: [{ name: 'clonedAttr' }],
      });
   });

   it('asks the attribute system to provide the attributes', () => {
      new ElementStartXToken(elementStartPToken);

      expect(AttributeX).toHaveBeenCalledWith({});
   });

   it('returns a token with the expected fields defined', () => {
      (AttributeX as Mock).mockImplementation(function () {
         return { name: 'foo', value: [] };
      });

      const token = new ElementStartXToken(elementStartPToken);

      expect(token).toMatchObject({
         name: 'elemName',
         attributes: [{ name: 'foo', value: [] }],
         pToken: elementStartPToken,
      });
   });

   it('returns a token with an empty string if no name was found', () => {
      elementStartPToken = new ElementStartPToken({
         open: toSToken('<'),
         openSpace: toSToken(' '),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      const token = new ElementStartXToken(elementStartPToken);

      expect(token.name).toEqual('');
   });
});
