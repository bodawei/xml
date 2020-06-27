/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityLocation, EntityMetaData, Range } from 'basic';
import { MockErrorCollector } from'error-test';
import { SToken } from 'sToken';
import { makeSTokenMaker, STokenMaker } from 'sToken-test';
import { WellFormedError, XmlWarning } from 'error';

import declaration from '../../bridge/baseDeclaration';
import { GeneralEntityDeclarationPToken } from '../../generalEntityDeclaration';
import { ParameterEntityDeclarationPToken } from '../../parameterEntityDeclaration';
import unassigned from '../unassigned';
import externalId from '../externalId';
import misc from '../misc';
import literal from '../literal';
import { assignUnassigned, checkWellFormed } from '../entity';

describe('entity (unit)', () => {
   let genEntityDeclarationPToken: GeneralEntityDeclarationPToken;
   let paramGeneralEntityDeclarationPToken: ParameterEntityDeclarationPToken;

   beforeEach(() => {
      const makeSToken = makeSTokenMaker();
      genEntityDeclarationPToken = new GeneralEntityDeclarationPToken({
         name: makeSToken('anEntity'),
         nameSpace: makeSToken(' '),
         externalIdSpace: makeSToken(' '),
         close: makeSToken('>'),
      });

      const makeToken = makeSTokenMaker();
      paramGeneralEntityDeclarationPToken = new ParameterEntityDeclarationPToken({
         parameter: makeToken('%'),
         parameterSpace: makeToken(' '),
         name: makeToken('anEntity'),
         nameSpace: makeToken(' '),
         close: makeToken('>'),
      });
   });

   describe('assignUnassigned()', () => {
      let extUnass: jasmine.Spy;
      let unAssign: jasmine.Spy;

      beforeEach(() => {
         unAssign = spyOn(unassigned, 'assignToProps');
         extUnass = spyOn(externalId, 'assignUnassigned');
      });

      it('does not call assignToProps() if there is no unassigned', () => {
         assignUnassigned({} as any);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      it('deletes the unassigned property if it is empty', () => {
         const declPToken = {
            unassigned: [],
            nextPropName: 'name',
         };

         assignUnassigned(declPToken as any);

         expect(declPToken.unassigned).toBeUndefined();
         expect(declPToken.nextPropName).toBeUndefined();
      });

      it('does not call assignToProps() if there is still an unexpanded param ref', () => {
         const declPToken = {
            unassigned: [ {
               type: 'reference',
            } ],
         };

         assignUnassigned(declPToken as any);

         expect(unassigned.assignToProps).not.toHaveBeenCalled();
      });

      describe('unassigned in prolog', () => {

         it('calls unassigned.assignToProps() when the match is in the prolog', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            assignUnassigned(declPToken);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'name', [
                  { name: 'declTypeSpace', type: 'space' },
                  { name: 'parameter', type: 'word', allowed: /%/ },
                  { name: 'parameterSpace', type: 'space' },
                  { name: 'name', type: 'word' },
                  { name: 'nameSpace', type: 'space' },
               ]);
         });

         it('calls externalId.assignUnassigned() if externalId in PERef', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'name',
            });
            let propName: string;
            extUnass.and.callFake((externalId: any, pToken: any, name: string) => {
               // check externalId now, before it is modified
               expect(externalId).toEqual({
                  unassigned: unassignedValue
               });
               expect(pToken).toEqual(declPToken);
               propName = name;
            });

            assignUnassigned(declPToken);

            expect(propName!).toEqual('nameSpace'); // make sure we've evaluated above
         });

         it('calls unassigned.assignToProps() with the epilog', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            assignUnassigned(declPToken);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'externalIdSpace', [
                  { name: 'externalIdSpace', type: 'space' },
                  { name: 'nData', type: 'word' },
                  { name: 'nDataSpace', type: 'space' },
                  { name: 'nDataName', type: 'word' },
                  { name: 'nDataNameSpace', type: 'space' },
               ]);
         });

         it('moves any unused unassigned values into an .extra property', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'name',
            });

            assignUnassigned(declPToken);

            expect(declPToken.extra).toEqual(unassignedValue as any);
         });

      });

      describe('unassigned is the ExternalId or the EntityValue', () => {

         it('does not unassigned.assignToProps() with the prolog', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'entityValueOrId',
            });

            assignUnassigned(declPToken);

            expect(unassigned.assignToProps).not.toHaveBeenCalledWith(unassignedValue,
               declPToken, 'name', [
                  { name: 'declTypeSpace', type: 'space' },
                  { name: 'parameter', type: 'word', allowed: /%/ },
                  { name: 'parameterSpace', type: 'space' },
                  { name: 'name', type: 'word' },
                  { name: 'nameSpace', type: 'space' },
               ]);
         });

         it('calls externalId.assignUnassigned() if externalId IS the peref', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'entityValueOrId',
            });
            let propName: string;
            extUnass.and.callFake((externalId: any, pToken: any, name: string) => {
               // check externalId now, before it is modified
               expect(externalId).toEqual({
                  unassigned: unassignedValue
               });
               expect(pToken).toEqual(declPToken);
               propName = name;
            });

            assignUnassigned(declPToken);

            expect(propName!).toEqual('nameSpace'); // make sure we've evaluated above
         });

         it('calls unassigned.assignToProps() with the epilog if we found an externalId', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'entityValueOrId',
            });

            assignUnassigned(declPToken);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'externalIdSpace', [
                  { name: 'externalIdSpace', type: 'space' },
                  { name: 'nData', type: 'word' },
                  { name: 'nDataSpace', type: 'space' },
                  { name: 'nDataName', type: 'word' },
                  { name: 'nDataNameSpace', type: 'space' },
               ]);
         });

         it('calls unassigned.assignToProps() if EntityValue IS the peref', () => {
            const unassignedValue: any = [ {
               type: 'literal',
            } ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'entityValueOrId',
            });

            assignUnassigned(declPToken);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'EntityValue', [
                  { name: 'nameSpace', type: 'space' },
                  { name: 'EntityValue', type: 'literal', flatten: true },
                  { name: 'entityValueSpace', type: 'space' },
               ]);
         });

         it('calls unassigned.assignToProps() if EntityValue IS the peref, and preceeded by space', () => {
            const unassignedValue: any = [ {
               type: 'space',
               token: {}
            }, {
               type: 'literal',
            } ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'entityValueOrId',
            });

            assignUnassigned(declPToken);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'EntityValue', [
                  { name: 'nameSpace', type: 'space' },
                  { name: 'EntityValue', type: 'literal', flatten: true },
                  { name: 'entityValueSpace', type: 'space' },
               ]);
         });

         it('does not unassigned.assignToProps() with the epilog if we found an EntityValue', () => {
            const unassignedValue: any = [ {
               type: 'literal',
            } ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'entityValueOrId',
            });

            assignUnassigned(declPToken);

            expect(unassigned.assignToProps).not.toHaveBeenCalledWith(unassignedValue,
               declPToken, 'externalIdSpace', [
                  { name: 'externalIdSpace', type: 'space' },
                  { name: 'nData', type: 'word' },
                  { name: 'nDataSpace', type: 'space' },
                  { name: 'nDataName', type: 'word' },
                  { name: 'nDataNameSpace', type: 'space' },
               ]);
         });

      });

      describe('unassigned inside externalId', () => {

         it('calls externalId.assignUnassigned() if externalId has an unassigned value', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               externalId: {
                  unassigned: unassignedValue,
                  nextPropName: 'name',
               },
            });

            assignUnassigned(declPToken);

            expect(externalId.assignUnassigned).toHaveBeenCalledWith(
               declPToken.externalId!, declPToken, 'nameSpace');
         });

         it('calls unassigned.assignToProps() if externalId has an unassigned value', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               externalId: {
                  unassigned: unassignedValue,
                  nextPropName: 'name',
               },
            });

            assignUnassigned(declPToken);

            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'externalIdSpace', [
                  { name: 'externalIdSpace', type: 'space' },
                  { name: 'nData', type: 'word' },
                  { name: 'nDataSpace', type: 'space' },
                  { name: 'nDataName', type: 'word' },
                  { name: 'nDataNameSpace', type: 'space' },
               ]);
         });

         it('removes any unassigned values in the externalId', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               externalId: {
                  unassigned: unassignedValue,
                  nextPropName: 'name',
               },
            });

            assignUnassigned(declPToken);

            expect(declPToken!.externalId!.unassigned).toBeUndefined();
            expect(declPToken!.externalId!.extra).toBeUndefined();
            expect(declPToken!.externalId!.nextPropName).toBeUndefined();
         });

      });

      describe('unassigned inside epilog', () => {

         it('does not call externalId.assignUnassigned()', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               nextPropName: 'nData',
            });

            assignUnassigned(declPToken);

            expect(externalId.assignUnassigned).not.toHaveBeenCalled();
         });

         it('calls unassigned.assignToProps() only with the epilog values', () => {
            const unassignedValue: any = [ 'foo' ];
            const declPToken = new GeneralEntityDeclarationPToken({
               unassigned: unassignedValue,
               externalId: {
                  unassigned: unassignedValue,
                  nextPropName: 'nData',
               },
            });

            assignUnassigned(declPToken);

            expect(unAssign.calls.count()).toEqual(1);
            expect(unassigned.assignToProps).toHaveBeenCalledWith(unassignedValue,
               declPToken, 'externalIdSpace', [
                  { name: 'externalIdSpace', type: 'space' },
                  { name: 'nData', type: 'word' },
                  { name: 'nDataSpace', type: 'space' },
                  { name: 'nDataName', type: 'word' },
                  { name: 'nDataNameSpace', type: 'space' },
               ]);
         });

      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;
      let pToken: any;
      let expectedSToken: STokenMaker;
      let emd: EntityMetaData;

      beforeEach(() => {
         emd = new EntityMetaData();
         mockErrorCollector = new MockErrorCollector();
         expectedSToken = makeSTokenMaker();
         pToken = {
            open: expectedSToken('<!'),
            declType: expectedSToken('ENTITY'),
            declTypeSpace: expectedSToken('\t'),
            name: expectedSToken('entityName'),
            nameSpace: expectedSToken(' '),
            openQuote: expectedSToken('"'),
            value: expectedSToken('entityValue'),
            closeQuote: expectedSToken('"'),
            entityValueSpace: undefined,
            close: expectedSToken('>'),
         };
         spyOn(declaration, 'checkWellFormed');
         spyOn(misc, 'checkName');
         spyOn(misc, 'checkWellFormedNameRecommendation');
         spyOn(misc, 'checkCharWellFormed');
         spyOn(externalId, 'checkWellFormed');
         spyOn(literal, 'checkWellFormed');
      });

      it('reports no errors if the entity declaration PToken is undefined', () => {
         checkWellFormed(undefined, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no errors if there are unassigned values', () => {
         delete pToken.name;
         pToken.unassigned = [{ something: true }];

         checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      // it('asks the declaration module to look for problems in the declaration part', () => {
      //    const emd = new EntityMetaData();

      //    checkWellFormed(pToken, mockErrorCollector, emd);

      //    expect(declaration.checkWellFormed).toHaveBeenCalledWith(pToken, mockErrorCollector, emd);
      // });

      it('asks the literal module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         checkWellFormed(pToken, mockErrorCollector, emd);

         expect(literal.checkWellFormed).toHaveBeenCalledWith(pToken, mockErrorCollector, emd,
            WellFormedError.ID.NOUN_ENTITYVALUE);
      });

      it('reports an error if % is not followed by a space', () => {
         pToken.parameter = expectedSToken('%');

         checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ 'entityName' ], undefined);
      });

      it('reports an error if there is no name', () => {
         delete pToken.name;

         checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: pToken.declType,
         });
      });

      it('calls misc.checkName() to report on name validity', () => {
         checkWellFormed(pToken, mockErrorCollector, emd);

         expect(misc.checkName).toHaveBeenCalledWith(pToken.name,
            mockErrorCollector, emd, WellFormedError.ID.ENTITYDECL_NAME_INVALID);
      });

      it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
         checkWellFormed(pToken, mockErrorCollector, emd);

         expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(pToken.name,
            mockErrorCollector, emd, 'ENTITY', XmlWarning.ID.ENTITYDECL_NAME_XMLDASH_RESERVED,
            XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED);
      });

      it('reports an error if there is no space after the name', () => {
         delete pToken.nameSpace;

         checkWellFormed(pToken, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE,
            params: [ 'entityName' ],
            position: undefined,
            lastPosition: pToken.name,
         });
      });

      it('calls externalId.checkWellFormed() to check on the externalId', () => {
         delete pToken.openQuote;
         delete pToken.value;
         delete pToken.closeQuote;
         pToken.externalId = { externalId: true };
         const emd = new EntityMetaData();

         checkWellFormed(pToken, mockErrorCollector, emd);

         expect(externalId.checkWellFormed).toHaveBeenCalledWith(pToken.externalId,
            mockErrorCollector, emd);
      });

      it('reports an error if NDATA is the wrong case', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedSToken('nData');
         pToken.nDataName = expectedSToken('foo');

         checkWellFormed(new GeneralEntityDeclarationPToken(pToken), mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NDATA_INVALID_CASE,
            params: [ 'entityName', 'nData' ],
            position: pToken.nData,
         });
      });

      it('reports an error if there is no NDATA value', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedSToken('nData');

         checkWellFormed(new GeneralEntityDeclarationPToken(pToken), mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NDATA_NO_NAME,
            params: [ 'entityName' ],
            lastPosition: pToken.nData,
         });
      });

      it('calls checkCharWellFormed() to check on the ndata value', () => {
         pToken.externalId = { externalId: true };
         pToken.nData = expectedSToken('NDATA');
         pToken.nDataName = expectedSToken('foo');
         const emd = new EntityMetaData();

         checkWellFormed(new GeneralEntityDeclarationPToken(pToken), mockErrorCollector, emd);

         expect(misc.checkCharWellFormed).toHaveBeenCalledWith(pToken.nDataName,
            mockErrorCollector, emd);
      });

      it('reports an error if there is no EnitytValue or ExternalID', () => {
         delete pToken.openQuote;
         delete pToken.value;
         delete pToken.closeQuote;

         checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_VALUE,
            params: [ 'entityName' ],
            lastPosition: pToken.nameSpace,
         });
      });

      it('reports an error if there was no closing', () => {
         delete pToken.close;

         checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_CLOSE,
            params: [ 'entityName' ],
            position: undefined,
            lastPosition: pToken.nameSpace,
         });
      });

      it('calls unassigned.checkExtra() with extras', () => {
         spyOn(unassigned, 'checkExtra');
         const startSToken = new SToken('one', 'one', new Range(new EntityLocation(), 0, 0, 0, 0, 0, 0));
         pToken.extra = [
            unassigned.wordFromSToken(startSToken),
         ];

         checkWellFormed(pToken, mockErrorCollector, new EntityMetaData());

         expect(unassigned.checkExtra).toHaveBeenCalledWith(pToken.extra,
            mockErrorCollector,
            WellFormedError.ID.ENTITYDECL_EXTRA_TEXT);
      });

   });

});
