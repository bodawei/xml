/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeSTokenMaker, MockSTokenSource } from '../sToken/test';
import { WellFormedError, XmlWarning } from '../error';

import * as attribute from './common/attribute.js';
import * as misc from './common/misc.js';
import * as elementStart from './elementStart.js';

describe('elementStart (unit)', () => {
   let elementStartPToken;
   let elementStartPTokenWithLeading;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementStartPTokenWithLeading = new elementStart.PToken({
         open: makeSToken('<'),
         postOpenSpace: makeSToken(' '),
         name: makeSToken('elemName'),
         postNameSpace: makeSToken(' '),
         attributes: [],
         close: makeSToken('>'),
      });
      const makeSToken2 = makeSTokenMaker();
      elementStartPToken = new elementStart.PToken({
         open: makeSToken2('<'),
         postOpenSpace: undefined,
         name: makeSToken2('elemName'),
         postNameSpace: makeSToken2(' '),
         attributes: [],
         close: makeSToken2('>'),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(elementStartPTokenWithLeading.getSTokenArray()).toEqual([
               elementStartPTokenWithLeading.open,
               elementStartPTokenWithLeading.postOpenSpace,
               elementStartPTokenWithLeading.name,
               elementStartPTokenWithLeading.postNameSpace,
               elementStartPTokenWithLeading.close,
            ]);
         });

      });

      it('asks the attribute to provide the STokens', () => {
         spyOn(attribute, 'getSTokens');
         elementStartPToken.attributes = [ {} ];

         elementStartPToken.getSTokenArray();

         expect(attribute.getSTokens).toHaveBeenCalledWith(elementStartPToken.attributes);
      });

   });

   describe('EmptyPToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            const pToken = new elementStart.EmptyPToken(elementStartPTokenWithLeading);

            expect(pToken.getSTokenArray()).toEqual([
               elementStartPTokenWithLeading.open,
               elementStartPTokenWithLeading.postOpenSpace,
               elementStartPTokenWithLeading.name,
               elementStartPTokenWithLeading.postNameSpace,
               elementStartPTokenWithLeading.close,
            ]);
         });

      });

      it('asks the attribute to provide the STokens', () => {
         const pToken = new elementStart.EmptyPToken(elementStartPTokenWithLeading);
         spyOn(attribute, 'getSTokens');
         pToken.attributes = [ {} ];

         pToken.getSTokenArray();

         expect(attribute.getSTokens).toHaveBeenCalledWith(pToken.attributes);
      });

   });

   describe('parse()', () => {
      let callback;
      let attrArray;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         attrArray = [];
         spyOn(attribute, 'parse').and.callFake((_1, _2, deliverPToken) => {
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

         elementStart.parse(mockSource, elementStartPToken.open, callback);
         mockSource.respondInAsyncTime();

         const args = attribute.parse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({ terminators: [ '>', '/>' ]});
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
         const elementEmptyPToken = elementStartPToken;
         elementEmptyPToken.type = 'ELEMENT_EMPTY';
         const makeSToken = makeSTokenMaker(undefined, 10, 0, 10);
         elementEmptyPToken.close = makeSToken('/>');

         elementStart.parse(mockSource, elementStartPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementEmptyPToken);
      });

      it('returns simple values', () => {
         const mockSource = new MockSTokenSource([
            ' ',
            'elemName',
            ' ',
            '>',
         ], 1, 0, 1);

         elementStart.parse(mockSource, elementStartPTokenWithLeading.open, callback);
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
         elementStartPToken.postOpenSpace = undefined;
         elementStartPToken.name = undefined;
         elementStartPToken.postNameSpace = undefined;
         elementStartPToken.close = undefined;
         elementStart.parse(mockSource, elementStartPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementStartPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let emd;
      let mockErrorCollector;

      beforeEach(() => {
         emd = new EntityMetaData();
         mockErrorCollector = new MockErrorCollector();

         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
         spyOn(attribute, 'checkWellFormed');
      });

      it('asks the misc module to look for errors in the name', () => {
         elementStart.checkWellFormed(elementStartPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(elementStartPToken.name,
            mockErrorCollector, emd, WellFormedError.ID.ELEMENT_NAME_INVALID);
      });

      it('asks the misc module to look for warning problems in the name', () => {
         elementStart.checkWellFormed(elementStartPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(elementStartPToken.name,
            mockErrorCollector, emd, XmlWarning.ID.ELEMENT_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      it('calls attribute.checkWellFormed', () => {
         const emd = new EntityMetaData();
         elementStart.checkWellFormed(elementStartPToken, mockErrorCollector, emd);

         const args = attribute.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(elementStartPToken.attributes);
         expect(args[1]).toEqual(mockErrorCollector);
         expect(args[2]).toEqual(emd);
         expect(args[3]).toEqual(elementStartPToken.postNameSpace);
      });

      it('reports no errors if everything is in order', () => {
         elementStart.checkWellFormed(elementStartPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if there is a space after the opening "<"', () => {
         elementStart.checkWellFormed(elementStartPTokenWithLeading, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_XTRA_LEADING_SPACE,
            params: undefined,
            position: elementStartPTokenWithLeading.postOpenSpace,
         });
      });

      it('reports an error if there is no elment name', () => {
         elementStartPToken.name = undefined;

         elementStart.checkWellFormed(elementStartPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_NAME,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('reports whether there is a close', () => {
         elementStartPToken.close = undefined;

         elementStart.checkWellFormed(elementStartPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_CLOSE,
            params: undefined,
            lastPosition: elementStartPToken.postNameSpace,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      beforeEach(() => {
         spyOn(attribute, 'makeTokenCompatible');
      });

      it('asks the attribute to provide the attributes', () => {
         elementStartPToken.attributes = [ {} ];

         elementStart.pTokenToXToken(elementStartPToken);

         expect(attribute.makeTokenCompatible).toHaveBeenCalledWith(elementStartPToken.attributes);
      });

      it('returns a token with the expected fields defined', () => {
         attribute.makeTokenCompatible.and.returnValue([ { attributes: true } ]);

         const token = elementStart.pTokenToXToken(elementStartPTokenWithLeading);

         expect(token).toEqual(new elementStart.XToken('elemName',
            [ { attributes: true } ],
            elementStartPTokenWithLeading));
      });

      it('returns an empty elment XToken if an empty element was provided', () => {
         attribute.makeTokenCompatible.and.returnValue([ { attributes: true } ]);
         elementStartPToken.type = elementStart.EMPTY_TYPE;

         const token = elementStart.pTokenToXToken(elementStartPToken);

         expect(token).toEqual(new elementStart.EmptyToken('elemName',
            [ { attributes: true } ],
            elementStartPToken));
      });

      it('returns a token with an empty string if no name was found', () => {
         elementStartPToken.name = undefined;

         const token = elementStart.pTokenToXToken(elementStartPToken);

         expect(token.name).toEqual('');
      });

   });

});
