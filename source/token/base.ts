/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

import { SToken } from '../sToken';

/**********************************************************************\
 The base namespace just contains the base token class used
 by all the token namespaces.
\**********************************************************************/

declare class STokenArray extends Array<SToken> {
   public pushSTokens(...STokens: Array<SToken|void>):void;
};

function pushIfNotVoid(this: STokenArray, ...items: Array<SToken|void>) {
   for (let index = 0; index < items.length; index++) {
      const item = items[index]
      if (item) {
         this.push(item);
      }
   }
}

class BaseParsedToken {
   [name: string]: any;
   public type: string;

   constructor(type: string, props?: { [name: string]: any }) {
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

      return results as STokenArray;
   }
}

const base =  {
   PToken: BaseParsedToken,
};

export default base;
export { STokenArray };