/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const Extractor = require('./Extractor.js');

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

   it('provides a no-op done() function', () => {
      expect(() => {
         extractor.done();
      }).not.toThrow();
   });

   it('provides a no-op getExtraction() function', () => {
      expect(() => {
         extractor.getExtraction();
      }).not.toThrow();
   });

   it('STATE is defined', () => {
      expect(Extractor.STATE).toEqual({
         WORKING: 'WORKING',
         SUCCESS: 'SUCCESS',
         FAILURE: 'FAILURE'
      });
   });

});
