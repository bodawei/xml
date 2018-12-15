/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityMetaData, Token } from 'basic';
import { strOrBlank, SToken, STokenSource } from 'sToken';
import {
   docTypeStart,
   docTypeEnd,
   attListDeclaration,
   elementDeclaration,
   parseEntityDeclaration,
   notationDeclaration,

   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
} from 'token';
import { DocTypeEndPToken } from '../docTypeEnd';
import { DocTypeStartPToken } from '../docTypeStart';
import { DeclarationPToken } from './baseDeclaration';

type DeclarationStart = {
   open: SToken,
   openSpace?: SToken,
   declType?: SToken,
   declTypeSpace?: SToken,
};

type DeliverDeclaration = (declaration: DeclarationPToken|Array<Token>|GeneralEntityDeclarationPToken|ParameterEntityDeclarationPToken) => void;

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

function parseDeclaration(source: STokenSource, openSToken: SToken, emd: EntityMetaData, deliverPToken: DeliverDeclaration) {
   const start: DeclarationStart = { open: openSToken };
   start.open = openSToken;

   source.extractToObjectNoParams('space', start, 'openSpace');
   source.extractToObject('word', [ '>' ], start, 'declType');

   source.extractNoParams('space', (sToken) => {
      start.declTypeSpace = sToken;

      switch (strOrBlank(start.declType).toUpperCase()) {
         case 'ENTITY':
            parseEntityDeclaration(source, start, deliverPToken);
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
            docTypeStart.parse(source, newResult, (docTypeStart: DocTypeStartPToken) => {
               if (docTypeStart.startInternalSubset) {
                  deliverPToken(docTypeStart);
               } else {
                  docTypeEnd.parse(source, (endToken: DocTypeEndPToken) => {
                     deliverPToken([ docTypeStart, endToken ]);
                  });
               }
            });
            break;
         case 'ATTLIST':
            attListDeclaration.parse(source, newResult, deliverPToken);
            break;
         case 'ELEMENT':
            elementDeclaration.parse(source, newResult, deliverPToken);
            break;
         case 'NOTATION':
            notationDeclaration.parse(source, newResult, deliverPToken);
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