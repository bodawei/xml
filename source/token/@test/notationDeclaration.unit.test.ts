/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, Range } from 'basic';
import { XmlWarning } from 'error';
import { MockErrorCollector } from '../../error/@test/helper';
import { SToken } from '../../sToken';
import { makeSTokenMaker, MockSTokenSource } from '../../sToken/@test/helper';
import { WellFormedError } from 'error';

import declaration from '../bridge/baseDeclaration';
import notationDeclaration, { NotationDeclarationPToken } from '../notationDeclaration';
import externalId from '../common/externalId';
import misc from '../common/misc';
import unassigned from '../common/unassigned';

type ExternalIDCallback = (x: any) => void;
type ExternalId = {
};

describe('notationdeDlaration (unit)', () => {
   let notationPToken: NotationDeclarationPToken;
   let makeSToken: (param: string) => SToken;

   beforeEach(() => {
      makeSToken = makeSTokenMaker();
      notationPToken = new notationDeclaration.PToken({
         open: makeSToken('<!'),
         postOpenSpace: undefined,
         declType: makeSToken('NOTATION'),
         postDeclTypeSpace: makeSToken(' '),
         name: makeSToken('notationName'),
         postNameSpace: makeSToken(' '),
         externalId: { externalId: true },
         postExternalIdSpace: makeSToken(' '),
         close: makeSToken('>'),
      });
   });

   describe('PToken', () => {

      describe('getSTokenStream()', () => {

         it('returns all the STokens', () => {
            notationPToken.postOpenSpace = notationPToken.postNameSpace;
            const result = notationPToken.getSTokenArray();

            expect(result).toEqual([
               notationPToken.open,
               notationPToken.postOpenSpace,
               notationPToken.declType,
               notationPToken.postDeclTypeSpace,
               notationPToken.name,
               notationPToken.postNameSpace,
               notationPToken.postExternalIdSpace,
               notationPToken.close,
            ] as Array<SToken>); // typeHack
         });

      });

      it('asks the attribute to provide the STokens', () => {
         spyOn(externalId, 'getSTokens');

         notationPToken.getSTokenArray();

         expect(externalId.getSTokens).toHaveBeenCalledWith(notationPToken.externalId);
      });

   });

   describe('parse()', () => {
      let callback: jasmine.Spy;
      let externalIDParseSpy: jasmine.Spy;
      let unassignedMakeCheckSpy: jasmine.Spy;
      let unassignedCheckForSpy: jasmine.Spy;
      let nonPeRefCallback: (x?: any) => void;

      beforeEach(() => {
         nonPeRefCallback = () => {};
         callback = jasmine.createSpy('callbackSpy');
         externalIDParseSpy = spyOn(externalId, 'parse');
         externalIDParseSpy.and.callFake((_1: any, _2: any, cb: (arg: any) => void) => {
            cb({ externalId: true });
         });
         unassignedMakeCheckSpy = spyOn(unassigned, 'makeCheckCallback').and.callFake((_1: any, _2: any, _3: any, cb2: (arg: any) => void) => {
            nonPeRefCallback = cb2;
         });
         unassignedCheckForSpy = spyOn(unassigned, 'checkForPERef').and.callFake(() => {
            nonPeRefCallback();
         });
      });

      it('calls externalId.parse()', () => {
         const mockSource = new MockSTokenSource([
            'name',
            ' ',
            undefined,
            '>',
         ]);

         notationDeclaration.parse(mockSource, notationPToken, callback);
         mockSource.respondInAsyncTime();

         expect(externalIDParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(externalIDParseSpy.calls.argsFor(0)[1]).toEqual([ '>' ]);
         expect(externalIDParseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('does a simple parse', () => {
         // delete the things that our mocking of declaration will not return
         delete notationPToken.open;
         delete notationPToken.postOpenSpace;
         delete notationPToken.declType;
         delete notationPToken.postDeclTypeSpace;
         const mockSource = new MockSTokenSource([
            'notationName',
            ' ',
            // Skipping externalId parsing here
            ' ',
            '>',
         ], 11, 0, 11);

         notationDeclaration.parse(mockSource, {
            type: notationPToken.type,
         }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainPTokenProps(notationPToken);
      });

      it('adopts the unassigned value from the externalId', () => {
         // delete the things that our mocking of declaration will not return
         const mockSource = new MockSTokenSource([
            'notationName',
            ' ',
            // Skipping externalId parsing here
            ' ',
            '>',
         ]);
         externalIDParseSpy.and.callFake((_1: any, _2: any, cb: ExternalIDCallback) => {
            cb({ unassigned: [ 7734 ] });
         });

         notationDeclaration.parse(mockSource, {
            type: notationPToken.type,
         }, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0].unassigned).toEqual([ 7734 ]);
      });

      it('sets up to let unassigned handle checking for a PE Reference', () => {
         const checkCallbackSpy = jasmine.createSpy();
         unassignedMakeCheckSpy.and.returnValue(checkCallbackSpy);
         unassignedCheckForSpy.and.callFake(() => {});
         const mockSource = new MockSTokenSource([]);

         notationDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(unassignedMakeCheckSpy.calls.argsFor(0)[0].type).toEqual(notationDeclaration.PTYPE);
         expect(unassignedMakeCheckSpy.calls.argsFor(0)[1]).toEqual('name');
         expect(unassignedMakeCheckSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
         expect(unassignedMakeCheckSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         expect(unassigned.checkForPERef).toHaveBeenCalledWith(mockSource, checkCallbackSpy);
      });

   });

   describe('assignUnassigned()', () => {
      let externalIDAssignSpy: jasmine.Spy;

      beforeEach(() => {
         spyOn(unassigned, 'assignToProps');
         externalIDAssignSpy = spyOn(externalId, 'assignUnassigned');
      });

      it('does not call assignToProps() if there is no unassigned', () => {
         notationDeclaration.assignUnassigned(notationPToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('deletes the unassigned property if it is empty', () => {
         notationPToken.unassigned = [];
         notationPToken.nextPropName = 'name';

         notationDeclaration.assignUnassigned(notationPToken);

         expect(notationPToken.unassigned).toBeUndefined();
         expect(notationPToken.nextPropName).toBeUndefined();
      });

      it('does not call assignToProps() if there is still an unexpanded param ref', () => {
         notationPToken.unassigned = [ {
            type: 'reference',
         } ];

         notationDeclaration.assignUnassigned(notationPToken);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('calls unassigned.assignToProps() if the nextPropName is "name"', () => {
         notationPToken = new notationDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'name',
         });

         notationDeclaration.assignUnassigned(notationPToken);

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            [ 'foo' ],
            notationPToken,
            'name', [
               { name: 'postDeclTypeSpace', type: 'space' },
               { name: 'name', type: 'word' },
               { name: 'postNameSpace', type: 'space' },
            ]);
      });

      it('calls externalId.assignUnassigned() with the toplevel unassigned value', () => {
         notationPToken = new notationDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'name',
         });
         let testName: string = '';
         externalIDAssignSpy.and.callFake((external: ExternalId, container: NotationDeclarationPToken, propName: string) => {
            expect(external).toEqual({
               unassigned: [ 'foo' ],
            });
            expect(container).toEqual(notationPToken);
            testName = propName;
         });

         notationDeclaration.assignUnassigned(notationPToken);

         expect(testName).toEqual('postNameSpace');
      });

      it('calls externalId.assignUnassigned() its own unassigned value, if present', () => {
         notationPToken = new notationDeclaration.PToken({
            unassigned: [ 'foo' ],
            externalId: {
               unassigned: [ 'different' ],
               nextPropName: 'idType',
            },
         });
         let testName = '';
         externalIDAssignSpy.and.callFake((external: ExternalId, container: NotationDeclarationPToken, propName: string) => {
            expect(external).toEqual({
               unassigned: [ 'different' ],
               nextPropName: 'idType',
            });
            expect(container).toEqual(notationPToken);
            testName = propName;
         });

         notationDeclaration.assignUnassigned(notationPToken);

         expect(testName).toEqual('postNameSpace');
      });

      it('adds an "extra" property if the unassigned values are not consumed', () => {
         notationPToken = new notationDeclaration.PToken({
            unassigned: [ 'foo' ],
         });

         notationDeclaration.assignUnassigned(notationPToken);

         expect(notationPToken.extra).toEqual([ 'foo' ]);
      });

      it('removes all unassigned and nextPropName values', () => {
         notationPToken = new notationDeclaration.PToken({
            unassigned: [ 'foo' ],
            nextPropName: 'name',
            externalId: {
               unassigned: [ 'different' ],
               nextPropName: 'idType',
            },
         });

         notationDeclaration.assignUnassigned(notationPToken);

         expect(notationPToken).toEqual(new notationDeclaration.PToken({
            extra: [ 'foo' ],
            externalId: {},
         }));
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;


      beforeEach(() => {
         emd = new EntityMetaData();
         mockErrorCollector = new MockErrorCollector();
         spyOn(declaration, 'checkWellFormed');
         spyOn(externalId, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('asks the declaration module to look for problems in the declaration part', () => {
         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(declaration.checkWellFormed).toHaveBeenCalledWith(notationPToken, mockErrorCollector, emd);
      });

      it('asks the externalId module to look for well formed problems', () => {
         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(externalId.checkWellFormed)
            .toHaveBeenCalledWith(notationPToken.externalId, mockErrorCollector, emd);
      });

      it('reports no errors if the notationPToken is undefined', () => {
         notationDeclaration.checkWellFormed(undefined, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no errors if there are unassigned values', () => {
         delete notationPToken.name;
         notationPToken.unassigned = [];

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports an error if there is no name', () => {
         delete notationPToken.name;

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,   // this would be the space after NOTATION, but it is mocked out
         });
      });

      it('calls misc.checkName() to report on bad names', () => {
         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(notationPToken.name,
            mockErrorCollector, emd, WellFormedError.ID.NOTATIONDECL_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(notationPToken.name,
            mockErrorCollector, emd, 'NOTATION', XmlWarning.ID.NOTATIONDECL_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED);
      });

      it('reports an error if there is no space after the name', () => {
         delete notationPToken.postNameSpace;

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NAME_NO_SPACE,
            params: [ 'notationName' ],
            position: undefined,
            lastPosition: notationPToken.name,
         });
      });

      it('reports an error if there is no external ID', () => {
         notationPToken.externalId = undefined;

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_EXTERNALID,
            params: undefined,
            lastPosition: notationPToken.postNameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete notationPToken.close;

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_CLOSE,
            params: [ notationPToken.name!.str ],
            position: undefined,
            lastPosition: notationPToken.postExternalIdSpace,
         });
      });

      it('calls unassigned.checkExtra() with extras', () => {
         spyOn(unassigned, 'checkExtra');
         const startSToken = new SToken('one', 'one', new Range(undefined, 0, 0, 0, 0, 0, 0));
         notationPToken.extra = [
            unassigned.wordFromSToken(startSToken),
         ];

         notationDeclaration.checkWellFormed(notationPToken, mockErrorCollector, emd);

         expect(unassigned.checkExtra).toHaveBeenCalledWith(notationPToken.extra,
            mockErrorCollector,
            WellFormedError.ID.NOTATIONDECL_EXTRA_TEXT);
      });

   });

   describe('pTokenToXToken()', () => {

      beforeEach(() => {
         spyOn(externalId, 'makeEntityLocation');
      });

      it('calls externalId.makeEntityLocation()', () => {
         notationDeclaration.pTokenToXToken(notationPToken);

         expect(externalId.makeEntityLocation).toHaveBeenCalledWith(notationPToken.externalId);
      });

      it('returns notation declaration token with the name from the parsing', () => {
         const token = notationDeclaration.pTokenToXToken(notationPToken);

         expect(token).toEqual(new notationDeclaration.XToken('notationName', undefined, notationPToken));
      });

      it('returns a notation declaration with a blank name if there is no name', () => {
         delete notationPToken.name;
         const token = notationDeclaration.pTokenToXToken(notationPToken);

         expect(token).toEqual(new notationDeclaration.XToken('', undefined, notationPToken));
      });

   });

});
