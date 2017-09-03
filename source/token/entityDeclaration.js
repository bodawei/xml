/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

//import { WellFormedError } from '../error';
//
import xmlToken from './xmlToken.js';
import externalId from './externalId.js';
import quotedValue from './quotedValue.js';

const ENTITY_DECL = 'ENTITY_DECL';

class EntityDeclaration extends xmlToken.Token {

   constructor(name, value, externalLoc, notationDataName, chunks) {
      super(chunks);

      this.name = name;
      this.value = value;
      this.externalLoc = externalLoc;
      this.notationDataName = notationDataName;
   }

}

/**********************************************************************\
 parse() extracts the pieces of a documenttypedecl up to the start of
 an internal subset start.

 This assumes that the "<!DOCTYPE S" has already been parsed, and those
 chunks are passed in through declarationStart.

 PARAM
 source: A ChunkSource to read from
 declarationStart: A hash with the chunks from parsing "<!DOCTYPE S"
 deliverParsed: Callback to deliver the parsed chunks

 SYNTAX
   [70] EntityDecl  ::= GEDecl | PEDecl
   [71] GEDecl      ::= '<!ENTITY' S Name S EntityDef S? '>'
   [72] PEDecl      ::= '<!ENTITY' S '%' S Name S PEDef S? '>'
   [73] EntityDef   ::= EntityValue | (ExternalID NDataDecl?)
   [74] PEDef       ::= EntityValue | ExternalID
   [76] NDataDecl   ::= S 'NDATA' S Name
    [9] EntityValue ::= '"' ([^%&"] | PEReference | Reference)* '"' |
                        "'" ([^%&'] | PEReference | Reference)* "'"
\**********************************************************************/

function parse(source, declarationStart, deliverParsed) {
   const parsed = {
      type: ENTITY_DECL,
      openChunk: declarationStart.openChunk,
      postOpenSpaceChunk: declarationStart.postOpenSpaceChunk,
      declTypeChunk: declarationStart.declTypeChunk,
      postDeclTypeSpaceChunk: declarationStart.postDeclTypeSpaceChunk,
   };

   source.extract('peekChar', (chunk) => {
      if (!chunk) {
         deliverParsed(parsed);
         return;
      }

      if (chunk.text === '%') {
         source.extractToObject('char', parsed, 'parameterChunk');
         source.extractToObject('space', parsed, 'postParameterSpaceChunk');
      }

      source.extractToObject('word', [ '>', '"', '\'' ], parsed, 'nameChunk');
      source.extractToObject('space', parsed, 'postNameSpaceChunk');

      source.extract('peekChar', (chunk) => {
         if (!chunk) {
            deliverParsed(parsed);
            return;
         }

         if (chunk.text === '"' || chunk.text === '\'') {
            quotedValue.parse(source, { params: true }, (result) => {
               parsed.entityValue = result;
               parseClose(source, parsed, 'postEntityValueSpaceChunk', deliverParsed);
            });
         } else {
            externalId.parse(source, [ '>' ], (externalId) => {
               parsed.externalId = externalId;
               if (!externalId) {
                  parseClose(source, parsed, undefined, deliverParsed);
                  return;
               }

               source.extractToObject('space', parsed, 'postExternalIdSpaceChunk');
               source.extract('peekWord', [ '>' ], (chunk) => {
                  if (chunk && chunk.text.toLocaleUpperCase() === 'NDATA') {
                     source.extractToObject('word', [ '>' ], parsed, 'nDataChunk');
                     source.extractToObject('space', parsed, 'postNDataSpaceChunk');
                     source.extractToObject('word', [ '>' ], parsed, 'nDataNameChunk');
                     parseClose(source, parsed, 'postNDataNameSpaceChunk', deliverParsed);
                  } else {
                     parseClose(source, parsed, undefined, deliverParsed);
                  }
               });
            });
         }
      });
   });
}

function parseClose(source, parsed, propName, deliverParsed) {
   if (propName) {
      source.extractToObject('space', parsed, propName);
   }
   source.extract('match', '>', (chunk) => {
      parsed.closeChunk = chunk;
      deliverParsed(parsed);
   });
}

// function checkWellFormed(parsed, ec, isDocEntity, version, revision) {
// }

// function makeToken(parsed) {
// }

module.exports = {
   TYPE: ENTITY_DECL,
   Token: EntityDeclaration,
   parse,
   // checkWellFormed,
   // makeToken,
};
