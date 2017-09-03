/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

class XmlToken {

   constructor(lTokens) {
      if (!lTokens) {
         throw new Error('Must provide a lTokens value to the token you are constructing.');
      }

      this.lTokens = lTokens;
   }

}

export {
   XmlToken as Token
};
