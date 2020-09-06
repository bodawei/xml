/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import AllExtractor from './AllExtractor';
import CharExtractor from './CharExtractor';
import DigitExtractor from './DigitExtractor';
import MatchExtractor from './MatchExtractor';
import MultiMatchExtractor from './MultiMatchExtractor';
import PeekExtractor from './PeekExtractor';
import SpaceExtractor from './SpaceExtractor';
import WordExtractor from './WordExtractor';
import { Extractor } from '../extractor';
import PeekDecl from './PeekDecl';

type ExtractorParams = Array<any>|any;
type ExtractorConstructor = { new (...args: any[]): Extractor } ;

type ExtractorDefinition = ExtractorConstructor | {
   extractorConstructor: ExtractorConstructor;
   params: ExtractorParams | {
      extractorConstructor: ExtractorConstructor,
   };
};

type ExtractorMap = {
   [extractorName: string]: ExtractorDefinition;
};

const defaultExtractors: ExtractorMap = {
   all: AllExtractor,
   char: CharExtractor,
   digit: DigitExtractor,
   match: MatchExtractor,
   multi: MultiMatchExtractor,
   space: SpaceExtractor,
   word: WordExtractor,
   markup: {
      extractorConstructor: MultiMatchExtractor,
      params: [ '<!--', '<?', '<!', '</', '<', '<![', '&', '&#' ],
   },
   close: {
      extractorConstructor: MultiMatchExtractor,
      params: [ ']]>', ']' ],
   },
   peekChar: {
      extractorConstructor: PeekExtractor,
      params: {
         extractorConstructor: CharExtractor,
      },
   },
   peekDecl: PeekDecl,
   peekSpace: {
      extractorConstructor: PeekExtractor,
      params: {
         extractorConstructor: SpaceExtractor,
      },
   },
   peekWord: {
      extractorConstructor: PeekExtractor,
      params: {
         extractorConstructor: WordExtractor,
      },
   },
};

export {
   ExtractorConstructor,
   ExtractorMap,
   defaultExtractors,
}
