/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from 'basic';
import { MockErrorCollector } from '../../error/@test/helper';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError, XmlWarning } from '../../error';

import misc from '../common/misc';
import * as elementEnd from '../elementEnd.js';

describe('elementEnd', () => {
   let elementEndPToken: elementEnd.ElementEndPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      elementEndPToken = new elementEnd.ElementEndPToken({
         open: makeSToken('</'),
         postOpenSpace: undefined,
         name: makeSToken('elemName'),
         postNameSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            const pToken = new elementEnd.PToken(elementEndPToken);

            expect(pToken.getSTokenArray()).toEqual([
               elementEndPToken.open,
               elementEndPToken.name,
               elementEndPToken.postNameSpace,
               elementEndPToken.close,
            ]);
         });

      });

   });

   describe('parse()', () => {
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

         elementEnd.parse(mockSource, elementEndPToken.open, callback);
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
         elementEndPToken.name = undefined;
         elementEndPToken.postNameSpace = undefined;
         elementEndPToken.close = undefined;

         elementEnd.parse(mockSource, elementEndPToken.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(elementEndPToken);
      });

   });

   describe('checkWellFormed()', () => {
      let emd: EntityMetaData;
      let mockErrorCollector: MockErrorCollector;

      beforeEach(() => {
         emd = new EntityMetaData();
         mockErrorCollector = new MockErrorCollector();

         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('asks the misc module to look for errors in the name', () => {
         elementEnd.checkWellFormed(elementEndPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(elementEndPToken.name,
            mockErrorCollector, emd, WellFormedError.ID.ELEMENT_NAME_INVALID);
      });

      it('asks the misc module to look for warnings in the name', () => {
         elementEnd.checkWellFormed(elementEndPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(elementEndPToken.name,
            mockErrorCollector, emd, 'ELEMENT', XmlWarning.ID.ELEMENT_NAME_XMLCOLON_RESERVED,
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      it('reports no errors if everything is in order', () => {
         elementEnd.checkWellFormed(elementEndPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if there is a space after the opening "<"', () => {
         const makeSToken = makeSTokenMaker();
         elementEndPToken.postOpenSpace = makeSToken(' ');

         elementEnd.checkWellFormed(elementEndPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_XTRA_LEADING_SPACE,
            params: undefined,
            position: elementEndPToken.postOpenSpace,
         });
      });

      it('reports an error if there is no elment name', () => {
         elementEndPToken.name = undefined;

         elementEnd.checkWellFormed(elementEndPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_NAME,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('reports whether there is a close', () => {
         elementEndPToken.close = undefined;

         elementEnd.checkWellFormed(elementEndPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_CLOSE,
            params: undefined,
            lastPosition: elementEndPToken.postNameSpace,
         });
      });

   });

   describe('pTokenToXToken()', () => {

      it('returns a token with an empty string if no name was found', () => {
         elementEndPToken.name = undefined;

         const token = elementEnd.pTokenToXToken(elementEndPToken);

         expect(token.name).toEqual('');
      });

   });

});
