/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError, XmlWarning } from '../error';

import * as attribute from './common/attribute.js';
import * as misc from './common/misc.js';
import * as elementStart from './elementStart.js';

describe('elementStart (unit)', () => {
   let parsedElementStart;
   let parsedElementStartWithLeading;

   beforeEach(() => {
      const sourceLToken = makeLTokenMaker();
      parsedElementStartWithLeading = {
         type: 'ELEMENT_START',
         open: sourceLToken('<'),
         postOpenSpace: sourceLToken(' '),
         name: sourceLToken('elemName'),
         postNameSpace: sourceLToken(' '),
         attributes: [],
         close: sourceLToken('>'),
      };
      const makeSequentialToken = makeLTokenMaker();
      parsedElementStart = {
         type: 'ELEMENT_START',
         open: makeSequentialToken('<'),
         postOpenSpace: undefined,
         name: makeSequentialToken('elemName'),
         postNameSpace: makeSequentialToken(' '),
         attributes: [],
         close: makeSequentialToken('>'),
      };
   });

   describe('parse()', () => {
      let callback;
      let attrArray;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         attrArray = [];
         spyOn(attribute, 'parse').and.callFake((_1, _2, deliverParsed) => {
            deliverParsed(attrArray);
         });
      });

      it('calls attribute.parse()', () => {
         const mockSource = new MockLTokenSource([
            [ undefined, 'space' ],
            [ 'elemName', 'word', [ '>', '/>' ] ],
            [ ' ', 'space' ],
            [ '>', 'match', '>' ],
         ], 1, 0, 1);

         elementStart.parse(mockSource, parsedElementStart.open, callback);
         mockSource.respondInAsyncTime();

         const args = attribute.parse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({ terminators: [ '>', '/>' ]});
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('returns an empty element if appropriate', () => {
         const mockSource = new MockLTokenSource([
            [ undefined, 'space' ],
            [ 'elemName', 'word', [ '>', '/>' ] ],
            [ ' ', 'space' ],
            [ undefined, 'match', '>' ],
            [ '/>', 'match', '/>' ],
         ], 1, 0, 1);
         const parsedElementEmpty = parsedElementStart;
         parsedElementEmpty.type = 'ELEMENT_EMPTY';
         const sourceLToken = makeLTokenMaker(undefined, 10, 0, 10);
         parsedElementEmpty.close = sourceLToken('/>');

         elementStart.parse(mockSource, parsedElementStart.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedElementEmpty);
      });

      it('returns simple values', () => {
         const mockSource = new MockLTokenSource([
            ' ',
            'elemName',
            ' ',
            '>',
         ], 1, 0, 1);

         elementStart.parse(mockSource, parsedElementStartWithLeading.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedElementStartWithLeading);
      });

      it('no values if at the end of input', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
         ], 1, 0, 1);
         parsedElementStart.postOpenSpace = undefined;
         parsedElementStart.name = undefined;
         parsedElementStart.postNameSpace = undefined;
         parsedElementStart.close = undefined;

         elementStart.parse(mockSource, parsedElementStart.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(parsedElementStart);
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
         elementStart.checkWellFormed(parsedElementStart, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(parsedElementStart.name,
            mockErrorCollector, emd, WellFormedError.ID.ELEMENT_NAME_INVALID);
      });

      it('asks the misc module to look for warning problems in the name', () => {
         elementStart.checkWellFormed(parsedElementStart, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(parsedElementStart.name,
            mockErrorCollector, emd, XmlWarning.ID.ELEMENT_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      it('calls attribute.checkWellFormed', () => {
         const emd = new EntityMetaData();
         elementStart.checkWellFormed(parsedElementStart, mockErrorCollector, emd);

         const args = attribute.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsedElementStart.attributes);
         expect(args[1]).toEqual(mockErrorCollector);
         expect(args[2]).toEqual(emd);
         expect(args[3]).toEqual(parsedElementStart.postNameSpace);
      });

      it('reports no errors if everything is in order', () => {
         elementStart.checkWellFormed(parsedElementStart, mockErrorCollector, emd);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if there is a space after the opening "<"', () => {
         elementStart.checkWellFormed(parsedElementStartWithLeading, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_XTRA_LEADING_SPACE,
            params: undefined,
            position: parsedElementStartWithLeading.postOpenSpace,
         });
      });

      it('reports an error if there is no elment name', () => {
         parsedElementStart.name = undefined;

         elementStart.checkWellFormed(parsedElementStart, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_NAME,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('reports whether there is a close', () => {
         parsedElementStart.close = undefined;

         elementStart.checkWellFormed(parsedElementStart, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_CLOSE,
            params: undefined,
            lastPosition: parsedElementStart.postNameSpace,
         });
      });

   });

   describe('makeToken()', () => {

      beforeEach(() => {
         spyOn(attribute, 'makeTokenCompatible');
         spyOn(attribute, 'appendLTokens');
      });

      it('asks the attribute to provide the attributes', () => {
         parsedElementStart.attributes = [ {} ];

         elementStart.makeToken(parsedElementStart);

         expect(attribute.makeTokenCompatible).toHaveBeenCalledWith(parsedElementStart.attributes);
      });

      it('asks the attribute to provide the lTokens', () => {
         parsedElementStart.attributes = [ {} ];

         const token = elementStart.makeToken(parsedElementStart);

         expect(attribute.appendLTokens).toHaveBeenCalledWith(token.lTokens, parsedElementStart.attributes);
      });

      it('returns a token with the expected fields defined', () => {
         attribute.makeTokenCompatible.and.returnValue([ { attributes: true } ]);

         const token = elementStart.makeToken(parsedElementStartWithLeading);

         expect(token).toEqual(new elementStart.Token('elemName', [ { attributes: true } ], [
            parsedElementStartWithLeading.open,
            parsedElementStartWithLeading.postOpenSpace,
            parsedElementStartWithLeading.name,
            parsedElementStartWithLeading.postNameSpace,
            parsedElementStartWithLeading.close,
         ]));
      });

      it('returns an empty elment token if an empty element was parsed', () => {
         attribute.makeTokenCompatible.and.returnValue([ { attributes: true } ]);
         parsedElementStart.type = elementStart.EMPTY_TYPE;

         const token = elementStart.makeToken(parsedElementStart);

         expect(token).toEqual(new elementStart.EmptyToken('elemName', [ { attributes: true } ], [
            parsedElementStart.open,
            parsedElementStart.name,
            parsedElementStart.postNameSpace,
            parsedElementStart.close,
         ]));
      });

      it('returns a token with an empty string if no name was found', () => {
         parsedElementStart.name = undefined;

         const token = elementStart.makeToken(parsedElementStart);

         expect(token.name).toEqual('');
      });

   });

});
