/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

/**********************************************************************\
 The xmlToken namespace just contains the base token class used
 by all the token namespaces.
\**********************************************************************/

class XmlToken {

   constructor(lTokens) {
      if (!lTokens) {
         throw new Error('Must provide LTokens to the token you are constructing.');
      }

      this.lTokens = lTokens;
   }

}

export {
   XmlToken as Token,
};
