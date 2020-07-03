/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from 'token';
import { UnassignedArray, UnassignedType } from '../../token/common/unassigned';
import unassigned from '../../token/common/unassigned';
import nameList, { NameListPToken } from 'source/token/contentspec/nameList';
import { strOrBlank } from 'sToken';

const NAME_ASSIGNMENTS = [
   { name: 'postDeclTypeSpace', type: 'space' },
   { name: 'name', type: 'word' },
   { name: 'postNameSpace', type: 'space' },
];
const PRE_CONTENT_SPEC_ASSIGNMENT = [{ name: 'postNameSpace', type: 'space' }];
const SIMPLE_CONTENT_SPEC_ASSIGNENTS = [
   { name: 'contentSpec', type: 'word' },
   { name: 'postContentSpecSpace', type: 'space' },
];

function assignElementDeclaration(
   unassigedArray: UnassignedArray | undefined,
   edPToken: ElementDeclarationPToken,
): void {
   const unValues = unassigedArray?.slice(0);
   const hasRef = unValues && unValues.find((item) => item.type === UnassignedType.REFERENCE);
   let nextPropName = edPToken.nextPropName;

   if (!unValues || unValues.length === 0 || hasRef) {
      return;
   }

   if (nextPropName === 'name') {
      unassigned.assignToProps(unValues, edPToken, nextPropName, NAME_ASSIGNMENTS);
      nextPropName = 'contentSpec';
   }

   if (nextPropName === 'contentSpec') {
      unassigned.assignToProps(unValues, edPToken, 'postNameSpace', PRE_CONTENT_SPEC_ASSIGNMENT);
      const nextValue = unValues[0];

      if (
         nextValue &&
         nextValue.type === UnassignedType.WORD &&
         strOrBlank(nextValue.token.text) === '('
      ) {
         edPToken.children = edPToken.children || new NameListPToken();
         nameList.assignUnassigned(edPToken.children, unValues);
      } else {
         unassigned.assignToProps(unValues, edPToken, nextPropName, SIMPLE_CONTENT_SPEC_ASSIGNENTS);
      }
   } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nameList.assignUnassigned(edPToken.children!, unValues);
   }

   // REFACTOR/CLEANUP: this should not be happening. Validity requires the expanded value in unassignedArray, which is wrong.
   (edPToken as any).peRefPlus = unassigedArray;

   if (unValues.length !== 0) {
      edPToken.extra = unValues;
   }
}

export { assignElementDeclaration };
