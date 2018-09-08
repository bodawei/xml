/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import base from '../base';

describe('base', () => {

   describe('BaseParsedToken', () => {

      it('does not assign properties from prototype', () => {
         const parent = { parent: true };
         function Child() {
            this.child = true;
         }
         Child.prototype = parent;
         const child = new Child();
         
         const baseValue = new base.PToken('foo', child);

         expect(baseValue.child).toEqual(true);
         expect(baseValue.parent).toBeUndefined();
      });

   });

});
