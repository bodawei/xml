/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { doAsyncLoop } from 'basic';
import { AttributeValuePToken } from 'token';

import { expandAttributeValue, AttrExpanded, ExpandAttrResult } from './expandAttributeValue';
import { ExpandParams } from '../types';

type AttrValueObj = { value: AttributeValuePToken };

/*
 * Given either a set of attributes, or a set of attribute definition, extract
 * each of the values and expand any general entity references in them.
 * deliver any errors into the output stream, and return the modified values
 * back to the caller.
 */
function expandAttributes(
   valueObjects: Array<AttrValueObj>,
   expandParams: ExpandParams,
   expanded: (results: Array<ExpandAttrResult>) => void,
): void {
   const attributeValues: Array<AttributeValuePToken> = [];

   for (const valueObj of valueObjects) {
      attributeValues.push(valueObj.value);
   }

   function process(attributeValue: AttributeValuePToken, callback: AttrExpanded): void {
      expandAttributeValue(attributeValue, expandParams, callback);
   }

   doAsyncLoop(attributeValues, process, expanded);
}

export { expandAttributes };
