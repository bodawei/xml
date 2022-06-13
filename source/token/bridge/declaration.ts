/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import {
   ParseToken,
   parseAttListDeclaration,
   parseElementDeclaration,
   parseNotationDeclaration,
   parseEntityDeclaration,
   ElementDeclarationPToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
AttListDeclarationPToken, NotationDeclarationPToken } from 'pToken';
import { strOrBlank, SToken, STokenSource } from 'basic';
import {
   parseDocTypeEnd,
   parseDocTypeStart,

   DocTypeEndPToken,
   DocTypeStartPToken,
} from 'token';
import { DeclarationPToken, UNKNOWNDECL_PTOKEN } from './baseDeclaration';

type DeclarationStart = {
   open: SToken,
   openSpace?: SToken,
   declType?: SToken,
   declTypeSpace?: SToken,
};

type DeliverDeclaration = (declaration: DocTypeStartPToken|DeclarationPToken|Array<ParseToken>|GeneralEntityDeclarationPToken|ParameterEntityDeclarationPToken|NotationDeclarationPToken| AttListDeclarationPToken | ElementDeclarationPToken) => void;

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
            parseAttListDeclaration(source, start, deliverPToken);
            return;
         case 'ELEMENT':
            parseElementDeclaration(source, start, deliverPToken);
            return;
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
         default:
            deliverPToken(newResult);
            break;
      }
   });

}

export {
   UNKNOWNDECL_PTOKEN,
   DeclarationStart,
   parseDeclaration,
};