/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { XmlWarning, WellFormedError } from 'error';
import { MockErrorCollector } from 'error-test';
import { SToken } from 'sToken';
import { MockSTokenSource } from 'sToken-test';

import externalId from '../common/externalId';
import misc from '../common/misc';
import unassigned, { UnassignedArray } from '../common/unassigned';
import {
   NotationDeclarationPToken,
   NotationDeclarationXToken,
   parseNotationDeclaration,
} from '../notationDeclaration';

describe('notationdeDeclaration (unit)', () => {
   let notationPToken: NotationDeclarationPToken;

   beforeEach(() => {
      notationPToken = new NotationDeclarationPToken({
         open: SToken.fromString('<!'),
         openSpace: undefined,
         declType: SToken.fromString('NOTATION'),
         declTypeSpace: SToken.fromString(' '),
         name: SToken.fromString('notationName'),
         nameSpace: SToken.fromString(' '),
         externalId: {
            type: 'EXTERNAL_ID',
             peRefPlus: [],
         },
         externalIdSpace: SToken.fromString(' '),
         close: SToken.fromString('>'),
      });
   });

   describe('parseNotationDeclaration()', () => {
      let callback: jasmine.Spy;
      let externalIDParseSpy: jasmine.Spy;
      let unassignedParsePERefSpy: jasmine.Spy;
      let peRefCallback: () => void;
      let nonPeRefCallback: () => void;

      beforeEach(() => {
         nonPeRefCallback = () => { };
         callback = jasmine.createSpy('callbackSpy');
         externalIDParseSpy = spyOn(externalId, 'parse');
         externalIDParseSpy.and.callFake((_1: any, _2: any, cb: (arg: any) => void) => {
            cb({ externalId: true });
         });
         unassignedParsePERefSpy = spyOn(unassigned as any, 'parsePERefOrOrdinary').and.callFake((_1: any, _2: any, _3: any, cb1: () => void, cb2: () => void) => { // typeHack
            peRefCallback = cb1;
            nonPeRefCallback = cb2;
         });
      });

      it('calls externalId.parse()', () => {
         const mockSource = new MockSTokenSource([
            'name',
            ' ',
            undefined,
            '>',
         ]);

         parseNotationDeclaration(mockSource, notationPToken, callback);
         nonPeRefCallback();
         mockSource.respondInAsyncTime();

         expect(externalIDParseSpy.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(externalIDParseSpy.calls.argsFor(0)[1]).toEqual(['>']);
         expect(externalIDParseSpy.calls.argsFor(0)[2]).toBeInstanceOf(Function);
      });

      it('does a simple parse', () => {
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('notationName'),
            nameSpace: SToken.fromString(' '),
            externalId: {
               'externalId': true,
            } as any,
            externalIdSpace: SToken.fromString(' '),
            close: SToken.fromString('>'),
         });
         const mockSource = new MockSTokenSource([
            'notationName',
            ' ',
            // Skipping externalId parsing here
            ' ',
            '>',
         ]);

         parseNotationDeclaration(mockSource, {
            open: SToken.fromString('<!'),
         }, callback);
         nonPeRefCallback();
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqualRangeless(notationPToken);
      });

      it('parses a parameter entity reference instead of the name', () => {
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            close: SToken.fromString('>'),
         });
         const mockSource = new MockSTokenSource([
            '>',
         ]);

         parseNotationDeclaration(mockSource, {
            open: SToken.fromString('<!'),
         }, callback);
         peRefCallback();
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0]).toEqualRangeless(notationPToken);
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
         externalIDParseSpy.and.callFake((_1: any, _2: any, cb: (x: any) => void) => {
            cb({ unassigned: [7734] });
         });

         parseNotationDeclaration(mockSource, {
            open: SToken.fromString('<!'),
         }, callback);
         nonPeRefCallback();
         mockSource.respondInAsyncTime();

         expect(callback.calls.argsFor(0)[0].unassigned).toEqual([7734]);
      });

      it('checks for a parameter entity reference before reading the name', () => {
         const mockSource = new MockSTokenSource([]);

         parseNotationDeclaration(mockSource, {
            open: SToken.fromString('<!'),
         }, callback);
         mockSource.respondInAsyncTime();

         expect(unassignedParsePERefSpy.calls.argsFor(0)[0]).toEqual(mockSource);
         expect(unassignedParsePERefSpy.calls.argsFor(0)[1].open).toEqual(SToken.fromString('<!'));
         expect(unassignedParsePERefSpy.calls.argsFor(0)[2]).toEqual('name');
         expect(unassignedParsePERefSpy.calls.argsFor(0)[3]).toBeInstanceOf(Function);
         expect(unassignedParsePERefSpy.calls.argsFor(0)[4]).toBeInstanceOf(Function);
      });

   });

   describe('pToken.assignUnassigned()', () => {
      let externalIDAssignSpy: jasmine.Spy;

      beforeEach(() => {
         spyOn(unassigned, 'assignToProps');
         externalIDAssignSpy = spyOn(externalId, 'assignUnassignedNew');
      });

      it('does not call assignToProps() if there is no unassigned', () => {
         notationPToken.assignUnassigned();

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('sets the extra property to be empty if unassigned is empty', () => {
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('notationName'),
            nameSpace: SToken.fromString(' '),
            externalId: {
               type: 'EXTERNAL_ID',             peRefPlus: [],

            },
            externalIdSpace: SToken.fromString(' '),
            close: SToken.fromString('>'),
            unassigned: [],
            nextPropName: 'name',
         });

         notationPToken.assignUnassigned();

         expect(notationPToken.extra).toEqual([]);
      });

      it('does not call assignToProps() if there is still an unexpanded param ref', () => {
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            name: SToken.fromString('notationName'),
            nameSpace: SToken.fromString(' '),
            externalId: {
               type: 'EXTERNAL_ID',             peRefPlus: [],

            },
            externalIdSpace: SToken.fromString(' '),
            close: SToken.fromString('>'),
            unassigned: [{
               type: 'reference',
            }] as any,
         });

         notationPToken.assignUnassigned();

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('calls unassigned.assignToProps() if the nextPropName is "name"', () => {
         notationPToken = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            unassigned: ['foo'] as any as any,
            nextPropName: 'name',
         });

         notationPToken.assignUnassigned();

         expect(unassigned.assignToProps).toHaveBeenCalledWith(
            ['foo'] as any,
            notationPToken,
            'name', [
               { name: 'declTypeSpace', type: 'space' },
               { name: 'name', type: 'word' },
               { name: 'nameSpace', type: 'space' },
            ]);
      });

      it('calls externalId.assignUnassigned() with the toplevel unassigned value', () => {
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            unassigned: [unassigned.wordFromSToken(SToken.fromString('foo'))],
            nextPropName: 'name',
         });
         let testName: string = '';
         externalIDAssignSpy.and.callFake((un: UnassignedArray, container: NotationDeclarationPToken, propName: string) => {
            expect(un).toEqual([unassigned.wordFromSToken(SToken.fromString('foo'))]);
            expect(container).toEqual(notationPToken);
            testName = propName;
         });

         notationPToken.assignUnassigned();

         expect(testName).toEqual('nameSpace');
      });

      it('adds an "extra" property if the unassigned values are not consumed', () => {
         notationPToken = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            unassigned: ['foo'] as any,
         });

         notationPToken.assignUnassigned();

         expect(notationPToken.extra as any).toEqual(['foo']);
      });

      it('removes all unassigned and nextPropName values', () => {
         notationPToken = new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            unassigned: ['foo'] as any,
            nextPropName: 'name',
            externalId: {
               type: 'EXTERNAL_ID',             peRefPlus: [],

            },
         });

         notationPToken.assignUnassigned();

         expect(notationPToken).toEqualRangeless(new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: SToken.fromString('<!'),
            unassigned: ['foo'] as any,
            nextPropName: 'name',
            externalId: {
               type: 'EXTERNAL_ID',             peRefPlus: [],

            },
            extra: ['foo'] as any,
         }));
      });

   });

   describe('pToken.checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let emd: EntityMetaData;


      beforeEach(() => {
         emd = new EntityMetaData();
         mockErrorCollector = new MockErrorCollector();
         spyOn(externalId, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
      });

      it('asks the externalId module to look for well formed problems', () => {
         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(externalId.checkWellFormed)
            .toHaveBeenCalledWith(notationPToken.externalId, mockErrorCollector, emd);
      });

      it('calls misc.checkName() to report on bad names', () => {
         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(notationPToken.name,
            mockErrorCollector, emd, WellFormedError.ID.NOTATIONDECL_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(notationPToken.name,
            mockErrorCollector, emd, 'NOTATION', XmlWarning.ID.NOTATIONDECL_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED);
      });

      it('reports an error if there is an unassigned parameter entity', () => {
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            unassigned: [],
         });

         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_UNASSIGNED,
            params: undefined,
            position: notationPToken.open,
         });
      });

      it('reports an error if there is an extra opening space', () => {
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            openSpace: SToken.fromString(' '),
            declType: SToken.fromString('NOTATION'),
            declTypeSpace: SToken.fromString(' '),
            name: SToken.fromString('notationName'),
            nameSpace: SToken.fromString(' '),
            externalId: {
               type: 'EXTERNAL_ID',             peRefPlus: [],

            },
            externalIdSpace: SToken.fromString(' '),
            close: SToken.fromString('>'),
         });

         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_OPEN_XTRA_SPACE_AFTER,
            params: undefined,
            position: notationPToken.openSpace,
         });
      });

      it('reports an error if notation is not capitalized', () => {
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            openSpace: SToken.fromString(' '),
            declType: SToken.fromString('notation'),
         });

         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_DECLTYPE_INVALID,
            params: ['notation'],
            position: notationPToken.declType,
         });
      });

      it('reports an error if there is no name', () => {
         delete (notationPToken as any).name;

         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: notationPToken.declType
         });
      });

      it('reports an error if there is no space after the name', () => {
         delete (notationPToken as any).nameSpace;

         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NAME_NO_SPACE,
            params: ['notationName'],
            position: undefined,
            lastPosition: notationPToken.name,
         });
      });

      it('reports an error if there is no external ID', () => {
         (notationPToken as any).externalId = undefined;

         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_EXTERNALID,
            params: undefined,
            position: notationPToken.nameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete (notationPToken as any).close;

         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.NOTATIONDECL_NO_CLOSE,
            params: [notationPToken.name!.str],
            position: undefined,
            lastPosition: notationPToken.externalIdSpace,
         });
      });

      it('calls unassigned.checkExtra() with extras', () => {
         spyOn(unassigned, 'checkExtra');
         const startSToken = new SToken('one', 'one', new Range(new EntityLocation(), 0, 0, 0, 0, 0, 0));
         (notationPToken as any).extra = [
            unassigned.wordFromSToken(startSToken),
         ];

         notationPToken.checkWellFormed(mockErrorCollector, emd);

         expect(unassigned.checkExtra).toHaveBeenCalledWith(notationPToken.extra,
            mockErrorCollector,
            WellFormedError.ID.NOTATIONDECL_EXTRA_TEXT);
      });

   });

   describe('pToken.toXToken()', () => {

      beforeEach(() => {
         spyOn(externalId, 'makeEntityLocation');
      });

      it('calls externalId.makeEntityLocation()', () => {
         notationPToken.toXToken();

         expect(externalId.makeEntityLocation).toHaveBeenCalledWith(notationPToken.externalId);
      });

      it('returns notation declaration token with the name from the parsing', () => {
         const token = notationPToken.toXToken();

         expect(token).toEqual(new NotationDeclarationXToken('notationName', undefined, notationPToken));
      });

      it('returns a notation declaration with a blank name if there is no name', () => {
         delete (notationPToken as any).name;
         const token = notationPToken.toXToken();

         expect(token).toEqual(new NotationDeclarationXToken('', undefined, notationPToken));
      });

   });

   describe('pToken.toSToken()', () => {

      it('returns all the STokens', () => {
         spyOn(externalId, 'getSTokens').and.returnValue([]);
         spyOn(unassigned, 'getSTokens').and.returnValue([]);
         notationPToken = new NotationDeclarationPToken({
            open: SToken.fromString('<!'),
            openSpace: SToken.fromString(' '),
            declType: SToken.fromString('NOTATION'),
            declTypeSpace: SToken.fromString(' '),
            name: SToken.fromString('notationName'),
            nameSpace: SToken.fromString(' '),
            externalId: {
               type: 'EXTERNAL_ID',             peRefPlus: [],

            },
            externalIdSpace: SToken.fromString(' '),
            close: SToken.fromString('>'),
         });

         const result = notationPToken.toSTokenArray();

         expect(result).toEqual([
            notationPToken.open,
            notationPToken.openSpace,
            notationPToken.declType,
            notationPToken.declTypeSpace,
            notationPToken.name,
            notationPToken.nameSpace,
            notationPToken.externalIdSpace,
            notationPToken.close,
         ] as Array<SToken>);
      });

   });

});
