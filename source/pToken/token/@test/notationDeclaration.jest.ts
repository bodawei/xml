/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'basic';
import { MockSTokenSource } from 'pToken-test';

import * as parseUnexpanded from '../../common/parseUnexpanded';
import * as externalId from '../../common/externalId';

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
      let callback: jest.MockedFunction<(pToken: NotationDeclarationPToken) => void>;
      let externalIDParseSpy: jest.MockedFunction<typeof externalId.parseExternalId>;
      let parseUnexpSpy: jest.MockedFunction<typeof parseUnexpanded.parseUnexpanded>;

      beforeEach(() => {
         callback = jest.fn();
         externalIDParseSpy = jest.spyOn(externalId, 'parseExternalId') as jest.MockedFunction<
            typeof externalId.parseExternalId
         >;
         externalIDParseSpy.mockImplementation((_1, _2, cb) => {
            cb({ externalId: {} });
         });

         parseUnexpSpy = jest.spyOn(parseUnexpanded, 'parseUnexpanded') as jest.MockedFunction<
            typeof parseUnexpanded.parseUnexpanded
         >;
         parseUnexpSpy.mockImplementation((source, name, cb) => {
            cb(undefined);
         });
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

         expect(externalIDParseSpy.mock.calls[0][0]).toEqual(mockSource);
         expect(externalIDParseSpy.mock.calls[0][1]).toEqual(['>']);
         expect(externalIDParseSpy.mock.calls[0][2]).toEqual(expect.any(Function));
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

         // @ts-expect-error 2329/matchers
         expect(callback.mock.calls[0][0]).toEqualRangeless(
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
         parseUnexpSpy.mockImplementation((source, name, cb) => {
            cb({
               tokens: [],
               propName: 'fred',
            });
         });
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

         // @ts-expect-error 2329/matchers
         expect(callback.mock.calls[0][0]).toEqualRangeless(
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

      it('parses a close if no external ID', () => {
         notationPToken = new NotationDeclarationPToken({
            open: toSToken('<!'),
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            ['notationName', 'word', ['>']],
            [undefined, 'space'],
            // externalId parsing here
            [undefined, 'space'],
            ['>', 'match', '>'],
         ]);
         externalIDParseSpy.mockImplementation((_1, _2, cb) => {
            cb(undefined);
         });

         parseNotationDeclaration(
            mockSource,
            {
               open: toSToken('<!'),
            },
            callback,
         );
         mockSource.respondInAsyncTime();

         // @ts-expect-error 2329/matchers
         expect(callback.mock.calls[0][0]).toEqualRangeless(
            new NotationDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('notationName'),
               nameSpace: undefined,
               externalId: undefined,
               externalIdSpace: undefined,
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
         parseUnexpSpy.mockImplementation((source, name, cb) => {
            cb(results.shift());
         });
         externalIDParseSpy.mockImplementation((_1, _2, cb) => {
            cb({ externalId: {}, nextPropName: 'george' });
         });
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

         // @ts-expect-error 2329/matchers
         expect(callback.mock.calls[0][0]).toEqualRangeless(
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

      it('parses a parameter entity reference after a complete externalId', () => {
         const results = [
            undefined,
            {
               tokens: [],
               propName: 'trailing',
            },
         ];
         parseUnexpSpy.mockImplementation((source, name, cb) => {
            cb(results.shift());
         });
         externalIDParseSpy.mockImplementation((_1, _2, cb) => {
            cb({ externalId: {} });
         });
         notationPToken = new NotationDeclarationPToken({
            open: toSToken('<!'),
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([
            ['theName', 'word', ['>']],
            ['\t', 'space'],
            ['\n', 'space'],
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

         // @ts-expect-error 2329/matchers
         expect(callback.mock.calls[0][0]).toEqualRangeless(
            new NotationDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('theName'),
               nameSpace: toSToken('\t'),
               externalId: {},
               externalIdSpace: toSToken('\n'),
               unexpanded: {
                  tokens: [],
                  propName: 'trailing',
               },
               close: toSToken('>'),
            }),
         );
      });
   });

   describe('resumeParseNotationDeclaration()', () => {
      let resumeParseSpy: jest.MockedFunction<typeof externalId.resumeParseExternalId>;

      beforeEach(() => {
         resumeParseSpy = jest.spyOn(externalId, 'resumeParseExternalId') as jest.MockedFunction<
            typeof externalId.resumeParseExternalId
         >;
         resumeParseSpy.mockImplementation((_1, _2, _3, _4, cb) => {
            cb({ externalId: {} });
         });
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
            [undefined, 'space'],
            ['theName', 'word', ['>']],
            ['\t', 'space'],
            ['\n', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            // @ts-expect-error 2329/matchers
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

      it('restores everything at and after the name with a leading space', (done) => {
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
            ['\n', 'space'],
            ['theName', 'word', ['>']],
            ['\t', 'space'],
            ['\n', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new NotationDeclarationPToken({
                  open: toSToken('<!'),
                  declTypeSpace: toSToken('\n'),
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
            [undefined, 'space'],
            ['\t\t', 'space'],
            [undefined, 'all'],
         ]);

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            // @ts-expect-error 2329/matchers
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

      it('adds trailing space', (done) => {
         const notationDeclaration = new NotationDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('aName'),
            nameSpace: toSToken(' '),
            externalId: {},
            externalIdSpace: toSToken('\t\t'),
            unexpanded: {
               tokens: [],
               propName: 'trailing',
            },
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([['\n', 'space']]);

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            // @ts-expect-error 2329/matchers
            expect(result).toEqualRangeless(
               new NotationDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken('aName'),
                  nameSpace: toSToken(' '),
                  externalId: {},
                  externalIdSpace: toSToken('\t\t\n'),
                  unexpanded: {
                     tokens: [],
                     propName: 'trailing',
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
            [undefined, 'space'],
            ['\t\t', 'space'],
            ['blah', 'all'],
         ]);

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            // @ts-expect-error 2329/matchers
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

      it('does no harm when there is nothing in the unexpanded', (done) => {
         const notationDeclaration = new NotationDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('aName'),
            nameSpace: toSToken(' '),
            externalId: undefined,
            externalIdSpace: undefined,
            unexpanded: undefined,
            close: toSToken('>'),
         });
         const mockSource = new MockSTokenSource([[undefined, 'space']]);

         resumeParseNotationDeclaration(mockSource, notationDeclaration, (result) => {
            expect(result).toBe(notationDeclaration);

            done();
         });

         mockSource.respondInAsyncTime();
      });
   });
});
