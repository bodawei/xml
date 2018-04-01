/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { SToken } from '../stoken';

/**********************************************************************\
 The base namespace just contains the base token class used
 by all the token namespaces.
\**********************************************************************/

interface STokenArray {
   [index:number]: SToken,
   pushSTokens(...STokens):void;
};

function pushIfNotVoid(...items) {
   for (let index = 0; index < items.length; index++) {
      if (items[index] !== undefined && items[index] !== null) {
         this.push(items[index]);
      }
   }
}

class BaseXToken {
   public pToken?: BaseParsedToken;

   constructor(pToken: BaseParsedToken) {
      if (!pToken) {
         throw new Error('Must provide a PToken to the XToken you are constructing.');
      }

      this.pToken = pToken;
   }

}

class BaseParsedToken {
   public type: string;

   constructor(type: string, props?: Object) {
      if (props) {
         for (const propName in props) {
            if (props.hasOwnProperty(propName)) {
               this[propName] = props[propName];
            }
         }
      }

      this.type = type;
   }

   getSTokenArray(): STokenArray {
      const results: any = [];
      results.pushSTokens = pushIfNotVoid.bind(results);
      Object.defineProperty(results, 'pushSTokens', {
         enumerable: false,
      });

      return <STokenArray> results;
   }
}

const base =  {
   XToken: BaseXToken,
   PToken: BaseParsedToken,
};

export default base;
export { STokenArray };