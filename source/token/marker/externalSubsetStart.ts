/* Copyright ® 2018 by 柏大衛. All rights reserved. */

/**********************************************************************\
 Defines a simple "marker" token that tracks the start of the external
 subset.
\**********************************************************************/

const EXTERNAL_SUBSET_START_TOKEN = 'EXTERNAL_SUBSET_START_TOKEN';

class ExternalSubsetStartToken {
   public readonly type: typeof EXTERNAL_SUBSET_START_TOKEN = EXTERNAL_SUBSET_START_TOKEN;
}

export {
   EXTERNAL_SUBSET_START_TOKEN,
   ExternalSubsetStartToken
};
