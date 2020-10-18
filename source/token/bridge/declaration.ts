/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ParseValue, parseNotationDeclaration, NotationDeclarationPToken } from 'pToken';
import { strOrBlank, SToken, STokenSource } from 'sToken';
import {
   attListDeclaration,
   elementDeclaration,
   parseDocTypeEnd,
   parseDocTypeStart,
   parseEntityDeclaration,

   DocTypeEndPToken,
   DocTypeStartPToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
} from 'token';
import { DeclarationPToken } from './baseDeclaration';

type DeclarationStart = {
   open: SToken,
   openSpace?: SToken,
   declType?: SToken,
   declTypeSpace?: SToken,
};

type DeliverDeclaration = (declaration: DocTypeStartPToken|DeclarationPToken|Array<ParseValue>|GeneralEntityDeclarationPToken|ParameterEntityDeclarationPToken|NotationDeclarationPToken) => void;

/**********************************************************************\
 parseDeclaration() extracts an ATTLIST, ELEMENT, ENTITY, NOTATION or
 DOCTYPE declaration, given a '<!' token.

 PARAM
 source: A STokenSource to read from
 openSToken: the SToken for <!
 deliverPToken: Callback to deliver the PToken

 SYNTAX
   §2.6 & §2.8
      ????
   Lax
      ???
\**********************************************************************/

function parseDeclaration(source: STokenSource, openSToken: SToken, deliverPToken: DeliverDeclaration) {
   const start: DeclarationStart = { open: openSToken };
   start.open = openSToken;

   source.extractToObjectNoParams('space', start, 'openSpace');
   source.extractToObject('word', [ '>', '%' ], start, 'declType');

   source.extractNoParams('space', (sToken) => {
      start.declTypeSpace = sToken;

      switch (strOrBlank(start.declType).toUpperCase()) {
         case 'ENTITY':
            parseEntityDeclaration(source, start, deliverPToken as any); //typehack
            return;
         case 'NOTATION':
            parseNotationDeclaration(source, start, deliverPToken);
            return;
         case 'ATTLIST':
            attListDeclaration.parse(source, start, deliverPToken);
            return;
         // When you finish this, need to do checkWellFormed on unknown types
      }


      // Legacy support
      const newResult = new DeclarationPToken(undefined, {
         open: start.open,
         postOpenSpace: start.openSpace,
         declType: start.declType,
         postDeclTypeSpace: start.declTypeSpace,
      });

      if (!newResult.declType) {
         deliverPToken(newResult);
         return;
      }

      switch (newResult.declType.str.toLocaleUpperCase()) {
         case 'DOCTYPE':
            parseDocTypeStart(source, newResult, (docTypeStart: DocTypeStartPToken) => {
               if (docTypeStart.openSubset) {
                  deliverPToken(docTypeStart);
               } else {
                  parseDocTypeEnd(source, docTypeStart, (endToken: DocTypeEndPToken) => {
                     deliverPToken([ docTypeStart, endToken ]);
                  });
               }
            });
            break;
         case 'ELEMENT':
            elementDeclaration.parse(source, newResult, deliverPToken);
            break;
         default:
            deliverPToken(newResult);
            break;
      }
   });

}

export {
   DeclarationStart,

   parseDeclaration,
};