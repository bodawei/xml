/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError, XmlWarning } from '../error';

import * as misc from './common/misc.js';
import * as elementEnd from './elementEnd.js';

describe('elementEnd', () => {
   let elementEndParsed;

   beforeEach(() => {
      const sourceLToken = makeLTokenMaker();
      elementEndParsed = {
         type: 'ELEMENT_END',
         open: sourceLToken('</'),
         postOpenSpace: undefined,
         name: sourceLToken('elemName'),
         postNameSpace: sourceLToken(' '),
         close: sourceLToken('>'),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns a common parsing', () => {
         const mockSource = new MockLTokenSource([
            [ undefined, 'space' ],
            [ 'elemName', 'word', [ '>' ] ],
            [ ' ', 'space' ],
            [ '>', 'match', '>' ],
         ], 2, 0, 2);

         elementEnd.parse(mockSource, elementEndParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(elementEndParsed);
      });

      it('no values if at the end of input', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ], 1, 0, 1);
         elementEndParsed.name = undefined;
         elementEndParsed.postNameSpace = undefined;
         elementEndParsed.close = undefined;

         elementEnd.parse(mockSource, elementEndParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(elementEndParsed);
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
      });

      it('asks the misc module to look for errors in the name', () => {
         elementEnd.checkWellFormed(elementEndParsed, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(elementEndParsed.name,
            mockErrorCollector, emd, WellFormedError.ID.ELEMENT_NAME_INVALID);
      });

      it('asks the misc module to look for warnings in the name', () => {
         elementEnd.checkWellFormed(elementEndParsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(elementEndParsed.name,
            mockErrorCollector, emd, XmlWarning.ID.ELEMENT_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      it('reports no errors if everything is in order', () => {
         elementEnd.checkWellFormed(elementEndParsed, mockErrorCollector, emd);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if there is a space after the opening "<"', () => {
         const sourceLToken = makeLTokenMaker();
         elementEndParsed.postOpenSpace = sourceLToken(' ');

         elementEnd.checkWellFormed(elementEndParsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_XTRA_LEADING_SPACE,
            params: undefined,
            position: elementEndParsed.postOpenSpace,
         });
      });

      it('reports an error if there is no elment name', () => {
         elementEndParsed.name = undefined;

         elementEnd.checkWellFormed(elementEndParsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_NAME,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('reports whether there is a close', () => {
         elementEndParsed.close = undefined;

         elementEnd.checkWellFormed(elementEndParsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_CLOSE,
            params: undefined,
            lastPosition: elementEndParsed.postNameSpace,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the expected fields defined', () => {
         const sourceLToken = makeLTokenMaker();
         elementEndParsed.postOpenSpace = sourceLToken(' ');

         const token = elementEnd.makeToken(elementEndParsed);

         expect(token).toEqual(new elementEnd.Token('elemName', [
            elementEndParsed.open,
            elementEndParsed.postOpenSpace,
            elementEndParsed.name,
            elementEndParsed.postNameSpace,
            elementEndParsed.close,
         ]));
      });

      it('returns a token with an empty string if no name was found', () => {
         elementEndParsed.name = undefined;

         const token = elementEnd.makeToken(elementEndParsed);

         expect(token.name).toEqual('');
      });

   });

});
