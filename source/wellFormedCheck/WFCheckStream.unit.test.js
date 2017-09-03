/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import WFCheckStream from './WFCheckStream.js';

describe('WFCheckStream (unit)', () => {
   let checker;

   beforeEach(() => {
      checker = new WFCheckStream();
   });

   it('passes unknown values through unchanged', () => {
      checker.write({
         type: 'BOGUS',
      });

      expect(checker.read()).toEqual({
         type: 'BOGUS',
      });
   });

});
