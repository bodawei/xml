/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { WellFormedError } from '../error';
import { MockErrorCollector } from '../error/test';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as instruction from './instruction.js';
import * as attribute from './common/attribute.js';
import * as xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration (unit)', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(attribute, 'parse');
         attribute.parse.and.callFake((_1, _2, callback) => { callback([]); });
      });

      it('does a basic parsing', () => {
         mockSource = new MockLTokenSource([
            [ '?>', 'match', '?>' ],
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback).toContainParsedProps({
            type: 'XMLDECL',
            open: undefined,
            postOpenSpace: undefined,
            target: undefined,
            postTargetSpace: undefined,
            params: [ ],
            close: expectedLToken('?>'),
         });
      });

      it('calls attribute.parse()', () => {
         mockSource = new MockLTokenSource([
            '?>',
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const args = attribute.parse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            terminators: [ '?>' ],
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         const makeToken = makeLTokenMaker();
         mockErrorCollector = new MockErrorCollector();

         parsed = {
            open: makeToken('<?'),
            postOpenSpace: undefined,
            target: makeToken('xml'),
            postTargetSpace: makeToken(' '),
            params: [ {
               foo: true,
            } ],
            close: makeToken('?>'),
         };
         spyOn(instruction, 'checkWellFormed');
         spyOn(attribute, 'checkWellFormed');
      });

      it('calls instruction.checkWellFormed', () => {
         const emd = new EntityMetaData();
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(instruction.checkWellFormed).toHaveBeenCalledWith(parsed, mockErrorCollector, emd, true);
      });

      it('calls attribute.checkWellFormed', () => {
         const emd = new EntityMetaData();
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         const args = attribute.checkWellFormed.calls.argsFor(0);
         expect(args[0]).toEqual(parsed.params);
         expect(args[1]).toEqual(mockErrorCollector);
         expect(args[2]).toEqual(emd);
         expect(args[3]).toEqual(parsed.postTargetSpace);
         expect(args[4]).toEqual(WellFormedError.ID.NOUN_XMLDECL_PARAM);
         expect(args[5]).toBeInstanceOf(Function);
         expect(args[6]).toBeInstanceOf(Function);
      });

      it('reports no errors with ordinary parameters', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if there are no parameters in the base document entity', () => {
         parsed.params = [];

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_ATTRIBUTES,
            params: undefined,
            position: parsed.close,
         });
      });

      it('reports an error if there are no parameters in the text declaration', () => {
         const emd = new EntityMetaData(EntityMetaData.KIND.EXTERNALSUBSET);
         parsed.params = [];

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_NO_ATTRIBUTES,
            params: undefined,
            position: parsed.close,
         });
      });

      it('reports an error if there is no encoding in the text declaration', () => {
         const emd = new EntityMetaData(EntityMetaData.KIND.EXTERNALSUBSET);

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_NO_ENCODING,
            params: undefined,
            position: parsed.close,
         });
      });

      it('reports an error if there is no close', () => {
         delete parsed.close;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_CLOSE,
            params: undefined,
            lastPosition: undefined, // not quite right, due to mocking
         });
      });

      describe('callbacks', () => {
         let makeToken;
         let emd;
         let checkName;
         let checkValue;
         let mockErrorCollector;

         beforeEach(() => {
            makeToken = makeLTokenMaker();
            emd = new EntityMetaData();
            mockErrorCollector = new MockErrorCollector();

            // Gather parameters
            xmlDeclaration.checkWellFormed(parsed, new MockErrorCollector(), emd);
            checkName = attribute.checkWellFormed.calls.argsFor(0)[5];
            checkValue = attribute.checkWellFormed.calls.argsFor(0)[6];
         });

         describe('checkName()', () => {

            it('reports an error if a version is in the wrong order', () => {
               checkName(makeToken('foo'), 0, mockErrorCollector, emd);
               const versionLToken = makeToken('version');

               checkName(versionLToken, 1, mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_VERSION_INVALID_ORDER,
                  params: [ 1 ],
                  position: undefined,
               });
            });

            it('reports an error if a encoding is in the wrong order', () => {
               checkName(makeToken('version'), 0, mockErrorCollector, emd);
               checkName(makeToken('standalone'), 1, mockErrorCollector, emd);
               const encodingLToken = makeToken('encoding');

               checkName(encodingLToken, 2, mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ENCODING_INVALID_ORDER,
                  params: undefined,
                  position: undefined,
               });
            });

            it('reports an error if a standalone is in the wrong order', () => {
               checkName(makeToken('standalone'), 0, mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_ORDER,
                  params: undefined,
                  position: undefined,
               });
            });

            it('reports an error if standalone specified on a non-doc entity', () => {
               const localEmd = new EntityMetaData(EntityMetaData.KIND.EXTERNALSUBSET);
               checkName(makeToken('version'), 0, mockErrorCollector, localEmd);

               checkName(makeToken('standalone'), 1, mockErrorCollector, localEmd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.TEXTDECL_XTRA_STANDALONE,
                  params: undefined,
                  position: undefined,
               });
            });

            it('reports an error if an unknown parameter is provided', () => {
               checkName(makeToken('bogus'), 0, mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ATTR_UNKNOWN,
                  params: [ 'bogus' ],
                  position: undefined,
               });
            });

            it('reports an error if a param is the wrong case', () => {
               checkName(makeToken('VERSION'), 0, mockErrorCollector, emd);

               xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ATTR_INVALID_CASE,
                  params: [ 'version', 'VERSION' ],
                  position: undefined,
               });
            });

         });

         describe('checkValue()', () => {

            it('reports an error if the version is not a legal value', () => {
               const mockErrorCollector = new MockErrorCollector();

               checkValue(makeToken('version'), makeToken('1.2'), mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_VERSION_INVALD,
                  params: [ '1.2' ],
                  lastPosition: undefined,
               });
            });

            it('reports an error if the encoding is not a legal value', () => {
               const mockErrorCollector = new MockErrorCollector();

               checkValue(makeToken('encoding'), makeToken('$$BAD_ENCODING$$'), mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ENCODING_INVALID,
                  params: [ '$$BAD_ENCODING$$' ],
                  lastPosition: undefined,
               });
            });

            it('reports an error if the standalone is neither "yes" or "no"', () => {
               const mockErrorCollector = new MockErrorCollector();

               checkValue(makeToken('standalone'), makeToken('Maybe'), mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID,
                  params: [ 'Maybe' ],
                  lastPosition: undefined,
               });
            });

            it('reports an error if the standalone is not all lower case', () => {
               const mockErrorCollector = new MockErrorCollector();

               checkValue(makeToken('standalone'), makeToken('Yes'), mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_CASE,
                  params: [ 'yes', 'Yes' ],
                  lastPosition: undefined,
               });
            });

         });

      });

   });

   describe('makeToken()', () => {

      beforeEach(() => {
         spyOn(attribute, 'makeTokenCompatible');
         spyOn(attribute, 'appendLTokens');
      });

      it('asks the attribute to provide the attributes', () => {
         const parsed = {
            params: [ {
            } ],
         };

         xmlDeclaration.makeToken(parsed);

         expect(attribute.makeTokenCompatible).toHaveBeenCalledWith(parsed.params);
      });

      it('asks the attribute to provide the lTokens', () => {
         const parsed = {
            params: [ {
            } ],
         };

         const token = xmlDeclaration.makeToken(parsed);

         expect(attribute.appendLTokens).toHaveBeenCalledWith(token.lTokens, parsed.params);
      });

   });

});
