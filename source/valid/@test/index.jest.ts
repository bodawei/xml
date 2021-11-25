/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { error, warning } from 'basic';
import { warningCodes } from '../error/warningCodes';
import { errorCodes } from '../error/errorCodes';

jest.mock('basic');

describe('valid entrypoint (unit)', () => {
   beforeEach(async () => {
      await import('../index');
   });

   it('passes the warning and error codes to the respective addMapping() calls', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- for now we need the "unbound" method
      expect(warning.addMapping).toHaveBeenCalledWith(warningCodes);
      // eslint-disable-next-line @typescript-eslint/unbound-method -- for now we need the "unbound" method
      expect(error.addMapping).toHaveBeenCalledWith(errorCodes);
   });
});
