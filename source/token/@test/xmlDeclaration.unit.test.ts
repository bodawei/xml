/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind } from '../../basic';
import { WellFormedError } from '../../error';
import { MockErrorCollector } from '../../error/@test/helper';
import { makeSTokenMaker, MockSTokenSource, STokenMaker } from '../../sToken/@test/helper';

import * as instruction from '../bridge/instruction.js';
import attribute from '../common/attribute';
import * as xmlDeclaration from '../xmlDeclaration.js';

describe('xmlDeclaration (unit)', () => {
   let xmlDeclPToken: xmlDeclaration.PToken;

   beforeEach(() => {
      const makeToken = makeSTokenMaker();
      xmlDeclPToken = new xmlDeclaration.PToken({
         open: makeToken('<?'),
         postOpenSpace: undefined,
         target: makeToken('xml'),
         postTargetSpace: makeToken(' '),
         params: [],
         close: makeToken('?>'),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            expect(xmlDeclPToken.getSTokenArray()).toEqual([
               xmlDeclPToken.open,
               xmlDeclPToken.target,
               xmlDeclPToken.postTargetSpace,
               xmlDeclPToken.close,
            ]);
         });

      });

      it('asks the attribute to provide the STokens', () => {
         spyOn(attribute, 'getSTokens');
         xmlDeclPToken.params = [ {} ];

         xmlDeclPToken.getSTokenArray();

         expect(attribute.getSTokens).toHaveBeenCalledWith(xmlDeclPToken.params);
      });

   });

   describe('parse()', () => {
      let callback: jasmine.Spy;
      let attParse: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         attParse = spyOn(attribute, 'parse');
         attParse.and.callFake((_1: any, _2: any, callback: Function) => { callback([]); });
      });

      it('does a basic parsing', () => {
         const mockSource = new MockSTokenSource([
            [ '?>', 'match', '?>' ],
         ], 6, 0, 6);

         xmlDeclaration.parse(mockSource, {
            open: xmlDeclPToken.open,
            postOpenSpace: undefined,
            target: xmlDeclPToken.target,
            postTargetSpace: xmlDeclPToken.postTargetSpace,
         } as any, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(xmlDeclPToken);
      });

      it('calls attribute.parse()', () => {
         const mockSource = new MockSTokenSource([
            '?>',
         ]);

         xmlDeclaration.parse(mockSource, {} as any, callback);
         mockSource.respondInAsyncTime();

         const args = attParse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            terminators: [ '?>' ],
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let attCheck: jasmine.Spy;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         spyOn(instruction, 'checkWellFormed');
         attCheck = spyOn(attribute, 'checkWellFormed');
      });

      it('calls instruction.checkWellFormed', () => {
         const emd = new EntityMetaData();
         xmlDeclaration.checkWellFormed(xmlDeclPToken, mockErrorCollector, emd);

         expect(instruction.checkWellFormed)
            .toHaveBeenCalledWith(xmlDeclPToken, mockErrorCollector, emd, true);
      });

      it('calls attribute.checkWellFormed', () => {
         const emd = new EntityMetaData();
         xmlDeclaration.checkWellFormed(xmlDeclPToken, mockErrorCollector, emd);

         const args = attCheck.calls.argsFor(0);
         expect(args[0]).toEqual(xmlDeclPToken.params);
         expect(args[1]).toEqual(mockErrorCollector);
         expect(args[2]).toEqual(emd);
         expect(args[3]).toEqual(xmlDeclPToken.postTargetSpace);
         expect(args[4]).toEqual(WellFormedError.ID.NOUN_XMLDECL_PARAM);
         expect(args[5]).toBeInstanceOf(Function);
         expect(args[6]).toBeInstanceOf(Function);
      });

      it('reports no errors with ordinary parameters', () => {
         xmlDeclPToken.params = [ { fakeParam: true } ];
         xmlDeclaration.checkWellFormed(xmlDeclPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if there are no parameters in the base document entity', () => {
         xmlDeclaration.checkWellFormed(xmlDeclPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_ATTRIBUTES,
            params: undefined,
            position: xmlDeclPToken.close,
         });
      });

      it('reports an error if there are no parameters in the text declaration', () => {
         const emd = new EntityMetaData(EntityKind.EXTERNALSUBSET);
         xmlDeclPToken.params = [];

         xmlDeclaration.checkWellFormed(xmlDeclPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_NO_ATTRIBUTES,
            params: undefined,
            position: xmlDeclPToken.close,
         });
      });

      it('reports an error if there is no encoding in the text declaration', () => {
         const emd = new EntityMetaData(EntityKind.EXTERNALSUBSET);

         xmlDeclaration.checkWellFormed(xmlDeclPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_NO_ENCODING,
            params: undefined,
            position: xmlDeclPToken.close,
         });
      });

      it('reports an error if there is no close', () => {
         delete xmlDeclPToken.close;

         xmlDeclaration.checkWellFormed(xmlDeclPToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_CLOSE,
            params: undefined,
            lastPosition: undefined, // not quite right, due to mocking
         });
      });

      describe('callbacks', () => {
         let makeToken: STokenMaker;
         let emd: EntityMetaData;
         let checkName: Function;
         let checkValue: Function;

         beforeEach(() => {
            makeToken = makeSTokenMaker();
            emd = new EntityMetaData();

            // Gather parameters
            xmlDeclaration.checkWellFormed(xmlDeclPToken, new MockErrorCollector(), emd);
            checkName = attCheck.calls.argsFor(0)[5];
            checkValue = attCheck.calls.argsFor(0)[6];
         });

         describe('checkName()', () => {

            it('reports an error if a version is in the wrong order', () => {
               checkName(makeToken('foo'), 0, mockErrorCollector, emd);
               const versionSToken = makeToken('version');

               checkName(versionSToken, 1, mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_VERSION_INVALID_ORDER,
                  params: [ '1' ],
                  position: undefined,
               });
            });

            it('reports an error if a encoding is in the wrong order', () => {
               checkName(makeToken('version'), 0, mockErrorCollector, emd);
               checkName(makeToken('standalone'), 1, mockErrorCollector, emd);
               const encodingSToken = makeToken('encoding');

               checkName(encodingSToken, 2, mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ENCODING_INVALID_ORDER,
                  params: undefined,
                  position: undefined,
               });
            });

            it('reports no error about encoding position if this is not a document kind', () => {
               emd = new EntityMetaData(EntityKind.EXTERNAL);
               checkName(makeToken('version'), 0, mockErrorCollector, emd);
               checkName(makeToken('standalone'), 1, mockErrorCollector, emd);
               const encodingSToken = makeToken('encoding');

               checkName(encodingSToken, 2, mockErrorCollector, emd);

               expect(mockErrorCollector).not.toReportError({
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
               const localEmd = new EntityMetaData(EntityKind.EXTERNALSUBSET);
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

               checkValue(makeToken('version'), [ { text: makeToken('1.2') } ], mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_VERSION_INVALD,
                  params: [ '1.2' ],
                  lastPosition: undefined,
               });
            });

            it('reports an error if the encoding is not a legal value', () => {
               const mockErrorCollector = new MockErrorCollector();

               checkValue(makeToken('encoding'), [ { text: makeToken('$$BAD_ENCODING$$') } ], mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_ENCODING_INVALID,
                  params: [ '$$BAD_ENCODING$$' ],
                  lastPosition: undefined,
               });
            });

            it('reports an error if the standalone is neither "yes" or "no"', () => {
               const mockErrorCollector = new MockErrorCollector();

               checkValue(makeToken('standalone'), [ { text: makeToken('Maybe') } ], mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID,
                  params: [ 'Maybe' ],
                  lastPosition: undefined,
               });
            });

            it('reports an error if the standalone is not all lower case', () => {
               const mockErrorCollector = new MockErrorCollector();

               checkValue(makeToken('standalone'), [ { text: makeToken('Yes') } ], mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_CASE,
                  params: [ 'yes', 'Yes' ],
                  lastPosition: undefined,
               });
            });

            it('reports an error if the standalone has no value', () => {
               const mockErrorCollector = new MockErrorCollector();

               checkValue(makeToken('standalone'), [ ], mockErrorCollector, emd);

               expect(mockErrorCollector).toReportError({
                  id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID,
                  params: [ '' ],
                  lastPosition: undefined,
               });
            });

         });

      });

   });

   describe('pTokenToXToken()', () => {
      let attrMake: jasmine.Spy;

      beforeEach(() => {
         attrMake = spyOn(attribute, 'makeOneTokenCompatible');
      });

      it('asks the attribute to provide the attributes', () => {
         attrMake.and.returnValue([]);

         xmlDeclaration.pTokenToXToken(xmlDeclPToken);

         expect(attribute.makeOneTokenCompatible).toHaveBeenCalledWith(xmlDeclPToken.params);
      });

      it('sets standalone to false when no standalone value was offered', () => {
         attrMake.and.returnValue([{
            name: 'version',
            value: [{
               text: '1.0',
            }]
         }]);

         const result = xmlDeclaration.pTokenToXToken(xmlDeclPToken);

         expect(result.standalone).toEqual(false);
      });

   });

});
