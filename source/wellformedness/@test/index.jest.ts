/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { fatalErrorCodes } from '../error/fatalErrorCodes';

// import * as wellformedness from '../index';

describe('wellformedness', () => {
   // it('exports several function', () => {
   //    expect(wellformedness).toMatchInlineSnapshot(`
   //       Object {
   //         "ContentChecker": [Function],
   //         "DocumentChecker": [Function],
   //         "MarkupDeclChecker": [Function],
   //         "WellFormedError": [Function],
   //         "Warning": [Function],
   //       }
   //    `);
   // });

   it('adds several errors to the fatalError', () => {
      expect(fatalErrorCodes.id).toMatchInlineSnapshot(`
         {
           "REFERENCE_INVALID_UNPARSED": "REFERENCE_INVALID_UNPARSED",
           "TEXTDECL_INVALID_SPACE": "TEXTDECL_INVALID_SPACE",
           "XMLDECL_INVALID_SPACE": "XMLDECL_INVALID_SPACE",
         }
      `);
   });
});
