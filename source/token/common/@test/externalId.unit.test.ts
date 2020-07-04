/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData } from 'basic';
import { WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { toSToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from 'sToken-test';
import { ParameterEntityReferencePToken, TextPToken } from 'token';

import unassigned from '../unassigned';
import { UnassignedArray, UnassignedType } from '../unassigned';

import literal from '../literal';
import {
   EXTERNAL_ID,
   parseExternalId,
   getSTokens,
   makeEntityLocation,
   checkExternalIdWellFormed,
   ExternalId,
} from '../externalId';

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

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let pTokenPart: any;
      let litWell: jasmine.Spy;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();

         const expectedSToken = makeSTokenMaker();
         pTokenPart = {
            type: EXTERNAL_ID,
            peRefPlus: [],
            externalType: expectedSToken('PUBLIC'),
            externalTypeSpace: expectedSToken(' '),
            public: {
               openQuote: expectedSToken('"'),
               value: [new TextPToken({ text: expectedSToken('pub.xml') })],
               closeQuote: expectedSToken('"'),
            },
            publicSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [new TextPToken({ text: expectedSToken('sys.xml') })],
               closeQuote: expectedSToken('"'),
            },
         };
         litWell = spyOn(literal, 'checkWellFormed');
      });

      it('calls literal.checkWellFormed() to check the PUBLIC value', () => {
         const emd = new EntityMetaData();
         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, emd);

         expect(litWell.calls.argsFor(0)[0]).toEqual(pTokenPart.public);
         expect(litWell.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(litWell.calls.argsFor(0)[2]).toEqual(emd);
         expect(litWell.calls.argsFor(0)[3]).toEqual(undefined);
         expect(litWell.calls.argsFor(0)[4] instanceof Function).toEqual(true);
      });

      it('calls literal.checkWellFormed() to check the SYSTEM value', () => {
         const emd = new EntityMetaData();
         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, emd);

         expect(litWell.calls.argsFor(1)[0]).toEqual(pTokenPart.system);
         expect(litWell.calls.argsFor(1)[1]).toEqual(mockErrorCollector);
         expect(litWell.calls.argsFor(1)[2]).toEqual(emd);
         expect(litWell.calls.argsFor(1)[3]).toEqual(WellFormedError.ID.NOUN_EXTERNALID_SYSTEM);
         expect(litWell.calls.argsFor(1)[4]).toEqual(undefined);
      });

      it('reports an error if the PUBLIC value has illegal characters', () => {
         pTokenPart.public.value[0].text.str = 'bad&chars';
         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         // invoke the callback function
         litWell.calls.argsFor(0)[4]();

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            params: ['&'],
            position: pTokenPart.publicSpace, // This is only because we call the callback after
         });
      });

      it('reports no errors when no PToken part is passed in', () => {
         checkExternalIdWellFormed(undefined, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports no errors if the public value is undefined (this can not happen naturally)', () => {
         litWell.and.callFake((_1: any, _2: any, _3: any, _4: any, callback: Function) => {
            return callback ? callback() : undefined;
         });
         delete pTokenPart.public.value;
         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if the public value contains invalid characters', () => {
         litWell.and.callFake((_1: any, _2: any, _3: any, _4: any, callback: Function) => {
            return callback ? callback() : undefined;
         });
         pTokenPart.public.value[0].text.str = '{}{}{}{}';

         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_PUBLIC_INVALID_CHARS,
            params: ['{'],
            position: pTokenPart.externalTypeSpace, // wrong due to mocking
         });
      });

      it('reports an error if type is neither PUBLIC or SYSTEM', () => {
         pTokenPart.externalType.str = 'Bogus';

         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_UNKNOWN,
            params: ['Bogus'],
            position: pTokenPart.externalType,
         });
      });

      it('reports an error if type is the wrong case', () => {
         pTokenPart.externalType.str = 'public';

         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_INVALID_CASE,
            params: ['PUBLIC', 'public'],
            position: pTokenPart.externalType,
         });
      });

      it('reports an error if there is no space after the id type', () => {
         delete pTokenPart.externalTypeSpace;

         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_EXTERNALTYPE_NO_SPACE,
            params: undefined,
            lastPosition: pTokenPart.externalType,
         });
      });

      it('reports an error if there is no space after a PUBLIC part', () => {
         delete pTokenPart.publicSpace;

         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.EXTERNALID_SYSTEM_NO_LEADING_SPACE,
            params: undefined,
            lastPosition: pTokenPart.externalTypeSpace, // beccause we are mocking out the quotes call
         });
      });

      it('reports no error if there is no system part', () => {
         delete pTokenPart.system;

         checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('throws no errors if there is no public part', () => {
         litWell.and.callFake((publicOrSystem, _2, _3, _4, callback: Function) => {
            if (!publicOrSystem) {
               callback();
            }
         });
         delete pTokenPart.public;

         expect(() => {
            checkExternalIdWellFormed(pTokenPart, mockErrorCollector, new EntityMetaData());
         }).not.toThrow();
      });
   });

   describe('makeEntityLocation()', () => {
      it('returns an EntityLocation with the public and system ids', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: EXTERNAL_ID,
            peRefPlus: [],
            externalType: expectedSToken('PUBLIC'),
            externalTypeSpace: expectedSToken(' '),
            public: {
               openQuote: expectedSToken('"'),
               value: [new TextPToken({ text: expectedSToken('pub.xml') })],
               closeQuote: expectedSToken('"'),
            },
            publicSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [new TextPToken({ text: expectedSToken('sys.xml') })],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation('sys.xml', 'pub.xml'));
      });

      it('returns an EntityLocation with the system id only if there is no public', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: EXTERNAL_ID,
            peRefPlus: [],
            externalType: expectedSToken('PUBLIC'),
            externalTypeSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [new TextPToken({ text: expectedSToken('sys.xml') })],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation('sys.xml'));
      });

      it('returns an EntityLocation with the public only if there is no system', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: EXTERNAL_ID,
            peRefPlus: [],
            externalType: expectedSToken('PUBLIC'),
            externalTypeSpace: expectedSToken(' '),
            public: {
               openQuote: expectedSToken('"'),
               value: [new TextPToken({ text: expectedSToken('pub.xml') })],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation(undefined, 'pub.xml'));
      });

      it('returns an EntityLocation with the public only if system has no value in its array', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: EXTERNAL_ID,
            peRefPlus: [],
            externalType: expectedSToken('PUBLIC'),
            externalTypeSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [],
               closeQuote: expectedSToken('"'),
            },
            public: {
               openQuote: expectedSToken('"'),
               value: [new TextPToken({ text: expectedSToken('pub.xml') })],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation(undefined, 'pub.xml'));
      });

      it('returns an EntityLocation with no public or system if both have empty arrays', () => {
         const expectedSToken = makeSTokenMaker();
         const pTokenPart = {
            type: EXTERNAL_ID,
            peRefPlus: [],
            externalType: expectedSToken('PUBLIC'),
            externalTypeSpace: expectedSToken(' '),
            system: {
               openQuote: expectedSToken('"'),
               value: [],
               closeQuote: expectedSToken('"'),
            },
            public: {
               openQuote: expectedSToken('"'),
               value: [],
               closeQuote: expectedSToken('"'),
            },
         };

         const externalLoc = makeEntityLocation(pTokenPart);

         expect(externalLoc).toEqual(new EntityLocation(undefined, undefined));
      });

      it('returns nothing if no PTokenPart value provided', () => {
         const externalLoc = makeEntityLocation(undefined);

         expect(externalLoc).toBeUndefined();
      });
   });

   describe('getSTokens()', () => {
      beforeEach(() => {
         spyOn(literal, 'getSTokens');
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
