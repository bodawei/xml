/* Copyright ® 2017-2026 by 柏大衛. All rights reserved. */

import base from '../base';

describe('base', () => {
   describe('BaseParsedToken', () => {
      it('does not assign properties from prototype', () => {
         const parent = { parent: true };
         function Child(this: any) {
            this.child = true;
         }
         Child.prototype = parent;
         const child = new (Child as any)();

         const baseValue = new base.PToken('foo', child);

         expect(baseValue.child).toEqual(true);
         expect(baseValue.parent).toBeUndefined();
      });
   });
});
