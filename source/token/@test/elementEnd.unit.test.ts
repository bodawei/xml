/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import {  WellFormedError } from '../../wellformedness/error/WellFormedError';
import { makeSTokenMaker, MockSTokenSource } from 'sToken-test';

import misc from '../common/misc';
import { ElementEndPToken, parseElementEnd } from '../elementEnd';

describe('elementEnd', () => {
   let elementEndPToken: ElementEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementEndPToken = new ElementEndPToken({
         open: makeSToken('</'),
         openSpace: undefined,
         name: makeSToken('elemName'),
         nameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
   });

   describe('parseElementEnd()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns a common parsing', () => {
         const mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ 'elemName', 'word', [ '>' ] ],
            [ ' ', 'space' ],
            [ '>', 'match', '>' ],
         ], 2, 0, 2);

         parseElementEnd(mockSource, elementEndPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementEndPToken);
      });

      it('no values if at the end of input', () => {
         const mockSource = new MockSTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ], 1, 0, 1);
         (elementEndPToken as any).name = undefined;
         (elementEndPToken as any).nameSpace = undefined;
         (elementEndPToken as any).close = undefined;

         parseElementEnd(mockSource, elementEndPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementEndPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let confVer: ConformanceVersion;
      let mockErrorCollector: MockErrorCollector;

      beforeEach(() => {
         confVer = new ConformanceVersion();
         mockErrorCollector = new MockErrorCollector();

         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('asks the misc module to look for errors in the name', () => {
         elementEndPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(misc.checkName).toHaveBeenCalledWith(elementEndPToken.name,
            mockErrorCollector, confVer, WellFormedError.ID.ELEMENT_NAME_INVALID);
      });

      it('asks the misc module to look for warnings in the name', () => {
         elementEndPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(elementEndPToken.name,
            mockErrorCollector, confVer, 'ELEMENT', XmlWarning.ID.ELEMENT_NAME_XMLCOLON_RESERVED,
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      it('reports no errors if everything is in order', () => {
         elementEndPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if there is a space after the opening "<"', () => {
         const makeSToken = makeSTokenMaker();
         (elementEndPToken as any).openSpace = makeSToken(' ');

         elementEndPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.ELEMENT_XTRA_LEADING_SPACE,
            params: undefined,
            position: elementEndPToken.openSpace,
         });
      });

      it('reports an error if there is no elment name', () => {
         (elementEndPToken as any).name = undefined;

         elementEndPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.ELEMENT_NO_NAME,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('reports whether there is a close', () => {
         (elementEndPToken as any).close = undefined;

         elementEndPToken.checkWellFormed(mockErrorCollector, confVer);

         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.ELEMENT_NO_CLOSE,
            params: undefined,
            lastPosition: elementEndPToken.nameSpace,
         });
      });

   });

   describe('toXToken()', () => {

      it('returns a token with an empty string if no name was found', () => {
         (elementEndPToken as any).name = undefined;

         const token = elementEndPToken.toXToken();

         expect(token.name).toEqual('');
      });

   });

   describe('toSTokenArray()', () => {

      it('returns all the STokens', () => {
         expect(elementEndPToken.toSTokenArray()).toEqual([
            elementEndPToken.open!,
            elementEndPToken.name!,
            elementEndPToken.nameSpace!,
            elementEndPToken.close!,
         ]);
      });

   });

});
