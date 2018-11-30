/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import SToken from '../SToken';
import strOrBlank from '../strOrBlank';

describe('strOrBlank (unit)', () => {

   it('returns blank if the SToken is undefined', () => {
      const result = strOrBlank(undefined);

      expect(result).toEqual('');
   });

   it('returns the value of the SToken.str', () => {
      const token: SToken = SToken.fromString('hi');
      const result = strOrBlank(token);

      expect(result).toEqual('hi');
   });

});
