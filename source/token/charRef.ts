/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import { extractSurrogatePair } from 'basic';
import { SToken, STokenSource } from '../sToken';

const CHARREF_PTOKEN = 'CHARREF_PTOKEN';

type DeliverPToken = (pToken?: CharRefPToken) => void;

interface MutableCharRefPToken {
   open: SToken;
   openSpace?: SToken;
   hexMarker?: SToken;
   hexMarkerSpace?: SToken;
   digits?: SToken;
   digitsSpace?: SToken;
   close?: SToken;
   charCode?: number;
   char?: string;
}

class CharRefPToken {
   public readonly type: typeof CHARREF_PTOKEN = CHARREF_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly hexMarker?: SToken;

   public readonly hexMarkerSpace?: SToken;

   public readonly digits?: SToken;

   public readonly digitsSpace?: SToken;

   public readonly close?: SToken;

   public readonly charCode: number;

   public readonly char: string;

   constructor(basePToken: CharRefPToken | MutableCharRefPToken, extras?: MutableCharRefPToken) {
      this.type = CHARREF_PTOKEN;
      this.open = extras?.open || basePToken.open;
      this.openSpace = extras?.openSpace || basePToken.openSpace;
      this.hexMarker = extras?.hexMarker || basePToken.hexMarker;
      this.hexMarkerSpace = extras?.hexMarkerSpace || basePToken.hexMarkerSpace;
      this.digits = extras?.digits || basePToken.digits;
      this.digitsSpace = extras?.digitsSpace || basePToken.digitsSpace;
      this.close = extras?.close || basePToken.close;

      this.charCode = 0;
      this.char = '';

      if (this.digits) {
         this.charCode = this.hexMarker
            ? parseInt(this.digits.str, 16)
            : parseInt(this.digits.str, 10);

         if (this.charCode > 0xffff) {
            const [high, low] = extractSurrogatePair(this.charCode);
            this.char = String.fromCharCode(high) + String.fromCharCode(low);
         } else {
            this.char = String.fromCharCode(this.charCode);
         }
      }
   }
}

/**********************************************************************\
 parse() extracts the STokens for a character reference

 PARAM
   source: An STokenSource to read from
   openSToken: The opening '&#' SToken
   deliverPToken: Callback to deliver the PToken

 SYNTAX
   § 4.1.0
   [66]  CharRef ::= '&#' [0-9]+ ';' |
                     '&#x' [0-9a-fA-F]+ ';' [ WFC: Legal Character ]
    Lax: CharRef ::= '&#' S? [0-9]+ S? ';' |
                     '&#' S? [xX] S? [0-9a-fA-F]+ S? ';'
\**********************************************************************/

function parseCharRef(
   source: STokenSource,
   openSToken: SToken,
   deliverPToken: DeliverPToken,
): void {
   const pre: MutableCharRefPToken = { open: openSToken };

   source.extractToObjectNoParams('space', pre, 'openSpace');
   source.extract('multi', ['x', 'X'], (hexMarker) => {
      pre.hexMarker = hexMarker;

      source.extractToObjectNoParams('space', pre, 'hexMarkerSpace');
      source.extractToObject('digit', hexMarker ? 16 : 10, pre, 'digits');
      source.extractToObjectNoParams('space', pre, 'digitsSpace');

      source.extract('match', ';', (closeSToken) => {
         pre.close = closeSToken;

         deliverPToken(new CharRefPToken(pre));
      });
   });
}

export { CHARREF_PTOKEN, CharRefPToken, parseCharRef };
