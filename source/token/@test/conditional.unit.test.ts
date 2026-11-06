/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */


import { ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';
import { makeParameterEntityReference } from 'token-test';

import { SectionStart } from '../bridge/section';
import { ConditionalStartPToken, parseConditional, resumeParseConditional } from '../conditionalStart';
import * as pToken from '../../pToken/token/parameterEntityReference';

describe('conditional (unit)', () => {
   let sectionStart: SectionStart;
   let peRef: ParameterEntityReferencePToken;
   let parseSpy: jasmine.Spy;

   beforeEach(() => {
      sectionStart = {
         open: toSToken('<!['),
         sectionType: toSToken('IGNORE'),
      };
      peRef = makeParameterEntityReference();
      parseSpy = spyOn(pToken, 'parseParameterEntityReference');
   });

   describe('ConditionalStartPToken()', () => {
      it('populates values with undefined when not specified', () => {
         expect(new ConditionalStartPToken({
            open: toSToken('<!['),
         })).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            sectionType: undefined,
            bracket: undefined,
         }));
      });

      it('populates values with a combination of the base value and the lose values', () => {
         expect(new ConditionalStartPToken({
            open: toSToken('<!['),
         }, {
            sectionType: toSToken('FROG'),
         })).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            sectionType: toSToken('FROG'),
            bracket: undefined,
         }));
      });
   });

   describe('parseConditional()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values if type is IGNORE', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'peekChar'],
            [ '[', 'match', '[' ],
            [ 'test text', 'all', [ '<![', ']]>' ] ],
            [ MockSTokenSource.PEEK(']'), 'peekChar' ],
            [ ']]>', 'match', ']]>' ],
         ]);

         parseConditional(mockSource, sectionStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            sectionType: toSToken('IGNORE'),
            bracket: toSToken('['),
         }));
      });

      it('returns an incomplete parsing if type is INCLUDE', () => {
         sectionStart.sectionType = toSToken('INCLUDE');
         const mockSource = new MockSTokenSource([
            [ undefined, 'peekChar'],
            [ '[', 'match', '[' ],
         ]);

         parseConditional(mockSource, sectionStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            sectionType: toSToken('INCLUDE'),
            bracket: toSToken('['),
         }));
      });

      it('returns a token with a bracket as the propName', () => {
         parseSpy.and.callFake((source, cb) => {
            cb(peRef);
         });
         const mockSource = new MockSTokenSource([
            [ '%', 'peekChar'],
         ]);

         parseConditional(mockSource, sectionStart, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            sectionType: toSToken('IGNORE'),
            unexpanded: {
               peRef,
               propName: 'bracket',
            }
         }));
      });

   });

   describe('resumeParseConditional()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('adds a section type and bracket if available', () => {
         const oldConditional = new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open : toSToken('%')}),
               propName: 'sectionType',
            }
         });
         const mockSource = new MockSTokenSource([
            [ '\t', 'space' ],
            [ 'test', 'word', [ '[', '>' ] ],
            [ '\n', 'space' ],
            [ '[', 'match', '[' ],
         ]);

         resumeParseConditional(mockSource, oldConditional, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken(' \t'),
            sectionType: toSToken('test'),
            sectionTypeSpace: toSToken('\n'),
            bracket: toSToken('['),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open : toSToken('%')}),
               propName: 'sectionType',
            }
         }));
      });

      it('adds a section type and no bracket when not available', () => {
         const oldConditional = new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open : toSToken('%')}),
               propName: 'sectionType',
            }
         });
         const mockSource = new MockSTokenSource([
            [ '\t', 'space' ],
            [ 'test', 'word', [ '[', '>' ] ],
            [ '\n', 'space' ],
            [ undefined, 'match', '[' ],
         ]);

         resumeParseConditional(mockSource, oldConditional, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken(' \t'),
            sectionType: toSToken('test'),
            sectionTypeSpace: toSToken('\n'),
            bracket: undefined,
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open : toSToken('%')}),
               propName: 'sectionType',
               secondPropName: 'bracket',
            }
         }));
      });

      it('adds a bracket when secondPropName is "bracket"', () => {
         const oldConditional = new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            sectionType: toSToken('test'),
            sectionTypeSpace: toSToken('\n'),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open : toSToken('%')}),
               propName: 'sectionType',
               secondPropName: 'bracket',
            }
         });
         const mockSource = new MockSTokenSource([
            [ '\t', 'space' ],
            [ '[', 'match', '[' ],
         ]);

         resumeParseConditional(mockSource, oldConditional, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            sectionType: toSToken('test'),
            sectionTypeSpace: toSToken('\n\t'),
            bracket: toSToken('['),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open : toSToken('%')}),
               propName: 'sectionType',
               secondPropName: 'bracket',
            }
         }));
      });

      it('adds a bracket when propName is "bracket"', () => {
         const oldConditional = new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            sectionType: toSToken('test'),
            sectionTypeSpace: toSToken('\n'),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open : toSToken('%')}),
               propName: 'bracket',
            }
         });
         const mockSource = new MockSTokenSource([
            [ '\t', 'space' ],
            [ '[', 'match', '[' ],
         ]);

         resumeParseConditional(mockSource, oldConditional, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(new ConditionalStartPToken({
            open: toSToken('<!['),
            openSpace: toSToken(' '),
            sectionType: toSToken('test'),
            sectionTypeSpace: toSToken('\n\t'),
            bracket: toSToken('['),
            unexpanded: {
               peRef: new ParameterEntityReferencePToken({ open : toSToken('%')}),
               propName: 'bracket',
            }
         }));
      });

   });

});
