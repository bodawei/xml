/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { describe, it, expect } from '@jest/globals';

import { Extractor } from '../Extractor';
import { Segment } from '../Segment';

describe('Extractor', () => {
   let extractor: Extractor;

   beforeEach(() => {
      extractor = new Extractor(2.0, true);
   });

   it('provides a no-op process() function', () => {
      expect(() => {
         extractor.process(new Segment('foo'));
      }).not.toThrow();
   });

   it('provides a no-op finish() function', () => {
      expect(extractor.finish()).toEqual({
         segments: [],
         text: '',
         original: '',
      });
   });

   it('STATE is defined', () => {
      expect(Extractor.STATE).not.toBeUndefined();
   });
});
