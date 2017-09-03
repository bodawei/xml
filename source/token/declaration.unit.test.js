/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import lTokenUtil from '../lToken/test';

import declaration from './declaration.js';

describe('declaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does not do any other parsing if no declaration type is found', () => {
         const openLToken = lTokenUtil.makeLToken('<!');
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken(' '),
            undefined,
            undefined,
         ]);

         declaration.parse(mockSource, openLToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'GENERIC_DECLARATION',
            openLToken: lTokenUtil.makeLToken('<!'),
            postOpenSpaceLToken: lTokenUtil.makeLToken(' '),
            declTypeLToken: undefined,
            postDeclTypeSpaceLToken: undefined,
         } ] ]);
      });

   });

});
