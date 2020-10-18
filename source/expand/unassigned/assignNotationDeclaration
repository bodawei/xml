/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { NotationDeclarationPToken, UnassignedArray, UnassignedType } from 'token';

import { assignToProps } from './assignToProps';
import { assignExternalId } from './assignExternalId';

const NAME_ASSIGNMENTS = [
   { name: 'declTypeSpace', type: 'space' },
   { name: 'name', type: 'word' },
   { name: 'nameSpace', type: 'space' },
];

function assignNotationDeclaration(
   unassigedArray: UnassignedArray | undefined = [],
   notationPToken: NotationDeclarationPToken,
): void {
   const unValues = unassigedArray.slice(0);
   const hasRef = unValues.find((item) => item.type === UnassignedType.REFERENCE);
   let nextPropName = notationPToken.nextPropName;

   if (unValues.length === 0 || hasRef) {
      notationPToken.extra = unValues;
      return;
   }

   if (nextPropName === 'name') {
      assignToProps(unValues, notationPToken, nextPropName, NAME_ASSIGNMENTS);
      nextPropName = undefined;
   }

   const results = assignExternalId(unValues, nextPropName, notationPToken.externalId);

   if (results.preSpace) {
      if (notationPToken.nameSpace) {
         notationPToken.nameSpace.merge(results.preSpace);
      } else {
         (notationPToken as any).nameSpace = results.preSpace;
      }
   }

   if (results.externalId) {
      (notationPToken as any).externalId = results.externalId;
   }

   notationPToken.extra = unValues;
}

export { assignNotationDeclaration };
