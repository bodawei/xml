/* Copyright ® 2016-2018 by 柏大衛. All rights reserved. */

/**********************************************************************\
 The base namespace just contains the base token class used
 by all the token namespaces.
\**********************************************************************/

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
}

const base = {
   PToken: BaseParsedToken,
};

export default base;
