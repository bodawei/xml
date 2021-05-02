/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { fatalError } from 'basic';

import * as wellformedness from '../index';

describe('wellformedness', () => {
   it('exports several function', () => {
      expect(wellformedness).toMatchInlineSnapshot(`
         Object {
           "ContentChecker": [Function],
           "DocumentChecker": [Function],
           "MarkupDeclChecker": [Function],
           "WellFormedError": [Function],
         }
      `);
   });

   it('adds several errors to the fatalError', () => {
      expect(fatalError.id).toMatchInlineSnapshot(`
         Object {
           "REFERENCE_NO_UNPARSED": "REFERENCE_NO_UNPARSED",
           "TEXTDECL_INVALID_SPACE": "TEXTDECL_INVALID_SPACE",
           "XMLDECL_INVALID_SPACE": "XMLDECL_INVALID_SPACE",
         }
      `);
   });
});
