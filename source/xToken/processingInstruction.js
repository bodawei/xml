/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import {
   textOrBlank,
} from './common/util.js';
import * as xmlDeclaration from './xmlDeclaration.js';

/**********************************************************************\
 The processingInstruction namespace has the usual parsing etc
 routines for dealing with processing instructions.

 It is notable that the XML Declaration is a special case of a
 processing instruction, and is parsed here, but not validated etc.
\**********************************************************************/

const WFEID = WellFormedError.ID;
const PROCESSING_INSTRUCTION = 'PROCESSING_INSTRUCTION';

function parse(source, startLToken, deliverParsed) {
   const parsed = {
      type: PROCESSING_INSTRUCTION,
      open: startLToken,
   };

   source.extractToObject('space', parsed, 'postOpenSpace');
   source.extractToObject('word', [ '?>' ], parsed, 'target');

   source.extract('space', (lToken) => {
      parsed.postTargetSpace = lToken;

      if (parsed.target && parsed.target.text.toLocaleLowerCase() === 'xml') {
         xmlDeclaration.parse(source, parsed, deliverParsed);
      } else {
         source.extractToObject('all', [ '?>' ], parsed, 'instruction');
         source.extract('match', '?>', (lToken) => {
            parsed.close = lToken;
            deliverParsed(parsed);
         });
      }
   });
}

function checkWellFormed(parsed, ec) {
   ec.setPos(parsed.open);
   ec.setPos(parsed.postOpenSpace);
   ec.check(parsed.postOpenSpace, WFEID.PI_SPACE_BEFORE_TARGET, [ textOrBlank(parsed.target) ]);
}

export {
   PROCESSING_INSTRUCTION as TYPE,
   parse,
   checkWellFormed,
};
