/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import {
   NotationDeclarationPToken,
   EXTERNAL_ID,
   UnassignedType,
   wordFromSToken,
   UnassignedArray,
} from 'token';
import { makeParameterEntityReference } from 'token-test';

import * as assignToProps from '../assignToProps';
import * as assignExternalId from '../assignExternalId';

import { assignNotationDeclaration } from '../assignNotationDeclaration';

describe('assignNotationDeclaration() (unit)', () => {
   let assignToPropsSpy: jasmine.Spy;
   let externalIDAssignSpy: jasmine.Spy;
   let notationPToken: NotationDeclarationPToken;
   let simpleUnassigned: UnassignedArray;

   beforeEach(() => {
      assignToPropsSpy = spyOn(assignToProps, 'assignToProps');
      externalIDAssignSpy = spyOn(assignExternalId, 'assignExternalId');
      externalIDAssignSpy.and.returnValue({});

      simpleUnassigned = [wordFromSToken(toSToken('foo'))];
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {
            type: EXTERNAL_ID,
         },
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
         nextPropName: 'name',
      });
   });

   it('does not call assignToProps() if there is no unassigned', () => {
      assignNotationDeclaration(undefined, notationPToken);

      expect(assignToPropsSpy).not.toHaveBeenCalled();
   });

   it('sets the extra property to be empty if unassigned is empty', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {
            type: EXTERNAL_ID,
         },
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
         nextPropName: 'name',
      });

      assignNotationDeclaration([], notationPToken);

      expect(notationPToken.extra).toEqual([]);
   });

   it('does not call assignToProps() if there is still an unexpanded param ref', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {
            type: EXTERNAL_ID,
         },
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      assignNotationDeclaration(
         [
            {
               type: UnassignedType.REFERENCE,
               token: makeParameterEntityReference(),
            },
         ],
         notationPToken,
      );

      expect(assignToPropsSpy).not.toHaveBeenCalled();
   });

   it('calls assignToProps() if the nextPropName is "name"', () => {
      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(assignToPropsSpy).toHaveBeenCalledWith(simpleUnassigned, notationPToken, 'name', [
         { name: 'declTypeSpace', type: 'space' },
         { name: 'name', type: 'word' },
         { name: 'nameSpace', type: 'space' },
      ]);
   });

   it('calls the assignExternalId() with undefined when the next prop is name', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         nextPropName: 'name',
      });

      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(externalIDAssignSpy).toHaveBeenCalledWith(simpleUnassigned, undefined, undefined);
   });

   it('calls the assignExternalId() with the nextPropName when it is anything but name', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         nextPropName: 'foo',
         externalId: { type: EXTERNAL_ID },
      });

      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(externalIDAssignSpy).toHaveBeenCalledWith(simpleUnassigned, 'foo', {
         type: EXTERNAL_ID,
      });
   });

   it('fills in the pre-space if this was found by the assignExternalId()', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         nextPropName: 'name',
      });
      externalIDAssignSpy.and.returnValue({
         preSpace: toSToken('xxx'),
      });

      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(notationPToken.nameSpace).toEqual(toSToken('xxx'));
   });

   it('merges an existing space with the pre-space if this was found by the assignExternalId()', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         nameSpace: toSToken('---'),
         nextPropName: 'name',
      });
      externalIDAssignSpy.and.returnValue({
         preSpace: toSToken('xxx'),
      });

      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(notationPToken.nameSpace).toEqual(toSToken('---xxx'));
   });

   it('fills in the externalId if this was found by the assignExternalId()', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         nextPropName: 'name',
      });
      externalIDAssignSpy.and.returnValue({
         externalId: { type: EXTERNAL_ID },
      });

      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(notationPToken.externalId).toEqual({ type: EXTERNAL_ID });
   });

   it('does not affect the externalId if none was returned by assignExternalId()', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         nextPropName: 'other',
         externalId: {
            type: EXTERNAL_ID,
            externalType: toSToken('SYSTEM'),
         },
      });
      externalIDAssignSpy.and.returnValue({});

      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(notationPToken.externalId).toEqual({
         type: EXTERNAL_ID,
         externalType: toSToken('SYSTEM'),
      });
   });

   it('adds an "extra" property if the unassigned values are not consumed', () => {
      notationPToken = new NotationDeclarationPToken({
         type: 'NOTATION_DECLARATION_PTOKEN',
         open: toSToken('<!'),
      });

      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(notationPToken.extra).toEqual(simpleUnassigned);
   });

   it('removes all unassigned and nextPropName values', () => {
      notationPToken = new NotationDeclarationPToken({
         type: 'NOTATION_DECLARATION_PTOKEN',
         open: toSToken('<!'),
         nextPropName: 'name',
         externalId: {
            type: EXTERNAL_ID,
         },
      });

      assignNotationDeclaration(simpleUnassigned, notationPToken);

      expect(notationPToken).toEqualRangeless(
         new NotationDeclarationPToken({
            type: 'NOTATION_DECLARATION_PTOKEN',
            open: toSToken('<!'),
            nextPropName: 'name',
            externalId: {
               type: EXTERNAL_ID,
            },
            extra: simpleUnassigned,
         }),
      );
   });
});
