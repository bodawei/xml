/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import {
   EXTERNAL_DTD_PSEUDO_TOKEN,
   ExternalDtdSubsetPseudoToken,
} from '../ExternalDtdSubsetPseudoToken';

describe('ExternalDtdSubsetPseudoToken (unit)', () => {
   it('constructs a tokenw with the provided external ID', () => {
      const result = new ExternalDtdSubsetPseudoToken({});

      expect(result.type).toEqual(EXTERNAL_DTD_PSEUDO_TOKEN);
      expect(result.externalId).toEqual({});
   });
});
