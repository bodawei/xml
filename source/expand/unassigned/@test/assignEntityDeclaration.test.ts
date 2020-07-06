/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import {
   GeneralEntityDeclarationPToken,
   UnassignedType,
   UnassignedArray,
   wordFromSToken,
} from 'token';
import { makeGeneralEntityDeclaration } from 'token-test';

import * as assignExternalId from '../assignExternalId';
import * as assignToProps from '../assignToProps';
import { assignEntityDeclaration } from '../assignEntityDeclaration';

describe('assignEntityDeclaration() (unit)', () => {
   let testUnassigned: UnassignedArray;
   let genEntity: GeneralEntityDeclarationPToken;
   let extUnass: jasmine.Spy;
   let assignToPropsSpy: jasmine.Spy;

   beforeEach(() => {
      assignToPropsSpy = spyOn(assignToProps, 'assignToProps');
      extUnass = spyOn(assignExternalId, 'assignExternalId');

      extUnass.and.returnValue({
         unassigned: [],
      });

      testUnassigned = [wordFromSToken(toSToken('foo'))];
      genEntity = makeGeneralEntityDeclaration();
   });

   it('does not call assignToProps() if there is no unassigned', () => {
      assignEntityDeclaration(undefined, genEntity);

      expect(assignToPropsSpy).not.toHaveBeenCalled();
   });

   it('deletes the unassigned property if it is empty', () => {
      (genEntity as any).nextPropName = 'name';

      assignEntityDeclaration([], genEntity);
   });

   it('does not call assignToProps() if there is still an unexpanded param ref', () => {
      assignEntityDeclaration(
         [
            {
               type: UnassignedType.REFERENCE,
            },
         ] as any,
         genEntity,
      );

      expect(assignToPropsSpy).not.toHaveBeenCalled();
   });

   describe('unassigned in prolog', () => {
      it('calls assignToProps() when the match is in the prolog', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'name',
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(assignToPropsSpy).toHaveBeenCalledWith(testUnassigned, declPToken, 'name', [
            { name: 'declTypeSpace', type: 'space' },
            { name: 'parameter', type: 'word', allowed: /%/ },
            { name: 'parameterSpace', type: 'space' },
            { name: 'name', type: 'word' },
            { name: 'nameSpace', type: 'space' },
         ]);
      });

      it('calls externalId.assignEntityDeclaration() if externalId in PERef', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'name',
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(extUnass).toHaveBeenCalledWith(testUnassigned, undefined, undefined);
      });

      it('calls assignToProps() with the epilog', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'name',
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(assignToPropsSpy).toHaveBeenCalledWith([], declPToken, 'externalIdSpace', [
            { name: 'externalIdSpace', type: 'space' },
            { name: 'nData', type: 'word' },
            { name: 'nDataSpace', type: 'space' },
            { name: 'nDataName', type: 'word' },
            { name: 'nDataNameSpace', type: 'space' },
         ]);
      });

      it('moves any unused unassigned values into an .extra property', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'name',
         });
         const unassignedThing = [wordFromSToken(toSToken('bar'))];
         extUnass.and.returnValue({
            unassigned: unassignedThing,
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(declPToken.extra).toEqual(unassignedThing);
      });
   });

   describe('unassigned is the ExternalId or the EntityValue', () => {
      it('does not assignToPropsSpy() with the prolog', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'entityValueOrId',
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(assignToPropsSpy).not.toHaveBeenCalledWith(testUnassigned, declPToken, 'name', [
            { name: 'declTypeSpace', type: 'space' },
            { name: 'parameter', type: 'word', allowed: /%/ },
            { name: 'parameterSpace', type: 'space' },
            { name: 'name', type: 'word' },
            { name: 'nameSpace', type: 'space' },
         ]);
      });

      it('calls externalId.assignEntityDeclaration() if externalId IS the peref', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'entityValueOrId',
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(extUnass).toHaveBeenCalledWith(testUnassigned, undefined, undefined);
      });

      it('calls assignToProps() with the epilog if we found an externalId', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'entityValueOrId',
         });
         const unassignedThing = [wordFromSToken(toSToken('bar'))];
         extUnass.and.returnValue({
            unassigned: unassignedThing,
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(assignToPropsSpy).toHaveBeenCalledWith(
            unassignedThing,
            declPToken,
            'externalIdSpace',
            [
               { name: 'externalIdSpace', type: 'space' },
               { name: 'nData', type: 'word' },
               { name: 'nDataSpace', type: 'space' },
               { name: 'nDataName', type: 'word' },
               { name: 'nDataNameSpace', type: 'space' },
            ],
         );
      });

      it('calls assignToProps() if EntityValue IS the peref', () => {
         const unassignedValue: any = [
            {
               type: UnassignedType.LITERAL,
            },
         ];
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'entityValueOrId',
         });

         assignEntityDeclaration(unassignedValue, declPToken);

         expect(assignToPropsSpy).toHaveBeenCalledWith(unassignedValue, declPToken, 'EntityValue', [
            { name: 'nameSpace', type: 'space' },
            { name: 'EntityValue', type: 'literal', flatten: true },
            { name: 'entityValueSpace', type: 'space' },
         ]);
      });

      it('calls assignToProps() if EntityValue IS the peref, and preceeded by space', () => {
         const unassignedValue: any = [
            {
               type: UnassignedType.SPACE,
               token: {},
            },
            {
               type: UnassignedType.LITERAL,
            },
         ];
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'entityValueOrId',
         });

         assignEntityDeclaration(unassignedValue, declPToken);

         expect(assignToPropsSpy).toHaveBeenCalledWith(unassignedValue, declPToken, 'EntityValue', [
            { name: 'nameSpace', type: 'space' },
            { name: 'EntityValue', type: 'literal', flatten: true },
            { name: 'entityValueSpace', type: 'space' },
         ]);
      });

      it('does not assignToPropsSpy() with the epilog if we found an EntityValue', () => {
         const unassignedValue: any = [
            {
               type: UnassignedType.LITERAL,
            },
         ];
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'entityValueOrId',
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(assignToPropsSpy).not.toHaveBeenCalledWith(
            unassignedValue,
            declPToken,
            'externalIdSpace',
            [
               { name: 'externalIdSpace', type: 'space' },
               { name: 'nData', type: 'word' },
               { name: 'nDataSpace', type: 'space' },
               { name: 'nDataName', type: 'word' },
               { name: 'nDataNameSpace', type: 'space' },
            ],
         );
      });
   });

   describe('unassigned inside externalId', () => {
      it('calls externalId.assignEntityDeclaration() if externalId has an unassigned value', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'name',
            externalId: {},
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(extUnass).toHaveBeenCalledWith(testUnassigned, 'name', declPToken.externalId!);
      });

      it('calls assignToProps() if externalId has an unassigned value', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'name',
            externalId: {},
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(assignToPropsSpy).toHaveBeenCalledWith([], declPToken, 'externalIdSpace', [
            { name: 'externalIdSpace', type: 'space' },
            { name: 'nData', type: 'word' },
            { name: 'nDataSpace', type: 'space' },
            { name: 'nDataName', type: 'word' },
            { name: 'nDataNameSpace', type: 'space' },
         ]);
      });
   });

   describe('unassigned inside epilog', () => {
      it('does not call externalId.assignEntityDeclaration()', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'nData',
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(extUnass).not.toHaveBeenCalled();
      });

      it('calls assignToProps() only with the epilog values', () => {
         const declPToken = new GeneralEntityDeclarationPToken({
            nextPropName: 'nData',
            externalId: {},
         });
         const unassignedThing = [wordFromSToken(toSToken('bar'))];
         extUnass.and.returnValue({
            unassigned: unassignedThing,
         });

         assignEntityDeclaration(testUnassigned, declPToken);

         expect(assignToPropsSpy.calls.count()).toEqual(1);
         expect(assignToPropsSpy).toHaveBeenCalledWith(
            unassignedThing,
            declPToken,
            'externalIdSpace',
            [
               { name: 'externalIdSpace', type: 'space' },
               { name: 'nData', type: 'word' },
               { name: 'nDataSpace', type: 'space' },
               { name: 'nDataName', type: 'word' },
               { name: 'nDataNameSpace', type: 'space' },
            ],
         );
      });
   });
});
