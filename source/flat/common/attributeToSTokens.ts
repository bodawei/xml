/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { SToken } from 'basic';
import { AttributesPToken } from 'token';
import { STokenArrayBuilder } from '../util/STokenArrayBuilder';

import { literalToSTokens } from './literalToSTokens';

function attributeToSTokens(attributes: AttributesPToken = []): Array<SToken> {
   const builder = new STokenArrayBuilder();

   for (let index = 0; index < attributes.length; index++) {
      const attr = attributes[index];

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
