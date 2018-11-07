/* Copyright ® 2018 by 柏大衛. All rights reserved. */

/**********************************************************************\
 Defines a simple "marker" token that tracks the start of the external
 subset.
\**********************************************************************/

const EXTERNAL_SUBSET_START_XTOKEN = 'EXTERNAL_SUBSET_START_XTOKEN';

class ExternalSubsetStartXToken {
   public readonly type: typeof EXTERNAL_SUBSET_START_XTOKEN = EXTERNAL_SUBSET_START_XTOKEN;
}

export {
   EXTERNAL_SUBSET_START_XTOKEN,
   ExternalSubsetStartXToken
};
