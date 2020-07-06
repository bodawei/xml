/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */
import {
   ParameterEntityDeclarationPToken,
   GeneralEntityDeclarationPToken,
   UnassignedValue,
   UnassignedType,
   UnassignedArray,
} from 'token';

import { assignExternalId } from './assignExternalId';
import { assignToProps } from './assignToProps';

function assignEntityDeclaration(
   unassignedArray: UnassignedArray | undefined = [],
   pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
): void {
   let unValues = unassignedArray.slice(0);
   const hasRef = unValues.find((item) => item.type === UnassignedType.REFERENCE);
   const nextPropName = pToken.nextPropName;

   if (unValues.length === 0 || hasRef) {
      (pToken as any).extra = unValues;
      return;
   }

   const prolog = [
      { name: 'declTypeSpace', type: 'space' },
      { name: 'parameter', type: 'word', allowed: /%/ },
      { name: 'parameterSpace', type: 'space' },
      { name: 'name', type: 'word' },
      { name: 'nameSpace', type: 'space' },
   ];
   const epilog = [
      { name: 'externalIdSpace', type: 'space' },
      { name: 'nData', type: 'word' },
      { name: 'nDataSpace', type: 'space' },
      { name: 'nDataName', type: 'word' },
      { name: 'nDataNameSpace', type: 'space' },
   ];

   // Help guide where to fill in the unassigned values
   const inProlog = prolog.filter((item) => item.name === nextPropName).length > 0;
   const inExternalId = !!pToken.externalId;
   const isEntityValueOrExternalId = nextPropName === 'entityValueOrId';
   const inEpilog = epilog.filter((item) => item.name === nextPropName);
   let doEpilog = inEpilog.length > 0;

   if (inExternalId) {
      const results = assignExternalId(unValues, nextPropName, pToken.externalId);
      if (results.preSpace) {
         if (pToken.nameSpace) {
            pToken.nameSpace.merge(results.preSpace);
         } else {
            (pToken as any).nameSpace = results.preSpace;
         }
      }

      if (results.externalId) {
         (pToken as any).externalId = results.externalId;
      }

      unValues = results.unassigned;

      doEpilog = true;
   } else {
      if (inProlog) {
         assignToProps(unValues, pToken, nextPropName, prolog); // typeHack
      }

      if ((inProlog || isEntityValueOrExternalId) && unValues[0]) {
         // typeHack
         const nextNonSpaceThing = unValues.find((value: UnassignedValue) => {
            // typeHack
            if (
               value.type === 'space' ||
               value.type === 'entityStart' ||
               value.type === UnassignedType.ENTITY_END
            ) {
               return;
            }

            return value;
         });

         if (nextNonSpaceThing!.type === 'literal') {
            assignToProps(unValues, pToken, 'EntityValue', [
               // typeHack
               { name: 'nameSpace', type: 'space' },
               { name: 'EntityValue', type: 'literal', flatten: true },
               { name: 'entityValueSpace', type: 'space' },
            ]);
         } else {
            const results = assignExternalId(unValues, undefined, pToken.externalId);
            if (results.preSpace) {
               if (pToken.nameSpace) {
                  pToken.nameSpace.merge(results.preSpace);
               } else {
                  (pToken as any).nameSpace = results.preSpace;
               }
            }

            if (results.externalId) {
               (pToken as any).externalId = results.externalId;
            }

            unValues = results.unassigned;

            doEpilog = true;
         }
      }
   }

   if (doEpilog) {
      assignToProps(unValues, pToken, 'externalIdSpace', epilog); // typeHack
   }

   (pToken as any).extra = unValues;
}

export { assignEntityDeclaration };
