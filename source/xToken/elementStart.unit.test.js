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
         attributes: [],
         close: sourceLToken('>'),
      };
   });

   describe('parse()', () => {
      let mockSource;
      let callback;
      let expectedLToken;
      let attrArray;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         callback = jasmine.createSpy('callbackSpy');
         attrArray = [];
         spyOn(attribute, 'parse').and.callFake((_1, _2, deliverParsed) => {
            deliverParsed(attrArray);
         });
      });

      it('calls attribute.parse()', () => {
         const open = expectedLToken('<');
         mockSource = new MockLTokenSource([
            undefined,
            'elemName',
            ' ',
            '>',
         ], 1, 0, 1);

         elementStart.parse(mockSource, open, callback);
         mockSource.respondInAsyncTime();

         const args = attribute.parse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({ terminators: [ '>', '/>' ]});
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('returns an empty element if appropriate', () => {
         const open = expectedLToken('<');
         mockSource = new MockLTokenSource([
            undefined,
            'elemName',
            ' ',
            undefined,
            '/>',
         ], 1, 0, 1);

         elementStart.parse(mockSource, open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ELEMENT_EMPTY',
            open: open,
            postOpenSpace: undefined,
            name: expectedLToken('elemName'),
            postNameSpace: expectedLToken(' '),
            attributes: [],
            close: expectedLToken('/>'),
         });
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
            attributes: [],
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
            attributes: [],
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

         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
         spyOn(attribute, 'checkWellFormed');
      });

      it('asks the misc module to look for errors in the name', () => {
         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(parsed.name,
            mockErrorCollector, emd, WellFormedError.ID.ELEMENT_NAME_INVALID);
      });

      it('asks the misc module to look for warning problems in the name', () => {
         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(parsed.name,
            mockErrorCollector, emd, XmlWarning.ID.ELEMENT_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ELEMENT_NAME_XML_RESERVED);
      });

      it('calls attribute.checkWellFormed', () => {
         const emd = new EntityMetaData();
         elementStart.checkWellFormed(parsed, mockErrorCollector, emd);

         const args = attribute.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed.attributes);
         expect(args[1]).toEqual(mockErrorCollector);
         expect(args[2]).toEqual(emd);
         expect(args[3]).toEqual(parsed.postNameSpace);
      });

      it('reports no errors if everything is in order', () => {
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
         spyOn(attribute, 'makeTokenCompatible');
         spyOn(attribute, 'appendLTokens');
      });

      it('asks the attribute to provide the attributes', () => {
         parsed.attributes = [ {} ];

         elementStart.makeToken(parsed);

         expect(attribute.makeTokenCompatible).toHaveBeenCalledWith(parsed.attributes);
      });

      it('asks the attribute to provide the lTokens', () => {
         parsed.attributes = [ {} ];

         const token = elementStart.makeToken(parsed);

         expect(attribute.appendLTokens).toHaveBeenCalledWith(token.lTokens, parsed.attributes);
      });

      it('returns a token with the expected fields defined', () => {
         attribute.makeTokenCompatible.and.returnValue([ { attributes: true } ]);

         const token = elementStart.makeToken(parsed);

         expect(token).toEqual(new elementStart.Token('elemName', [ { attributes: true } ], [
            parsed.open,
            parsed.postOpenSpace,
            parsed.name,
            parsed.postNameSpace,
            parsed.close,
         ]));
      });

      it('returns an empty elment token if an empty element was parsed', () => {
         attribute.makeTokenCompatible.and.returnValue([ { attributes: true } ]);

         parsed.type = elementStart.EMPTY_TYPE;
         const token = elementStart.makeToken(parsed);

         expect(token).toEqual(new elementStart.EmptyToken('elemName', [ { attributes: true } ], [
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
