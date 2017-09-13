/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { WellFormedError, XmlWarning } from '../error';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as instruction from './instruction.js';
import * as misc from './common/misc.js';

describe('instruction (unit)', () => {
   let defaultParsed;

   beforeEach(() => {
      const expectedLToken = makeLTokenMaker();
      defaultParsed = {
         type: instruction.TYPE,
         open: expectedLToken('<?'),
         postOpenSpace: undefined,
         target: expectedLToken('instructionTarget'),
         postTargetSpace: expectedLToken(' '),
      };
   });

   describe('parse()', () => {
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic instruction parse', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            'instructionTarget',
            ' ',
         ], 2, 0, 2);

         instruction.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps(defaultParsed);
      });

      it('returns all undefined if input ends immediately', () => {
         const mockSource = new MockLTokenSource([
            undefined,
            undefined,
            undefined,
         ], 2, 0, 2);

         instruction.parse(mockSource, defaultParsed.open, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: instruction.TYPE,
            open: defaultParsed.open,
            postOpenSpace: undefined,
            target: undefined,
            postTargetSpace: undefined,
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let expectedLToken;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         mockErrorCollector = new MockErrorCollector();
         spyOn(misc, 'checkWellFormedText');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('calls misc.checkWellFormedText()', () => {
         const emd = new EntityMetaData();

         instruction.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(defaultParsed.target, mockErrorCollector, emd);
      });

      it('calls misc.checkWellFormedNameRecommendation()', () => {
         const emd = new EntityMetaData();

         instruction.checkWellFormed(defaultParsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation)
            .toHaveBeenCalledWith(defaultParsed.target, mockErrorCollector, emd,
               XmlWarning.ID.PI_TARGET_XMLDASH_RESERVED, XmlWarning.ID.PI_TARGET_XML_RESERVED);
      });

      it('does not call checkWellFormedNameR... if fourth param is true (for xmldecl)', () => {
         const emd = new EntityMetaData();

         instruction.checkWellFormed(defaultParsed, mockErrorCollector, emd, true);

         expect(misc.checkWellFormedNameRecommendation).not.toHaveBeenCalled();
      });

      it('reports an error if there is a space after the "<?"', () => {
         defaultParsed.postOpenSpace = expectedLToken(' ');

         instruction.checkWellFormed(defaultParsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_SPACE_AFTER_OPEN,
            params: [ 'instructionTarget' ],
            position: defaultParsed.postOpenSpace,
         });
      });

      it('reports an error if there is no target', () => {
         delete defaultParsed.target;

         instruction.checkWellFormed(defaultParsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_TARGET,
            params: undefined,
            lastPosition: defaultParsed.open,
         });
      });

      it('reports an error if there is no space after the target', () => {
         delete defaultParsed.postTargetSpace;

         instruction.checkWellFormed(defaultParsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.PI_NO_SPACE_AFTER_TARGET,
            params: [ 'instructionTarget' ],
            lastPosition: defaultParsed.target,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns a token with the tokens found in the parsed value', () => {
         const token = instruction.makeToken(defaultParsed);

         expect(token).toEqual(new instruction.Token('instructionTarget', [
            defaultParsed.open,
            defaultParsed.target,
            defaultParsed.postTargetSpace,
         ]));
      });

      it('returns a token with a blank name if there was no name in the parse', () => {
         delete defaultParsed.target;

         const token = instruction.makeToken(defaultParsed);

         expect(token).toEqual(new instruction.Token('', [
            defaultParsed.open,
            defaultParsed.postTargetSpace,
         ]));
      });

   });

   describe('appendLTokens()', () => {

      it('adds all instruction LTokens', () => {
         defaultParsed.postOpenSpace = defaultParsed.postTargetSpace; // good enough
         const results = [];

         instruction.appendLTokens(results, defaultParsed);

         expect(results).toEqual([
            defaultParsed.open,
            defaultParsed.postOpenSpace,
            defaultParsed.target,
            defaultParsed.postTargetSpace,
         ]);
      });

   });

   describe('retype()', () => {

      it('adds all instruction items as well as the specified type', () => {
         const results = instruction.retype('newtype', defaultParsed);

         expect(results).toEqual({
            type: 'newtype',
            open: defaultParsed.open,
            postOpenSpace: defaultParsed.postOpenSpace,
            target: defaultParsed.target,
            postTargetSpace: defaultParsed.postTargetSpace,
         });
      });

   });

});
