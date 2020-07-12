/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import * as charRef from '../../charRef';
import * as generalEntityReference from '../../generalEntityReference';
import * as parameterEntityReference from '../../parameterEntityReference';
import { GeneralEntityReferencePToken } from '../../generalEntityReference';

import misc from '../misc';
import literalValue, { LiteralValuePToken } from '../literalValue';
import { TextPToken, TextXToken } from 'source/token/text';

describe('literalValue (unit)', () => {

   describe('parse()', () => {
      let mockSource: MockSTokenSource;
      let value: LiteralValuePToken;
      let callback: (result: LiteralValuePToken) => void;
      let expectedSToken: (value: string) => SToken;

      beforeEach(() => {
         expectedSToken = makeSTokenMaker();
         callback = (result: LiteralValuePToken) => value = result;
      });

      it('does a basic parse', () => {
         mockSource = new MockSTokenSource([
            'blah',
            MockSTokenSource.PEEK('"'),
         ]);

         literalValue.parse(mockSource, [ '"' ], callback);
         mockSource.respondInAsyncTime();

         expect(value).toEqual([ new TextPToken({ text: expectedSToken('blah') }) ]);
      });

      it('returns an empty array result if there is an EOF', () => {
         mockSource = new MockSTokenSource([
            undefined,
            undefined,
         ]);

         literalValue.parse(mockSource, [ '"' ], callback);
         mockSource.respondInAsyncTime();

         expect(value).toEqual([ ]);
      });

      it('returns a partial result if there is an EOF after first chunk of text', () => {
         mockSource = new MockSTokenSource([
            'some text',
            undefined,
         ]);

         literalValue.parse(mockSource, [ '"' ], callback);
         mockSource.respondInAsyncTime();

         expect(value).toEqual([ new TextPToken({ text: expectedSToken('some text') }) ]);
      });

      it('returns an empty array result if there is no text before the close quote', () => {
         mockSource = new MockSTokenSource([
            undefined,
            MockSTokenSource.PEEK('"'),
         ]);

         literalValue.parse(mockSource, [ '"' ], callback);
         mockSource.respondInAsyncTime();

         expect(value).toEqual([ ]);
      });

      describe('entity references', () => {
         let generalParseSpy: jasmine.Spy;
         let paramParseSpy: jasmine.Spy;
         let charRefSpy: jasmine.Spy;

         beforeEach(() => {
            generalParseSpy = spyOn(generalEntityReference, 'parseGeneralEntityReference');
            paramParseSpy = spyOn(parameterEntityReference, 'parseParameterEntityReference');
            charRefSpy = spyOn(charRef, 'parseCharRef');
         });

         it('calls out to parseParameterEntityReference() when encountering a % and asked to parse peRefs', () => {
            mockSource = new MockSTokenSource([
               undefined,
               MockSTokenSource.PEEK('%'),
            ]);

            literalValue.parse(mockSource, [ '"', '%' ], callback);
            mockSource.respondInAsyncTime();

            expect(paramParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(paramParseSpy.calls.argsFor(0)[1]).toBeInstanceOf(Function);
         });

         it('calls out to parseGeneralEntityReference() when encountering a & and asked to parse geRefs', () => {
            mockSource = new MockSTokenSource([
               undefined,
               MockSTokenSource.PEEK('&'),
               '&',
            ]);

            literalValue.parse(mockSource, [ '"', '&' ], callback);
            mockSource.respondInAsyncTime();

            expect(generalParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(generalParseSpy.calls.argsFor(0)[1]).toEqual(new SToken('&', '&', new Range(new EntityLocation(), 0, 0, 0, 1, 0, 1)));
            expect(generalParseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         });

         it('calls out to charRef.parse() when encountering a &# and asked to parse charRefs', () => {
            mockSource = new MockSTokenSource([
               undefined,
               MockSTokenSource.PEEK('&'),
               ['&#', 'multi', [ '&', '&#' ]],
            ]);

            literalValue.parse(mockSource, [ '"', '&', '&#' ], callback);
            mockSource.respondInAsyncTime();

            expect(charRefSpy.calls.argsFor(0)[0]).toEqual(mockSource);
            expect(charRefSpy.calls.argsFor(0)[1]).toEqual(new SToken('&#', '&#', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)));
            expect(charRefSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         });

         it('handles a combination of text, pe and ge refs', () => {
            generalParseSpy.and.callFake((_1: any, _2: any, callback: (entityRef: any) => void) => {
               callback({});
            });
            paramParseSpy.and.callFake((_1: any, callback: (entityRef: any) => void) => {
               callback({});
            });
            mockSource = new MockSTokenSource([
               'one',
               MockSTokenSource.PEEK('&'),
               '&',
               'two',
               MockSTokenSource.PEEK('%'),
               'three',
               MockSTokenSource.PEEK('%'),
               'four',
               MockSTokenSource.PEEK('"'),
            ]);

            literalValue.parse(mockSource, [ '"', '&', '%' ], callback);
            mockSource.respondInAsyncTime();

            const makeSToken = makeSTokenMaker();
            const makeSToken2 = makeSTokenMaker(undefined, 4, 0, 4);
            expect(value).toEqual([
               new TextPToken({ text: makeSToken('one') }),
               {} as GeneralEntityReferencePToken,
               new TextPToken({ text: makeSToken2('two') }),
               {} as GeneralEntityReferencePToken,
               new TextPToken({ text: makeSToken2('three') }),
               {} as GeneralEntityReferencePToken,
               new TextPToken({ text: makeSToken2('four') }),
            ]);
         });

      });

   });

   describe('checkWellFormed()', () => {
      let miscCheckWellFormedSpy: jasmine.Spy;
      let refCheckWellFormedSpy: jasmine.Spy;
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;
      let valuePToken: LiteralValuePToken;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         emd = new EntityMetaData();

         valuePToken = [ new TextPToken({ text: SToken.fromString('xxx') }) ];

         miscCheckWellFormedSpy = spyOn(misc, 'checkCharWellFormed');
      });

      it('calls misc.checkCharWellFormed() to check the value', () => {
         literalValue.checkWellFormed(valuePToken, mockErrorCollector, emd);

         expect(miscCheckWellFormedSpy.calls.argsFor(0)[0]).toEqual(SToken.fromString('xxx'));
         expect(miscCheckWellFormedSpy.calls.argsFor(0)[1]).toEqual(mockErrorCollector);
         expect(miscCheckWellFormedSpy.calls.argsFor(0)[2]).toEqual(emd);
      });

      it('sets the position before calling misc.checkWellFormed', () => {
         const spy: jasmine.Spy = mockErrorCollector.setPos as jasmine.Spy;
         literalValue.checkWellFormed(valuePToken, mockErrorCollector, emd);

         expect(spy.calls.argsFor(0)[0]).toEqual(SToken.fromString('xxx'));
      });

      it('calls reference.checkWellFormed if an entity reference PToken is found', () => {
         const geRef = new GeneralEntityReferencePToken({ open: SToken.fromString('&') });
         refCheckWellFormedSpy = spyOn(geRef, 'checkWellFormed');
         valuePToken.push(geRef);

         literalValue.checkWellFormed(valuePToken, mockErrorCollector, emd);

         expect(refCheckWellFormedSpy.calls.argsFor(0)[0]).toEqual(mockErrorCollector);
      });

      // it('calls charRef.checkWellFormed when there is a charRef in the value', () => {
      //    const ref = new charRef.CharRefPToken({ open: SToken.fromString('&#') });
      //    const spy = spyOn(ref, 'checkWellFormed');
      //    valuePToken.push(ref);

      //    literalValue.checkWellFormed(valuePToken, mockErrorCollector, emd);

      //    expect(spy).toHaveBeenCalledWith(mockErrorCollector, emd);
      // });

   });

   describe('makeTokenXCompatible()', () => {

      it('returns a Text token from the PToken result', () => {
         const pToken = [ new TextPToken({ text: SToken.fromString('blah') }) ];
         const result = literalValue.makeXTokenCompatible(pToken);

         expect(result).toEqual([ new TextXToken('blah', pToken[0]) ]);
      });

      it('calls reference.toXToken for each reference in the pToken value', () => {
         const geReference = new GeneralEntityReferencePToken({ open: SToken.fromString('&') });
         const refSpy = spyOn(geReference, 'toXToken');
         const pToken = [ new TextPToken({ text: SToken.fromString('blah') }), geReference ];
         literalValue.makeXTokenCompatible(pToken);

         expect(refSpy.calls.count()).toEqual(1);
         expect(refSpy.calls.argsFor(0)).toEqual([]);
      });

      it('copes with no values at all', () => {
         const result = literalValue.makeXTokenCompatible([]);

         expect(result).toEqual([]);
      });

   });

   describe('getSTokens()', () => {

      it('does a basic population', () => {
         const pToken = [ new TextPToken({ text: SToken.fromString('blah') }) ];
         const results = literalValue.getSTokens(pToken);

         expect(results).toEqual([ SToken.fromString('blah') ]);
      });

      it('adds STokens from any entity references', () => {
         const pToken = [
            new TextPToken({ text: SToken.fromString('blah') }),
            new GeneralEntityReferencePToken({
               open: SToken.fromString('&'),
               name: SToken.fromString('theName'),
            }),
         ];
         const results = literalValue.getSTokens(pToken);

         expect(results).toEqual([
            SToken.fromString('blah'),
            SToken.fromString('&'),
            SToken.fromString('theName'),
         ]);
      });

   });
});
