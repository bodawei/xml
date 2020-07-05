/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import { ElementDeclarationPToken, NameListPToken, UnassignedArray, UnassignedType } from 'token';

import { assignNameList } from './assignNameList';
import { assignToProps } from './assignToProps';

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
   unassignedArray: UnassignedArray | undefined = [],
   edPToken: ElementDeclarationPToken,
): void {
   const unValues = unassignedArray.slice(0);
   const hasRef = unValues.find((item) => item.type === UnassignedType.REFERENCE);
   let nextPropName = edPToken.nextPropName;

   if (unValues.length === 0 || hasRef) {
      edPToken.extra = unValues;
      return;
   }

   if (nextPropName === 'name') {
      assignToProps(unValues, edPToken, nextPropName, NAME_ASSIGNMENTS);
      nextPropName = 'contentSpec';
   }

   if (nextPropName === 'contentSpec') {
      assignToProps(unValues, edPToken, 'postNameSpace', PRE_CONTENT_SPEC_ASSIGNMENT);
      const nextValue = unValues[0];

      if (
         nextValue &&
         nextValue.type === UnassignedType.WORD &&
         strOrBlank(nextValue.token.text) === '('
      ) {
         edPToken.children = edPToken.children || new NameListPToken();
         assignNameList(edPToken.children!, unValues);
      } else {
         assignToProps(unValues, edPToken, nextPropName, SIMPLE_CONTENT_SPEC_ASSIGNENTS);
      }
   } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      assignNameList(edPToken.children!, unValues);
   }

   // REFACTOR/CLEANUP: this should not be happening. Validity requires the expanded value in unassignedArray, which is wrong.
   (edPToken as any).peRefPlus = unassignedArray;

   edPToken.extra = unValues;
}

export { assignElementDeclaration };
