/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/**********************************************************************\
 The base namespace just contains the base token class used
 by all the token namespaces.
\**********************************************************************/

class BaseXToken {

   constructor(pToken) {
      if (!pToken) {
         throw new Error('Must provide a PToken to the XToken you are constructing.');
      }

      this.pToken = pToken;
   }

}

class BaseParsedToken {

   constructor(type, props) {
      if (props) {
         for (const propName in props) {
            if (props.hasOwnProperty(propName)) {
               this[propName] = props[propName];
            }
         }
      }

      this.type = type;
   }

   _makeSTokenArray() {
      const results = [];
      results.pushSTokens = this._pushIfNotVoid.bind(results);
      Object.defineProperty(results, 'pushSTokens', {
         enumerable: false,
      });
      return results;
   }

   _pushIfNotVoid(...items) {
      for (let index = 0; index < items.length; index++) {
         if (items[index] !== undefined && items[index] !== null) {
            this.push(items[index]);
         }
      }
   }

   getSTokenArray() {
      return this._makeSTokenArray();
   }
}

export {
   BaseXToken as XToken,
   BaseParsedToken as PToken,
};
