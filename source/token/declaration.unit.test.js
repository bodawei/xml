/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as declaration from './declaration.js';

describe('declaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does not do any other parsing if no declaration type is found', () => {
         const sourceLToken = makeLTokenMaker();
         const expectedLToken = makeLTokenMaker();
         const openLToken = sourceLToken('<!');
         mockSource = new MockLTokenSource([
            sourceLToken(' '),
            undefined,
            undefined,
         ]);

         declaration.parse(mockSource, openLToken, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'GENERICDECL',
            open: expectedLToken('<!'),
            postOpenSpace: expectedLToken(' '),
            declType: undefined,
            postDeclTypeSpace: undefined,
         } ] ]);
      });

   });

});
