/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { AllExtractor } from './AllExtractor';
import { CharExtractor } from './CharExtractor';
export * from './defaultExtractors';
import { DigitExtractor } from './DigitExtractor';
import { Extractor, SegmentInfo } from './Extractor';
import { MatchExtractor } from './MatchExtractor';
import { MultiMatchExtractor } from './MultiMatchExtractor';
import { PeekExtractor } from './PeekExtractor';
import {
   DONE_SEGMENT,
   PSEUDO_SPACE,
   PSEUDO_SYSTEMID,
   SEGMENT_TYPE,
   PseudoSpace,
   Segment,
} from './Segment';
import { SpaceExtractor } from './SpaceExtractor';
import { WordExtractor } from './WordExtractor';

export {
   DONE_SEGMENT,
   PSEUDO_SPACE,
   PSEUDO_SYSTEMID,
   SEGMENT_TYPE,
   AllExtractor,
   CharExtractor,
   DigitExtractor,
   Extractor,
   MatchExtractor,
   MultiMatchExtractor,
   PeekExtractor,
   PseudoSpace,
   Segment,
   SpaceExtractor,
   WordExtractor,
   SegmentInfo,
};
