/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import { ParameterEntityReferencePToken } from 'pToken';
import { MockSTokenSource } from 'pToken-test';

import * as peReference from '../../../pToken/token/parameterEntityReference';
import * as cdata from '../../cdata';
import * as conditional from '../../conditionalStart';
import { SectionStart, parseSection } from '../section';

describe('section (unit)', () => {
   let sectionStart: SectionStart;

   beforeEach(() => {
      sectionStart = {
         open: toSToken('<!['),
         openSpace: toSToken(' '),
         sectionType: toSToken('CDATA'),
         sectionTypeSpace: toSToken(' '),
      };
   });

   describe('parseSection()', () => {
      let mockSource: MockSTokenSource;
      let callback: jasmine.Spy;
      let peRef: ParameterEntityReferencePToken;

      beforeEach(() => {
         peRef = new ParameterEntityReferencePToken({
            open: toSToken('%'),
         });
         callback = jasmine.createSpy('callbackSpy');
         spyOn(cdata, 'parseCdata').and.callFake((_1: any, start: any, cb: (x: any) => void) => {
            cb(start);
         });
         spyOn(conditional, 'parseConditional').and.callFake(
            (_1: any, start: any, cb: (x: any) => void) => {
               cb(start);
            },
         );
         spyOn(peReference, 'parseParameterEntityReference').and.callFake(
            (_1: any, cb: (x: any) => void) => {
               cb(peRef);
            },
         );
      });

      it('delivers a section start for CDATA', () => {
         mockSource = new MockSTokenSource([
            [' ', 'space'],
            [MockSTokenSource.PEEK('C'), 'peekChar'],
            ['CDATA', 'word', ['[', '>']],
            [' ', 'space'],
         ]);

         parseSection(mockSource, sectionStart.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(sectionStart);
      });

      it('delivers a section start for non-CDATA value', () => {
         mockSource = new MockSTokenSource([
            [' ', 'space'],
            [MockSTokenSource.PEEK('S'), 'peekChar'],
            ['SUPER', 'word', ['[', '>']],
            [' ', 'space'],
         ]);

         parseSection(mockSource, sectionStart.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            sectionType: toSToken('SUPER'),
            sectionTypeSpace: toSToken(' '),
         });
      });

      it('delivers a section start with a parameter entity reference', () => {
         mockSource = new MockSTokenSource([
            [' ', 'space'],
            [MockSTokenSource.PEEK('%'), 'peekChar'],
            // parameter entity reference would
            [' ', 'space'],
         ]);

         parseSection(mockSource, sectionStart.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            unexpanded: {
               peRef,
               propName: 'sectionType',
            },
         });
      });

      it('copes with EOF', () => {
         mockSource = new MockSTokenSource([undefined, undefined, undefined, undefined]);

         parseSection(mockSource, sectionStart.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless({
            open: toSToken('<!['),
         });
      });
   });
});
