/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import {
   ExternalId,
   UnassignedArray,
   UnassignedType,
   ParameterEntityReferencePToken,
   EXTERNAL_ID,
   wordFromSToken,
} from 'token';

import { assignExternalId } from '../assignExternalId';
import * as assignToProps from '../assignToProps';

describe('assignExternalId() (unit)', () => {
   let externalId: ExternalId;
   let unData: UnassignedArray;
   let unProps: jasmine.Spy;

   beforeEach(() => {
      unProps = spyOn(assignToProps, 'assignToProps');

      unData = [wordFromSToken(toSToken('SYSTEM'))];
      externalId = {
         type: EXTERNAL_ID,
      };
   });

   it('returns nothing when the unassigned array is empty', () => {
      expect(() => assignExternalId([], undefined, externalId)).not.toThrow();
   });

   it('does nothing if there is still an unexpanded parameter entity reference', () => {
      const unData: UnassignedArray = [
         {
            type: UnassignedType.REFERENCE,
            token: new ParameterEntityReferencePToken({ open: toSToken('%') }),
         },
      ];

      assignExternalId(unData, undefined, externalId);

      expect(unProps).not.toHaveBeenCalled();
   });

   it('calls assignToProps() with the preSpace if no nextPropName provided', () => {
      const expected = {
         type: EXTERNAL_ID,
      };
      assignExternalId(unData, undefined, externalId);

      expect(unProps).toHaveBeenCalledWith(unData, expected, 'externalType', [
         { name: 'preSpace', type: 'space' },
         { name: 'externalType', type: 'word', allowed: /public|system/i },
         { name: 'externalTypeSpace', type: 'space' },
      ]);
   });

   it('calls assignToProps() with no previous space property name, if a name is provided', () => {
      const expected = {
         ...externalId,
      };

      assignExternalId(unData, 'testPropName', externalId);

      expect(unProps).toHaveBeenCalledWith(unData, expected, 'testPropName', [
         { name: 'externalType', type: 'word', allowed: /public|system/i },
         { name: 'externalTypeSpace', type: 'space' },
      ]);
   });

   it('returns the previous space if that is found by the assigner', () => {
      unProps.and.callFake((_1, pToken) => {
         pToken.preSpace = toSToken('bogus');
      });

      const result = assignExternalId(unData, undefined, externalId);

      expect(result.preSpace).toEqual(toSToken('bogus'));
   });

   it('returns the remaining unassigned tokens', () => {
      unProps.and.callFake(() => {
         unData.shift();
         unData.push(wordFromSToken(toSToken('remainder')));
      });

      const result = assignExternalId(unData, undefined, externalId);

      expect(result.unassigned).toEqual([wordFromSToken(toSToken('remainder'))]);
   });

   it('passes the system descriptors to assignToProps() when externalType is SYSTEM', () => {
      unProps.and.callFake((values: UnassignedArray, pToken: ExternalId, name: string) => {
         if (name === 'externalType') {
            pToken.externalType = toSToken('SysTem');
            values.shift();
         }
      });
      const newExternalId = {
         ...externalId,
         externalType: toSToken('SysTem'),
      };

      assignExternalId(unData, 'externalType', externalId);

      expect(unProps.calls.argsFor(1)).toEqual([
         unData,
         newExternalId,
         'system',
         [
            { name: 'externalTypeSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ],
      ]);
   });

   it('passes the public descriptors to assignToProps() when externalType is PUBLIC', () => {
      unProps.and.callFake((values: UnassignedArray, pToken: ExternalId, name: string) => {
         if (name === 'externalType') {
            pToken.externalType = toSToken('puBlic');
            values.shift();
         }
      });
      const newExternalId = {
         ...externalId,
         externalType: toSToken('puBlic'),
      };

      assignExternalId(unData, 'externalType', externalId);

      expect(unProps.calls.argsFor(1)).toEqual([
         unData,
         newExternalId,
         'public',
         [
            { name: 'externalTypeSpace', type: 'space' },
            { name: 'public', type: 'literal' },
            { name: 'publicSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ],
      ]);
   });
});
