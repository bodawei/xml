/* Copyright ® 2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import * as cdata from '../../cdata';
import { SectionStart, parseSection } from '../section';

describe('section (unit)', () => {
   let sectionStart: SectionStart;

   beforeEach(() => {
      sectionStart = {
         open: SToken.fromString('<!['),
         openSpace: SToken.fromString(' '),
         sectionType: SToken.fromString('CDATA'),
         sectionTypeSpace: SToken.fromString(' '),
      };
   });

   describe('parseSection()', () => {
      let mockSource: MockSTokenSource;
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(cdata, 'parseCdata').and.callFake((_1: any, start: any, cb: (x: any) => void) => {
            cb(start);
         });
      });

      it('does an ordinary full parsing', () => {
         mockSource = new MockSTokenSource([
            [ ' ', 'space' ],
            [ 'CDATA', 'word', [ '[', '>' ] ],
            [ ' ', 'space' ],
         ]);

         parseSection(mockSource, sectionStart.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(sectionStart);
      });

      it('copes with EOF', () => {
         mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         parseSection(mockSource, sectionStart.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: SToken.fromString('<!['),
         });
      });

   });

});
