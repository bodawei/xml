/* Copyright ® 2018 by 柏大衛. All rights reserved. */

/**********************************************************************\
 Defines a simple "marker" token that tracks the end of the external
 subset.
\**********************************************************************/

const EXTERNAL_SUBSET_END_XTOKEN = 'EXTERNAL_SUBSET_END_XTOKEN';

class ExternalSubsetEndXToken {
   public readonly type: typeof EXTERNAL_SUBSET_END_XTOKEN = EXTERNAL_SUBSET_END_XTOKEN;
}

export {
   EXTERNAL_SUBSET_END_XTOKEN,
   ExternalSubsetEndXToken
};
