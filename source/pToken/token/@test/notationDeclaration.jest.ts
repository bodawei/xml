/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { STokenSource, toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';
// ick
import * as parseUnexpanded from '../../common/parseUnexpanded';
import * as externalId from '../../common/externalId';

import { UnexpandedMarkupDetails } from '../../types';
import {
   NotationDeclarationPToken,
   parseNotationDeclaration,
   resumeParseNotationDeclaration,
} from '../notationDeclaration';

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
               cb({ externalId: {} });
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
               externalId: {},
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
               cb: (result: UnexpandedMarkupDetails | undefined) => void,
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
               cb: (result: UnexpandedMarkupDetails | undefined) => void,
            ) => {
               cb(results.shift());
            },
         );
         externalIDParseSpy.and.callFake(
            (_1: any, _2: any, allowPERefs: boolean, cb: (arg: any) => void) => {
               cb({ externalId: {}, nextPropName: 'george' });
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
               externalId: {},
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

   describe('resumeParseNotationDeclaration()', () => {
      let externalIDParseSpy: jasmine.Spy;

      beforeEach(() => {
         externalIDParseSpy = spyOn(externalId, 'parseExternalId');
      });

      it('restores everything at and after the name', (done) => {
         const notationDeclaration = new NotationDeclarationPToken({
            open: toSToken('<!'),
            name: undefined,
            nameSpace: undefined,
            externalId: undefined,
            externalIdSpace: undefined,
            unexpanded: {
               tokens: [],
               propName: 'name',
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            ['theName', 'word', ['>']],
            ['\t', 'space'],
            ['\n', 'space'],
            [undefined, 'all'],
         ]);

         externalIDParseSpy.and.callFake(
            (_1: any, _2: any, allowPERefs: boolean, cb: (arg: any) => void) => {
               cb({ externalId: {} });
            },
         );

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            expect(result).toEqualRangeless(
               new NotationDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken('theName'),
                  nameSpace: toSToken('\t'),
                  externalId: {},
                  externalIdSpace: toSToken('\n'),
                  unexpanded: {
                     tokens: [],
                     propName: 'name',
                  },
                  close: toSToken('>'),
               }),
            );

            done();
         });

         mockSource.respondInAsyncTime();
      });

      it('restores everything at and after some part of the external ID', (done) => {
         const notationDeclaration = new NotationDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('aName'),
            nameSpace: toSToken(' '),
            externalId: undefined,
            externalIdSpace: undefined,
            unexpanded: {
               tokens: [],
               propName: 'externalType',
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            ['\t\t', 'space'],
            [undefined, 'all'],
         ]);

         externalIDParseSpy.and.callFake(
            (_1: any, _2: any, allowPERefs: boolean, cb: (arg: any) => void) => {
               cb({ externalId: {} });
            },
         );

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            expect(result).toEqualRangeless(
               new NotationDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken('aName'),
                  nameSpace: toSToken(' '),
                  externalId: {},
                  externalIdSpace: toSToken('\t\t'),
                  unexpanded: {
                     tokens: [],
                     propName: 'externalType',
                  },
                  close: toSToken('>'),
               }),
            );

            done();
         });

         mockSource.respondInAsyncTime();
      });

      it('adds any trailing text to the extra', (done) => {
         const notationDeclaration = new NotationDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('aName'),
            nameSpace: toSToken(' '),
            externalId: undefined,
            externalIdSpace: undefined,
            unexpanded: {
               tokens: [],
               propName: 'externalType',
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            ['\t\t', 'space'],
            ['blah', 'all'],
         ]);

         externalIDParseSpy.and.callFake(
            (_1: any, _2: any, allowPERefs: boolean, cb: (arg: any) => void) => {
               cb({ externalId: {} });
            },
         );

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            expect(result).toEqualRangeless(
               new NotationDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken('aName'),
                  nameSpace: toSToken(' '),
                  externalId: {},
                  externalIdSpace: toSToken('\t\t'),
                  unexpanded: {
                     tokens: [],
                     propName: 'externalType',
                  },
                  extra: toSToken('blah'),
                  close: toSToken('>'),
               }),
            );

            done();
         });

         mockSource.respondInAsyncTime();
      });
   });
});
