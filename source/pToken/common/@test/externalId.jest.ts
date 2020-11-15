/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import { ExternalIdP, parseExternalId, resumeParseExternalId } from '../externalId';

import literal, { LiteralPToken } from '../../../token/common/literal'; // ick
import { TextPToken } from 'token';

jest.mock('../../../token/common/literal');

describe('ExternalId (unit)', () => {
   let callback: jest.Mock;
   let literalParse: jest.Mock;

   beforeEach(() => {
      callback = jest.fn();
      literalParse = literal.parse as jest.Mock;
      literalParse.mockImplementation((_1: any, options: any, callback: () => void) => {
         callback();
      });
   });

   describe('ExternalId()', () => {
      let source: ExternalIdP;

      beforeEach(() => {
         source = new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: {
               value: [],
            },
            publicSpace: toSToken(' '),
            system: {
               value: [],
            },
         });
      });

      it('copies the provided external ID', () => {
         const extId = new ExternalIdP(source);

         expect(extId).toEqual(source);
         expect(extId).not.toBe(source);
      });

      it('overrides the values with those from other', () => {
         const extId = new ExternalIdP(source, {
            externalType: toSToken('FROG'),
            externalTypeSpace: toSToken('\n\n'),
            public: {
               value: [new TextPToken({ text: toSToken('newPublic') })],
            },
            publicSpace: toSToken('\t\t'),
            system: {
               value: [new TextPToken({ text: toSToken('newSys') })],
            },
         });

         expect(extId).toEqual({
            externalType: toSToken('FROG'),
            externalTypeSpace: toSToken('\n\n'),
            public: {
               value: [new TextPToken({ text: toSToken('newPublic') })],
            },
            publicSpace: toSToken('\t\t'),
            system: {
               value: [new TextPToken({ text: toSToken('newSys') })],
            },
         });
      });

      it('makes a copy of the public value', () => {
         const publicValue: LiteralPToken = { value: [] };
         const extId = new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: publicValue,
            publicSpace: toSToken(' '),
            system: undefined,
         });

         expect(extId.public?.value).toEqual(publicValue.value);
         expect(extId.public?.value).not.toBe(publicValue.value);
      });

      it('makes a copy of the system value', () => {
         const systemValue: LiteralPToken = { value: [] };
         const extId = new ExternalIdP({
            externalType: toSToken('PUBLIC'),
            externalTypeSpace: toSToken(' '),
            public: undefined,
            publicSpace: toSToken(' '),
            system: systemValue,
         });

         expect(extId.system?.value).toEqual(systemValue.value);
         expect(extId.system?.value).not.toBe(systemValue.value);
      });
   });

   describe('parseExternalId()', () => {
      let mockSource: MockSTokenSource;

      it('returns simple values', () => {
         literalParse.mockImplementation(
            (_1: any, options: any, callback: (result: any) => void) => {
               callback({ value: [] });
            },
         );
         mockSource = new MockSTokenSource([
            [undefined, 'peekChar'],
            ['PUBLIC', 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [' ', 'space'],
            // literal
            [undefined, 'peekChar'],
            [' ', 'space'],
            [undefined, 'peekChar'],
         ]);
         parseExternalId(mockSource, [], callback);
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

         parseExternalId(mockSource, [], callback);
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

         parseExternalId(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('returns nothing if the first word is not SYSTEM or PUBLIC', () => {
         mockSource = new MockSTokenSource([
            [undefined, 'peekChar'],
            [MockSTokenSource.PEEK('BOGUS!'), 'peekWord', ['"', "'"]],
         ]);

         parseExternalId(mockSource, [], callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith();
      });

      it('does not mind if public is in the wrong case', () => {
         literalParse.mockImplementation(
            (_1: any, options: any, callback: (result: any) => void) => {
               callback({ value: [] });
            },
         );
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

         parseExternalId(mockSource, [], callback);
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
         literalParse.mockImplementation(
            (_1: any, options: any, callback: (result: any) => void) => {
               mockSource.respondInAsyncTime();
               callback(undefined);
            },
         );
         mockSource = new MockSTokenSource([
            [undefined, 'peekChar'],
            ['PUBLIC', 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [' ', 'space'],
            [undefined, 'peekChar'],
            // literal
         ]);

         parseExternalId(mockSource, [], callback);
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
         literalParse.mockImplementation(
            (_1: any, options: any, callback: (result: any) => void) => {
               callback(results.shift());
            },
         );
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

         parseExternalId(mockSource, [], callback);
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
            // literal
            [undefined, 'space'],
            [undefined, 'peekChar'],
            // literal
         ]);

         parseExternalId(mockSource, [], callback);
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

            parseExternalId(mockSource, [], callback);
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

            parseExternalId(mockSource, [], callback);
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

            parseExternalId(mockSource, [], callback);
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

   describe('resumeParseExternalId()', () => {
      [false, true].forEach((withSpace) => {
         const suffix = withSpace ? '' : ' with leading space';
         const sourceStr = withSpace ? undefined : toSToken('\t');
         const destStr = withSpace ? toSToken(' ') : toSToken(' \t');

         it(`copes with not finding an external type${suffix}`, (done) => {
            const mockSource = new MockSTokenSource([['BOGUS', 'peekWord', ['"', "'"]]]);

            resumeParseExternalId(mockSource, 'externalType', sourceStr, undefined, (result) => {
               expect(result).toEqualRangeless({
                  preSpace: sourceStr,
                  externalId: undefined,
               });
               done();
            });
            mockSource.respondInAsyncTime();
         });

         it(`adds an externalType${suffix}`, (done) => {
            const mockSource = new MockSTokenSource([
               ['PUBLIC', 'peekWord', ['"', "'"]],
               ['PUBLIC', 'word', ['"', "'"]],
               [' ', 'space'],
               // Find the public value
            ]);

            resumeParseExternalId(mockSource, 'externalType', sourceStr, undefined, (result) => {
               expect(result).toEqualRangeless({
                  preSpace: sourceStr,
                  externalId: new ExternalIdP({
                     externalType: toSToken('PUBLIC'),
                     externalTypeSpace: toSToken(' '),
                     public: undefined,
                     publicSpace: undefined,
                     system: undefined,
                  }),
               });
               done();
            });
            mockSource.respondInAsyncTime();
         });

         it(`adds an externalType with a system${suffix}`, (done) => {
            literalParse.mockImplementation((_1: any, options: any, cb: (arg: any) => void) => {
               cb({ value: [] });
            });
            const mockSource = new MockSTokenSource([
               ['SYSTEM', 'peekWord', ['"', "'"]],
               ['SYSTEM', 'word', ['"', "'"]],
               [' ', 'space'],
               // Find the system value
            ]);

            resumeParseExternalId(mockSource, 'externalType', sourceStr, undefined, (result) => {
               expect(result).toEqualRangeless({
                  preSpace: sourceStr,
                  externalId: new ExternalIdP({
                     externalType: toSToken('SYSTEM'),
                     externalTypeSpace: toSToken(' '),
                     public: undefined,
                     publicSpace: undefined,
                     system: { value: [] },
                  }),
               });
               done();
            });
            mockSource.respondInAsyncTime();
         });

         it(`adds a public value${suffix}`, (done) => {
            literalParse.mockImplementation((_1: any, options: any, cb: (arg: any) => void) => {
               cb({ value: [] });
            });
            const mockSource = new MockSTokenSource([
               // Find the public value
               ['\n', 'space'],
               // Find the system value
            ]);

            resumeParseExternalId(
               mockSource,
               'public',
               sourceStr,
               {
                  externalType: toSToken('PUBLIC'),
                  externalTypeSpace: toSToken(' '),
               },
               (result) => {
                  expect(result).toEqualRangeless({
                     externalId: new ExternalIdP({
                        externalType: toSToken('PUBLIC'),
                        externalTypeSpace: destStr,
                        public: {
                           value: [],
                        },
                        publicSpace: toSToken('\n'),
                        system: {
                           value: [],
                        },
                     }),
                  });
                  done();
               },
            );
            mockSource.respondInAsyncTime();
         });

         it(`adds an absent public value${suffix}`, (done) => {
            const mockSource = new MockSTokenSource([
               // Find the public value
            ]);

            resumeParseExternalId(
               mockSource,
               'public',
               sourceStr,
               {
                  externalType: toSToken('PUBLIC'),
                  externalTypeSpace: toSToken(' '),
               },
               (result) => {
                  expect(result).toEqualRangeless({
                     externalId: new ExternalIdP({
                        externalType: toSToken('PUBLIC'),
                        externalTypeSpace: destStr,
                        public: undefined,
                        publicSpace: undefined,
                     }),
                  });
                  done();
               },
            );
            mockSource.respondInAsyncTime();
         });

         it(`adds a system value to a PUBLIC ExternalId${suffix}`, (done) => {
            const mockSource = new MockSTokenSource([
               // Find the system value
            ]);

            resumeParseExternalId(
               mockSource,
               'system',
               sourceStr,
               {
                  externalType: toSToken('PUBLIC'),
                  publicSpace: toSToken(' '),
               },
               (result) => {
                  expect(result).toEqualRangeless({
                     externalId: new ExternalIdP({
                        externalType: toSToken('PUBLIC'),
                        public: undefined,
                        publicSpace: destStr,
                     }),
                  });
                  done();
               },
            );
            mockSource.respondInAsyncTime();
         });

         it(`adds a system value to a SYSTEM ExternalId${suffix}`, (done) => {
            const mockSource = new MockSTokenSource([
               // Find the system value
            ]);

            resumeParseExternalId(
               mockSource,
               'system',
               sourceStr,
               {
                  externalType: toSToken('SYSTEM'),
                  externalTypeSpace: toSToken(' '),
               },
               (result) => {
                  expect(result).toEqualRangeless({
                     externalId: new ExternalIdP({
                        externalType: toSToken('SYSTEM'),
                        externalTypeSpace: destStr,
                     }),
                  });
                  done();
               },
            );
            mockSource.respondInAsyncTime();
         });
      });
   });
});
