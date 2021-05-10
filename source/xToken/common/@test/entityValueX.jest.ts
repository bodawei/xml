/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ParameterEntityEndXToken } from '../../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../../marker/parameterEntityStartXToken';
import { CharRefXToken } from '../../token/charRefXToken';
import { ParameterEntityReferenceXToken } from '../../token/parameterEntityReferenceXToken';
import { TextXToken } from '../../token/textXToken';

import { makeEntityValueX, cloneEntityValueX } from '../entityValueX';

describe('literalValueX (unit)', () => {
   // Most of the entity value is covered in the integration test.

   it('copes with no values at all', () => {
      const result = makeEntityValueX([]);

      expect(result).toEqual([]);
   });

   it('cloneEntityValueX() returns an empty array when passed undefined', () => {
      const result = cloneEntityValueX(undefined);

      expect(result).toEqual([]);
   });

   it('cloneEntityValueX() makes a copy of the specified literalValue', () => {
      const result = cloneEntityValueX([
         new TextXToken('foo'),
         new CharRefXToken('x'),
         new ParameterEntityReferenceXToken('peref'),
         new ParameterEntityStartXToken('peref2'),
         new ParameterEntityEndXToken('peref3'),
      ]);

      expect(result).toEqual([
         new TextXToken('foo'),
         new CharRefXToken('x'),
         new ParameterEntityReferenceXToken('peref'),
         new ParameterEntityStartXToken('peref2'),
         new ParameterEntityEndXToken('peref3'),
      ]);
   });
});
