/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import literal from '../../../token/common/literal'; // ick

import { parseExternalId } from '../externalId';

jest.mock('../../../token/common/literal');

describe('parseExternalId()', () => {
   let mockSource: MockSTokenSource;
   let callback: jest.Mock;
   let literalParse: jest.Mock;

   beforeEach(() => {
      callback = jest.fn();
      literalParse = literal.parse as jest.Mock;
      literalParse.mockImplementation((_1: any, options: any, callback: () => void) => {
         callback();
      });
   });

   it('returns simple values', () => {
      literalParse.mockImplementation((_1: any, options: any, callback: (result: any) => void) => {
         callback({ value: [] });
      });
      mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
         ['PUBLIC', 'word', ['"', "'"]],
         [' ', 'space'],
         // literal
         [undefined, 'peekChar'],
         [' ', 'space'],
         [undefined, 'peekChar'],
      ]);
      parseExternalId(mockSource, [], true, callback);
      mockSource.respondInAsyncTime();

      expect(callback.mock.calls).toEqualRangeless([
         [
            {
               externalId: {
                  externalType: toSToken('PUBLIC'),
                  externalTypeSpace: toSToken(' '),
                  public: {
                     value: [],
                  },
                  publicSpace: toSToken(' '),
                  system: {
                     value: [],
                  },
               },
            },
         ],
      ]);
   });

   it('only finds a SystemLiteral if that is all that is offered', () => {
      mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [MockSTokenSource.PEEK('SYSTEM'), 'peekWord', ['"', "'"]],
         ['SYSTEM', 'word', ['"', "'"]],
         [' ', 'space'],
         [undefined, 'peekChar'],
      ]);

      parseExternalId(mockSource, [], true, callback);
      mockSource.respondInAsyncTime();

      expect(callback.mock.calls).toEqualRangeless([
         [
            {
               externalId: {
                  externalType: toSToken('SYSTEM'),
                  externalTypeSpace: toSToken(' '),
                  public: undefined,
                  publicSpace: undefined,
                  system: undefined,
               },
            },
         ],
      ]);
   });

   it('returns nothing if it gets nothing back on first call', () => {
      mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [undefined, 'peekWord'],
      ]);

      parseExternalId(mockSource, [], true, callback);
      mockSource.respondInAsyncTime();

      expect(callback).toHaveBeenCalledWith({});
   });

   it('returns nothing if the first word is not SYSTEM or PUBLIC', () => {
      mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [MockSTokenSource.PEEK('BOGUS!'), 'peekWord', ['"', "'"]],
      ]);

      parseExternalId(mockSource, [], true, callback);
      mockSource.respondInAsyncTime();

      expect(callback).toHaveBeenCalledWith({});
   });

   it('does not mind if public is in the wrong case', () => {
      literalParse.mockImplementation((_1: any, options: any, callback: (result: any) => void) => {
         callback({ value: [] });
      });
      mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [MockSTokenSource.PEEK('pUbLiC'), 'peekWord', ['"', "'"]],
         ['pUbLiC', 'word', ['"', "'"]],
         [' ', 'space'],
         // literal
         [undefined, 'peekChar'],
         [' ', 'space'],
         [undefined, 'peekChar'],
      ]);

      parseExternalId(mockSource, [], true, callback);
      mockSource.respondInAsyncTime();

      expect(callback.mock.calls).toEqualRangeless([
         [
            {
               externalId: {
                  externalType: toSToken('pUbLiC'),
                  externalTypeSpace: toSToken(' '),
                  public: {
                     value: [],
                  },
                  publicSpace: toSToken(' '),
                  system: {
                     value: [],
                  },
               },
            },
         ],
      ]);
   });

   it('stops if it does not find an open quote', () => {
      literalParse.mockImplementation((_1: any, options: any, callback: (result: any) => void) => {
         mockSource.respondInAsyncTime();
         callback(undefined);
      });
      mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
         ['PUBLIC', 'word', ['"', "'"]],
         [' ', 'space'],
         [undefined, 'peekChar'],
         // literal
      ]);

      parseExternalId(mockSource, [], true, callback);
      mockSource.respondInAsyncTime();

      expect(callback.mock.calls).toEqualRangeless([
         [
            {
               externalId: {
                  externalType: toSToken('PUBLIC'),
                  externalTypeSpace: toSToken(' '),
                  public: undefined,
                  publicSpace: undefined,
                  system: undefined,
               },
            },
         ],
      ]);
   });

   it('does not mind if, illegally, no space between PUBLIC and PublicLiteral', () => {
      const results = [{ value: [] }];
      literalParse.mockImplementation((_1: any, options: any, callback: (result: any) => void) => {
         callback(results.shift());
      });
      mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
         ['PUBLIC', 'word', ['"', "'"]],
         [undefined, 'space'],
         // literal
         [undefined, 'peekChar'],
         [' ', 'space'],
         // literal
         [undefined, 'peekChar'],
      ]);

      parseExternalId(mockSource, [], true, callback);
      mockSource.respondInAsyncTime();

      expect(callback.mock.calls).toEqualRangeless([
         [
            {
               externalId: {
                  externalType: toSToken('PUBLIC'),
                  externalTypeSpace: undefined,
                  public: {
                     value: [],
                  },
                  publicSpace: toSToken(' '),
                  system: undefined,
               },
            },
         ],
      ]);
   });

   it('does not mind if, illegally, no space between public and system literals', () => {
      literalParse.mockImplementation((_1: any, options: any, callback: (result: any) => void) => {
         callback({ value: [] });
      });
      mockSource = new MockSTokenSource([
         [undefined, 'peekChar'],
         [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
         ['PUBLIC', 'word', ['"', "'"]],
         [' ', 'space'],
         [undefined, 'peekChar'],
         // literal
         [undefined, 'space'],
         [undefined, 'peekChar'],
         // literal
      ]);

      parseExternalId(mockSource, [], true, callback);
      mockSource.respondInAsyncTime();

      expect(callback.mock.calls).toEqualRangeless([
         [
            {
               externalId: {
                  externalType: toSToken('PUBLIC'),
                  externalTypeSpace: toSToken(' '),
                  public: {
                     value: [],
                  },
                  publicSpace: undefined,
                  system: {
                     value: [],
                  },
               },
            },
         ],
      ]);
   });

   // White box: Not testing the same cases for missing parts of the system value as this is the same code

   describe('parameter entity reference', () => {
      it('stops if the external type is a peref', () => {
         mockSource = new MockSTokenSource([['%', 'peekChar']]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.mock.calls).toEqualRangeless([
            [
               {
                  externalId: undefined,
                  nextPropName: 'externalType',
               },
            ],
         ]);
      });

      it('stops when finding the public type is an pe ref', () => {
         literalParse.mockImplementation(
            (_1: any, options: any, callback: (result: any) => void) => {
               callback({ value: [] });
            },
         );
         mockSource = new MockSTokenSource([
            [undefined, 'peekChar'],
            [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [' ', 'space'],
            ['%', 'peekChar'],
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.mock.calls).toEqualRangeless([
            [
               {
                  externalId: {
                     externalType: toSToken('PUBLIC'),
                     externalTypeSpace: toSToken(' '),
                     public: undefined,
                     publicSpace: undefined,
                     system: undefined,
                  },
                  nextPropName: 'public',
               },
            ],
         ]);
      });

      it('stops when the system value is a parameter entity reference', () => {
         literalParse.mockImplementation(
            (_1: any, options: any, callback: (result: any) => void) => {
               callback({ value: [] });
            },
         );
         mockSource = new MockSTokenSource([
            [undefined, 'peekChar'],
            [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [' ', 'space'],
            [undefined, 'peekChar'],
            [' ', 'space'],
            ['%', 'peekChar'],
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.mock.calls).toEqualRangeless([
            [
               {
                  externalId: {
                     externalType: toSToken('PUBLIC'),
                     externalTypeSpace: toSToken(' '),
                     public: { value: [] },
                     publicSpace: toSToken(' '),
                     system: undefined,
                  },
                  nextPropName: 'system',
               },
            ],
         ]);
      });
   });
});
