/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from'basic-test';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import attribute from '../common/attribute';
import { ElementEmptyPToken, ElementStartPToken, parseElementStart } from '../elementStart';
import { SToken } from 'sToken';

describe('elementStart (unit)', () => {
   let elementStartPToken: ElementStartPToken;
   let elementEmptyPToken: ElementEmptyPToken;
   let elementStartPTokenWithLeading: ElementStartPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementStartPTokenWithLeading = new ElementStartPToken({
         open: makeSToken('<'),
         openSpace: makeSToken(' '),
         name: makeSToken('elemName'),
         nameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
      const makeSToken2 = makeSTokenMaker();
      elementStartPToken = new ElementStartPToken({
         open: makeSToken2('<'),
         openSpace: undefined,
         name: makeSToken2('elemName'),
         nameSpace: makeSToken2(' '),
         close: makeSToken2('>'),
      });

      elementEmptyPToken = new ElementEmptyPToken({
         open: SToken.fromString('<'),
         openSpace: undefined,
         name: SToken.fromString('elemName'),
         nameSpace: SToken.fromString(' '),
         attributes: [],
         close: SToken.fromString('>'),
      });
   });

   describe('ElementStartPToken', () => {

      describe('toSTokenArray()', () => {

         it('returns all the STokens', () => {
            expect(elementStartPTokenWithLeading.toSTokenArray()).toEqual([
               elementStartPTokenWithLeading.open,
               elementStartPTokenWithLeading.openSpace,
               elementStartPTokenWithLeading.name,
               elementStartPTokenWithLeading.nameSpace,
               elementStartPTokenWithLeading.close,
            ] as any);
         });

      });

      it('asks the attribute to provide the STokens', () => {
         spyOn(attribute, 'getSTokens');
         (elementStartPToken as any).attributes = [ {} ];

         elementStartPToken.toSTokenArray();

         expect(attribute.getSTokens).toHaveBeenCalledWith(elementStartPToken.attributes);
      });

   });

   describe('EmptyPToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            const pToken = new ElementEmptyPToken(elementStartPTokenWithLeading);

            expect(pToken.toSTokenArray()).toEqual([
               elementStartPTokenWithLeading.open,
               elementStartPTokenWithLeading.openSpace,
               elementStartPTokenWithLeading.name,
               elementStartPTokenWithLeading.nameSpace,
               elementStartPTokenWithLeading.close,
            ] as any);
         });

      });

      it('asks the attribute to provide the STokens', () => {
         const pToken = new ElementEmptyPToken(elementStartPTokenWithLeading);
         spyOn(attribute, 'getSTokens');
         (pToken as any).attributes = [ {} ];

         pToken.toSTokenArray();

         expect(attribute.getSTokens).toHaveBeenCalledWith(pToken.attributes);
      });

   });

   describe('parse()', () => {
      let callback: jasmine.Spy;
      let attrParse: jasmine.Spy;
      let attrArray: Array<any>;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         attrArray = [];
         attrParse = spyOn(attribute, 'parse').and.callFake((_1: any, _2: any, deliverPToken: any) => {
            deliverPToken(attrArray);
         });
      });

      it('calls attribute.parse()', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ 'elemName', 'word', [ '>', '/>' ] ],
            [ ' ', 'space' ],
            [ '>', 'match', '>' ],
         ], 1, 0, 1);

         parseElementStart(mockSource, elementStartPToken.open, callback);
         mockSource.respondInAsyncTime();

         const args = attrParse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            terminators: [ '>', '/>' ],
            geRef: true,
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('returns an empty element if appropriate', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ 'elemName', 'word', [ '>', '/>' ] ],
            [ ' ', 'space' ],
            [ undefined, 'match', '>' ],
            [ '/>', 'match', '/>' ],
         ], 1, 0, 1);
         const makeSToken = makeSTokenMaker(undefined, 10, 0, 10);
         (elementEmptyPToken as any).close = makeSToken('/>');

         parseElementStart(mockSource, elementStartPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toEqualRangeless(elementEmptyPToken);
      });

      it('returns simple values', () => {
         const mockSource = new MockSTokenSource([
            ' ',
            'elemName',
            ' ',
            '>',
         ], 1, 0, 1);

         parseElementStart(mockSource, elementStartPTokenWithLeading.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementStartPTokenWithLeading);
      });

      it('no values if at the end of input', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ], 1, 0, 1);
         (elementStartPToken as any).openSpace = undefined;
         (elementStartPToken as any).name = undefined;
         (elementStartPToken as any).nameSpace = undefined;
         (elementStartPToken as any).close = undefined;
         parseElementStart(mockSource, elementStartPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementStartPToken);
      });

   });

});
