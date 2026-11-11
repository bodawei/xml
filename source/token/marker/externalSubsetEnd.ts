/* Copyright ® 2018 by 柏大衛. All rights reserved. */

/**********************************************************************\
 Defines a simple "marker" token that tracks the end of the external
 subset.
\**********************************************************************/

const EXTERNAL_SUBSET_END_TOKEN = 'EXTERNAL_SUBSET_END_TOKEN';

class ExternalSubsetEndToken {
   public readonly type: typeof EXTERNAL_SUBSET_END_TOKEN = EXTERNAL_SUBSET_END_TOKEN;
}

export { EXTERNAL_SUBSET_END_TOKEN, ExternalSubsetEndToken };
