/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { strOrBlank, SToken } from 'sToken';
import { ExternalId, EXTERNAL_ID, UnassignedType, UnassignedArray } from 'token';

import { assignToProps } from './assignToProps';

type AssignResult = {
   preSpace?: SToken;
   externalId?: ExternalId;
   unassigned: UnassignedArray;
};

type WorkingExternalId = ExternalId & {
   preSpace?: SToken;
};

function assignExternalId(
   unassignedValues: UnassignedArray,
   nextPropName: string | undefined = 'externalType',
   externalId: ExternalId | undefined,
): AssignResult {
   const newExternalId: WorkingExternalId = { type: EXTERNAL_ID, ...externalId };
   const descriptors = [
      { name: 'externalType', type: 'word', allowed: /public|system/i },
      { name: 'externalTypeSpace', type: 'space' },
   ];

   // Do not continue processing if we have no values, or there are unexpanded references.
   if (unassignedValues.length === 0) {
      return { unassigned: unassignedValues };
   }

   for (const value of unassignedValues) {
      if (value.type === UnassignedType.REFERENCE) {
         return { unassigned: unassignedValues };
      }
   }

   if (nextPropName === 'externalType') {
      descriptors.unshift({ name: 'preSpace', type: 'space' });
   }

   assignToProps(unassignedValues, newExternalId, nextPropName, descriptors);

   const externalType = strOrBlank(newExternalId.externalType).toLocaleUpperCase();

   switch (externalType) {
      case 'SYSTEM':
         assignToProps(unassignedValues, newExternalId, 'system', [
            { name: 'externalTypeSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ]);
         break;
      case 'PUBLIC':
         assignToProps(unassignedValues, newExternalId, 'public', [
            { name: 'externalTypeSpace', type: 'space' },
            { name: 'public', type: 'literal' },
            { name: 'publicSpace', type: 'space' },
            { name: 'system', type: 'literal' },
         ]);
         break;
   }

   const result: AssignResult = {
      externalId: {
         type: EXTERNAL_ID,
         externalType: newExternalId.externalType,
         externalTypeSpace: newExternalId.externalTypeSpace,
         public: newExternalId.public,
         publicSpace: newExternalId.publicSpace,
         system: newExternalId.system,
      },
      unassigned: unassignedValues,
      preSpace: newExternalId.preSpace,
   };

   return result;
}

export { assignExternalId };
