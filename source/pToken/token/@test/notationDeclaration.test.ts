/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { UnexpandedDetails } from '../../types';
import { NotationDeclarationPToken, parseNotationDeclaration } from '../notationDeclaration';

import { EXTERNAL_ID } from '../../../token/common/externalId';
import * as parseUnexpanded from '../../common/parseUnexpanded';
import * as externalId from '../../../token/common/externalId';

describe('notationdeDeclaration (unit)', () => {
   let notationPToken: NotationDeclarationPToken;

   beforeEach(() => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });
   });

   describe('construction', () => {
      it('can overide properties with the second parameter', () => {
         const newPToken = new NotationDeclarationPToken(notationPToken, {
            open: toSToken('1'),
            openSpace: toSToken('2'),
            declType: undefined,
            name: toSToken('3'),
            nameSpace: undefined,
         });

         expect(newPToken).toEqual(
            new NotationDeclarationPToken({
               open: toSToken('1'),
               openSpace: toSToken('2'),
               declType: undefined,
               declTypeSpace: toSToken(' '),
               name: toSToken('3'),
               nameSpace: undefined,
               externalIdSpace: toSToken(' '),
               close: toSToken('>'),
            }),
         );
      });
   });
   describe('parseNotationDeclaration()', () => {
      let callback: jasmine.Spy;
      let externalIDParseSpy: jasmine.Spy;
      let parseUnexpSpy: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         externalIDParseSpy = spyOn(externalId, 'parseExternalId');
         externalIDParseSpy.and.callFake(
            (_1: any, _2: any, allowPERefs: boolean, cb: (arg: any) => void) => {
               cb({ externalId: { type: EXTERNAL_ID } });
            },
         );

         parseUnexpSpy = spyOn(parseUnexpanded, 'parseUnexpanded');

         parseUnexpSpy.and.callFake(
            (source: STokenSource, name: string, cb: (result: undefined) => void) => {
               cb(undefined);
            },
         );
      });

      it('calls externalId.parse()', () => {
         const mockSource = new MockSTokenSource([
            ['name', 'word', ['>']],
            [undefined, 'space'],
            [undefined, 'space'],
            ['>', 'match', '>'],
         ]);

         parseNotationDeclaration(mockSource, notationPToken, callback);
         mockSource.respondInAsyncTime();

         expect(externalIDParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(externalIDParseSpy.calls.argsFor(0)[1]).toEqual(['>']);
         expect(externalIDParseSpy.calls.argsFor(0)[2]).toEqual(true);
         expect(externalIDParseSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
      });

      it('does a simple parse', () => {
         const mockSource = new MockSTokenSource([
            ['notationName', 'word', ['>']],
            [undefined, 'space'],
            // Skipping externalId parsing here
            [undefined, 'space'],
            ['>', 'match', '>'],
         ]);

         parseNotationDeclaration(
            mockSource,
            {
               open: toSToken('<!'),
            },
            callback,
         );
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqualRangeless(
            new NotationDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('notationName'),
               nameSpace: undefined,
               externalId: {
                  type: EXTERNAL_ID,
               },
               externalIdSpace: undefined,
               close: toSToken('>'),
            }),
         );
      });

      it('parses a parameter entity reference instead of the name', () => {
         parseUnexpSpy.and.callFake(
            (
               source: STokenSource,
               name: string,
               cb: (result: UnexpandedDetails | undefined) => void,
            ) => {
               cb({
                  tokens: [],
                  propName: 'fred',
               });
            },
         );
         notationPToken = new NotationDeclarationPToken({
            open: toSToken('<!'),
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([['>', 'match', '>']]);

         parseNotationDeclaration(
            mockSource,
            {
               open: toSToken('<!'),
            },
            callback,
         );
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqualRangeless(
            new NotationDeclarationPToken({
               open: toSToken('<!'),
               name: undefined,
               nameSpace: undefined,
               externalId: undefined,
               externalIdSpace: undefined,
               unexpanded: {
                  tokens: [],
                  propName: 'fred',
               },
               close: toSToken('>'),
            }),
         );
      });

      it('parses a parameter entity reference after the externalId', () => {
         const results = [
            undefined,
            {
               tokens: [],
               propName: 'fred',
            },
         ];
         parseUnexpSpy.and.callFake(
            (
               source: STokenSource,
               name: string,
               cb: (result: UnexpandedDetails | undefined) => void,
            ) => {
               cb(results.shift());
            },
         );
         externalIDParseSpy.and.callFake(
            (_1: any, _2: any, allowPERefs: boolean, cb: (arg: any) => void) => {
               cb({ externalId: { type: EXTERNAL_ID }, nextPropName: 'george' });
            },
         );
         notationPToken = new NotationDeclarationPToken({
            open: toSToken('<!'),
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            ['theName', 'word', ['>']],
            ['\t', 'space'],
            ['>', 'match', '>'],
         ]);

         parseNotationDeclaration(
            mockSource,
            {
               open: toSToken('<!'),
            },
            callback,
         );
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqualRangeless(
            new NotationDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('theName'),
               nameSpace: toSToken('\t'),
               externalId: { type: EXTERNAL_ID },
               externalIdSpace: undefined,
               unexpanded: {
                  tokens: [],
                  propName: 'fred',
               },
               close: toSToken('>'),
            }),
         );
      });
   });
});
