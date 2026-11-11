/* Copyright ® 2016-2026 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { AttributesPToken } from 'token';

import { STokenArrayBuilder } from '../util/STokenArrayBuilder';
import { literalToSTokens } from './literalToSTokens';

function attributeToSTokens(attributes: AttributesPToken = []): Array<SToken> {
   const builder = new STokenArrayBuilder();

   for (const attr of attributes) {
      builder.add(
         attr.name,
         attr.postNameSpace,
         attr.equal,
         attr.postEqualSpace,
         literalToSTokens(attr),
         attr.trailingSpace,
      );
   }

   return builder.sTokenArray;
}

export { attributeToSTokens };
