/* Copyright ® 2017 by 柏大衛. All rights reserved. */

/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';
import { WellFormedError, XmlWarning } from '../error';

import * as misc from './common/misc.js';
import * as elementStart from './elementStart.js';

describe('elementStart', () => {
   let parsed;
   let sourceLToken;

   beforeEach(() => {
      sourceLToken = makeLTokenMaker();
      parsed = {
         type: 'ELEMENT_START',
         open: sourceLToken('<'),
         postOpenSpace: undefined,
         name: sourceLToken('elemName'),
         postNameSpace: sourceLToken(' '),
         close: sourceLToken('>'),
      };
   });

   describe('parse()', () => {
      let mockSource;
      let callback;
      let expectedLToken;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         callback = jasmine.createSpy('callbackSpy');
      });

      it('returns simple values', () => {
         const open = expectedLToken('<');
         mockSource = new MockLTokenSource([
            undefined,
            'elemName',
            ' ',
            '>',
         ], 1, 0, 1);

         elementStart.parse(mockSource, open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ELEMENT_START',
            open: open,
            postOpenSpace: undefined,
            name: expectedLToken('elemName'),
            postNameSpace: expectedLToken(' '),
            close: expectedLToken('>'),
         });
      });

      it('no values if at the end of input', () => {
         const open = expectedLToken('<');
         mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
            undefined,
         ], 1, 0, 1);

         elementStart.parse(mockSource, open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ELEMENT_START',
            open: open,
            postOpenSpace: undefined,
            name: undefined,
            postNameSpace: undefined,
            close: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let emd;
      let mockErrorCollector;

      beforeEach(() => {
         emd = new EntityMetaData();
         mockErrorCollector = new MockErrorCollector();

         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('asks the misc module to look for problems in the name', () => {
         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(parsed.name,
            mockErrorCollector, emd, XmlWarning.ID.ELEMENT_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      xit('reports no errors if everything is in order', () => {
         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if there is a space after the opening "<"', () => {
         parsed.postOpenSpace = sourceLToken(' ');

         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_XTRA_LEADING_SPACE,
            params: undefined,
            position: parsed.postOpenSpace,
         });
      });

      it('reports an error if there is no elment name', () => {
         parsed.name = undefined;

         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_NAME,
            params: undefined,
            lastPosition: undefined,
         });
      });

      it('checks whether the name is valid', () => {
         parsed.name.text='$badName';

         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NAME_INVALID,
            params: [ '$badName' ],
            position: parsed.name,
         });
      });

      it('reports whether there is a close', () => {
         parsed.close = undefined;

         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ELEMENT_NO_CLOSE,
            params: undefined,
            lastPosition: parsed.postNameSpace,
         });
      });

   });

   describe('makeToken()', () => {

      beforeEach(() => {
         parsed.postOpenSpace = sourceLToken(' ');
      });

      it('returns a token with the expected fields defined', () => {
         const token = elementStart.makeToken(parsed);

         expect(token).toEqual(new elementStart.Token('elemName', [], [
            parsed.open,
            parsed.postOpenSpace,
            parsed.name,
            parsed.postNameSpace,
            parsed.close,
         ]));
      });

      it('returns a token with an empty string if no name was found', () => {
         parsed.name = undefined;

         const token = elementStart.makeToken(parsed);

         expect(token.name).toEqual('');
      });

   });

});
