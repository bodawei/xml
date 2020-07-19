/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { MockSTokenSource } from 'sToken-test';
import { toSToken } from 'sToken';


import {
   GeneralEntityReferencePToken,
   parseGeneralEntityReference,
} from '../generalEntityReference';

describe('generalEntityReference (unit)', () => {
   let gePToken: GeneralEntityReferencePToken;

   beforeEach(() => {
      gePToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         openSpace: toSToken(' '),
         name: toSToken('entityName'),
         nameSpace: toSToken(' '),
         close: toSToken(';'),
      });
   });

   describe('parseGeneralEntityReference()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a full parse', () => {
         const mockSource = new MockSTokenSource([
            [ ' ', 'space' ],
            [ 'entityName', 'word', [ ';' ] ],
            [ ' ', 'space' ],
            [ ';', 'match', ';' ],
         ]);

         parseGeneralEntityReference(mockSource, toSToken('&'), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(gePToken);
      });

      it('copes with eof mid-stream', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         parseGeneralEntityReference(mockSource, toSToken('&'), callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('&'),
            openSpace: undefined,
            name: undefined,
            nameSpace: undefined,
            close: undefined,
         });
      });
   });

});
