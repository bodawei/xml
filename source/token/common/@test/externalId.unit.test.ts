/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';

import unassigned from '../unassigned';
import { UnassignedArray } from '../unassigned';

import literal from '../literal';
import { EXTERNAL_ID, parseExternalId, getSTokens } from '../externalId';

describe('externalId (unit)', () => {
   describe('parse()', () => {
      let mockSource: MockSTokenSource;
      let callback: jasmine.Spy;
      let expectedSToken: STokenMaker;
      let literalParseSpy: jasmine.Spy;
      let unCheck: jasmine.Spy;

      beforeEach(() => {
         expectedSToken = makeSTokenMaker();
         callback = jasmine.createSpy('literalParseSpy');
         literalParseSpy = spyOn(literal, 'parse').and.callFake(
            (_1, options, callback: Function) => {
               callback();
            },
         );
         unCheck = spyOn(unassigned, 'makeCheckCallback').and.callFake(
            (_1, _2, _3, cb: (values?: UnassignedArray) => void) => cb,
         );
         spyOn(unassigned, 'checkForPERef').and.callFake((_1, cb: Function) => {
            cb();
         });
      });

      it('returns simple values', () => {
         literalParseSpy.and.callFake((_1, options, callback: Function) => {
            callback(options.pToken);
         });
         mockSource = new MockSTokenSource([
            [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [' ', 'space'],
            // literal
            [' ', 'space'],
            [undefined, 'peekWord'],
         ]);
         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([
            [
               {
                  externalId: {
                     type: EXTERNAL_ID,
                     externalType: expectedSToken('PUBLIC'),
                     externalTypeSpace: expectedSToken(' '),
                     public: {
                        value: [],
                     },
                     publicSpace: expectedSToken(' '),
                     system: {
                        value: [],
                     },
                  },
                  peRefPlus: [],
               },
            ],
         ]);
      });

      it('only finds a SystemLiteral if that is all that is offered', () => {
         mockSource = new MockSTokenSource([
            [MockSTokenSource.PEEK('SYSTEM'), 'peekWord', ['"', "'"]],
            ['SYSTEM', 'word', ['"', "'"]],
            [' ', 'space'],
            // literal
            [undefined, 'peekWord'],
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([
            [
               {
                  externalId: {
                     type: EXTERNAL_ID,
                     externalType: expectedSToken('SYSTEM'),
                     externalTypeSpace: expectedSToken(' '),
                     public: undefined,
                     publicSpace: undefined,
                     system: undefined,
                  },
                  peRefPlus: [],
               },
            ],
         ]);
      });

      it('returns nothing if it gets nothing back on first call', () => {
         mockSource = new MockSTokenSource([[undefined, 'peekWord']]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({ peRefPlus: [] });
      });

      it('returns nothing if the first word is not SYSTEM or PUBLIC', () => {
         mockSource = new MockSTokenSource([
            [MockSTokenSource.PEEK('BOGUS!'), 'peekWord', ['"', "'"]],
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toHaveBeenCalledWith({ peRefPlus: [] });
      });

      it('stops if it finds an NDATA after finding the PublicId', () => {
         literalParseSpy.and.callFake((_1, options, callback: Function) => {
            callback(options.pToken);
         });
         mockSource = new MockSTokenSource([
            [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [' ', 'space'],
            // literal
            [' ', 'space'],
            ['NDATA', 'peekWord', ['"', "'"]],
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([
            [
               {
                  externalId: {
                     type: EXTERNAL_ID,
                     externalType: expectedSToken('PUBLIC'),
                     externalTypeSpace: expectedSToken(' '),
                     public: {
                        value: [],
                     },
                     publicSpace: expectedSToken(' '),
                     system: undefined,
                  },
                  peRefPlus: [],
               },
            ],
         ]);
      });

      it('does not mind if public or ndata are the wrong case', () => {
         literalParseSpy.and.callFake((_1, options, callback: Function) => {
            callback(options.pToken);
         });
         mockSource = new MockSTokenSource([
            [MockSTokenSource.PEEK('pUbLiC'), 'peekWord', ['"', "'"]],
            ['pUbLiC', 'word', ['"', "'"]],
            [' ', 'space'],
            // literal
            [' ', 'space'],
            ['nData', 'peekWord', ['"', "'"]],
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([
            [
               {
                  externalId: {
                     type: EXTERNAL_ID,
                     externalType: expectedSToken('pUbLiC'),
                     externalTypeSpace: expectedSToken(' '),
                     public: {
                        value: [],
                     },
                     publicSpace: expectedSToken(' '),
                     system: undefined,
                  },
                  peRefPlus: [],
               },
            ],
         ]);
      });

      it('stops if it does not find an open quote', () => {
         literalParseSpy.and.callFake((_1, _2, callback: Function) => {
            mockSource.respondInAsyncTime();
            callback();
         });
         mockSource = new MockSTokenSource([
            [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [' ', 'space'],
            // literal
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([
            [
               {
                  externalId: {
                     type: EXTERNAL_ID,
                     externalType: expectedSToken('PUBLIC'),
                     externalTypeSpace: expectedSToken(' '),
                     public: undefined,
                     publicSpace: undefined,
                     system: undefined,
                  },
                  peRefPlus: [],
               },
            ],
         ]);
      });

      it('does not mind if, illegally, no space between PUBLIC and PublicLiteral', () => {
         let didPublic = false;
         literalParseSpy.and.callFake((_1, options, callback: Function) => {
            if (!didPublic) {
               didPublic = true;
               callback(options.pToken);
            } else {
               callback();
            }
         });
         mockSource = new MockSTokenSource([
            [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [undefined, 'space'],
            // literal
            [' ', 'space'],
            [undefined, 'peekWord'], // check for ndata
            // literal
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([
            [
               {
                  externalId: {
                     type: EXTERNAL_ID,
                     externalType: expectedSToken('PUBLIC'),
                     externalTypeSpace: undefined,
                     public: {
                        value: [],
                     },
                     publicSpace: expectedSToken(' '),
                     system: undefined,
                  },
                  peRefPlus: [],
               },
            ],
         ]);
      });

      it('does not mind if, illegally, no space between public and system literals', () => {
         literalParseSpy.and.callFake((_1, options, callback: Function) => {
            callback(options.pToken);
         });
         mockSource = new MockSTokenSource([
            [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
            ['PUBLIC', 'word', ['"', "'"]],
            [' ', 'space'],
            // literal
            [undefined, 'space'],
            ['"foo"', 'peekWord'], // check for ndata
            // literal
         ]);

         parseExternalId(mockSource, [], true, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([
            [
               {
                  externalId: {
                     type: EXTERNAL_ID,
                     externalType: expectedSToken('PUBLIC'),
                     externalTypeSpace: expectedSToken(' '),
                     public: {
                        value: [],
                     },
                     publicSpace: undefined,
                     system: {
                        value: [],
                     },
                  },
                  peRefPlus: [],
               },
            ],
         ]);
      });

      // White box: Not testing the same cases for missing parts of the system value as this is the same code

      describe('parameter entity reference', () => {
         it('sets up to let unassigned handle checking for a PE Reference', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unCheck.and.returnValue(checkCallbackSpy);
            mockSource = new MockSTokenSource([]);

            parseExternalId(mockSource, [], true, callback);
            mockSource.respondInAsyncTime();

            expect(unCheck.calls.argsFor(0)[0]).toEqual({
               type: EXTERNAL_ID,
               peRefPlus: [],
            });
            expect(unCheck.calls.argsFor(0)[1]).toEqual('externalType');
            expect(unCheck.calls.argsFor(0)[2]).toBeInstanceOf(Function);
            expect(unCheck.calls.argsFor(0)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });

         it('sets up unassigned to check for PERef for the public value', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unCheck.and.callFake(
               (_1: any, type: string, deliver: Function, otherwise: Function) => {
                  if (type === 'externalType') {
                     return () => otherwise();
                  } else {
                     return checkCallbackSpy;
                  }
               },
            );
            mockSource = new MockSTokenSource([
               [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
               ['PUBLIC', 'word', ['"', "'"]],
               [undefined, 'space'],
            ]);

            parseExternalId(mockSource, [], true, callback);
            mockSource.respondInAsyncTime();

            expect(unCheck.calls.argsFor(1)[0]).toEqual({
               type: EXTERNAL_ID,
               peRefPlus: [],
               externalType: expectedSToken('PUBLIC'),
               externalTypeSpace: undefined,
            });
            expect(unCheck.calls.argsFor(1)[1]).toEqual('public');
            expect(unCheck.calls.argsFor(0)[2]).toBeInstanceOf(Function);
            expect(unCheck.calls.argsFor(1)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });

         it('sets up unassigned to check for PERef for the system value', () => {
            const checkCallbackSpy = jasmine.createSpy();
            unCheck.and.callFake(
               (_1: any, type: string, deliver: Function, otherwise: Function) => {
                  if (type === 'externalType' || type === 'public') {
                     return () => otherwise();
                  } else {
                     return checkCallbackSpy;
                  }
               },
            );
            literalParseSpy.and.callFake((_1: any, options: any, callback: Function) => {
               callback(options.pToken);
            });
            mockSource = new MockSTokenSource([
               [MockSTokenSource.PEEK('PUBLIC'), 'peekWord', ['"', "'"]],
               ['PUBLIC', 'word', ['"', "'"]],
               [undefined, 'space'],
               [' ', 'space'],
            ]);

            parseExternalId(mockSource, [], true, callback);
            mockSource.respondInAsyncTime();

            expect(unCheck.calls.argsFor(2)[0]).toEqual({
               type: EXTERNAL_ID,
               peRefPlus: [],
               externalType: expectedSToken('PUBLIC'),
               externalTypeSpace: undefined,
               public: {
                  value: [],
               },
               publicSpace: expectedSToken(' '),
            });
            expect(unCheck.calls.argsFor(2)[1]).toEqual('system');
            expect(unCheck.calls.argsFor(0)[2]).toBeInstanceOf(Function);
            expect(unCheck.calls.argsFor(2)[3]).toBeInstanceOf(Function);
            expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
         });
      });
   });

   describe('getSTokens()', () => {
      beforeEach(() => {
         spyOn(literal, 'getSTokens').and.returnValue([]);
      });

      it('calls literal.getSTokens() for the PUBLIC value', () => {
         const pTokenPart: any = {};

         getSTokens(pTokenPart);

         expect(literal.getSTokens).toHaveBeenCalledWith(pTokenPart.public);
      });

      it('calls literal.getSTokens() for the SYSTEM value', () => {
         const pTokenPart: any = {};

         getSTokens(pTokenPart);

         expect(literal.getSTokens).toHaveBeenCalledWith(pTokenPart.system);
      });

      it('returns the STokens that made up the external ID', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: EXTERNAL_ID,
            peRefPlus: [],
            externalType: expectedSToken('PUBLIC'),
            externalTypeSpace: expectedSToken(' '),
            publicSpace: expectedSToken(' '),
         };

         const results = getSTokens(pTokenPart);

         expect(results).toEqual([
            pTokenPart.externalType,
            pTokenPart.externalTypeSpace,
            pTokenPart.publicSpace,
         ]);
      });

      it('returns an empty array if given nothing', () => {
         const results = getSTokens();

         expect(results).toEqual([]);
      });
   });
});
