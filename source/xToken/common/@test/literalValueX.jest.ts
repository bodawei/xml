/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { GeneralEntityEndXToken } from '../../marker/generalEntityEndXToken';
import { GeneralEntityStartXToken } from '../../marker/generalEntityStartXToken';
import { ParameterEntityEndXToken } from '../../marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from '../../marker/parameterEntityStartXToken';
import { CharRefXToken } from '../../token/charRefXToken';
import { GeneralEntityReferenceXToken } from '../../token/generalEntityReferenceXToken';
import { ParameterEntityReferenceXToken } from '../../token/parameterEntityReferenceXToken';
import { TextXToken } from '../../token/textXToken';
import { makeLiteralValueX, cloneLiteralValueX } from '../literalValueX';

describe('literalValueX (unit)', () => {
   // Most of literal value is covered in the integration test.

   it('copes with no values at all', () => {
      const result = makeLiteralValueX([]);

      expect(result).toEqual([]);
   });

   it('cloneLiteralValueX() returns an empty array when passed undefined', () => {
      const result = cloneLiteralValueX(undefined);

      expect(result).toEqual([]);
   });

   it('cloneLiteralValueX() makes a copy of the specified literalValue', () => {
      const result = cloneLiteralValueX([
         new TextXToken('foo'),
         new CharRefXToken('x'),
         new ParameterEntityReferenceXToken('peref'),
         new ParameterEntityStartXToken('peref2'),
         new ParameterEntityEndXToken('peref3'),
         new GeneralEntityReferenceXToken('pgref'),
         new GeneralEntityEndXToken('geref2'),
         new GeneralEntityStartXToken('geref3'),
      ]);

      expect(result).toEqual([
         new TextXToken('foo'),
         new CharRefXToken('x'),
         new ParameterEntityReferenceXToken('peref'),
         new ParameterEntityStartXToken('peref2'),
         new ParameterEntityEndXToken('peref3'),
         new GeneralEntityReferenceXToken('pgref'),
         new GeneralEntityEndXToken('geref2'),
         new GeneralEntityStartXToken('geref3'),
      ]);
   });
});
