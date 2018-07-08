/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import Extractor from '../Extractor';

describe('Extractor', () => {
   let extractor;

   beforeEach(() => {
      extractor = new Extractor(2.0);
   });

   it('constructs with default values', () => {
      expect(extractor._version).toEqual(2.0);
      expect(extractor._text).toEqual([]);
      expect(extractor._segInfo).toEqual([]);
      expect(extractor.state).toEqual(Extractor.STATE.WORKING);
   });

   it('provides a no-op process() function', () => {
      expect(() => {
         extractor.process();
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
      expect(Extractor.STATE).toEqual({
         WORKING: 'WORKING',
         SUCCESS: 'SUCCESS',
         FAILURE: 'FAILURE',
      });
   });

});
