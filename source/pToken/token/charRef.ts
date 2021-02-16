/* Copyright ® 2018-2019 by 柏大衛. All rights reserved. */

import { extractSurrogatePair } from 'basic';
import { SToken, STokenSource } from 'sToken';

const CHARREF_PTOKEN = 'CHARREF_PTOKEN';

type DeliverPToken = (pToken?: CharRefPToken) => void;

interface RawCharRefProps {
   open?: SToken;
   openSpace?: SToken;
   hexMarker?: SToken;
   hexMarkerSpace?: SToken;
   digits?: SToken;
   digitsSpace?: SToken;
   close?: SToken;
   charCode?: number;
   char?: string;
}

interface CharRefProps extends RawCharRefProps {
   open: SToken;
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

   constructor(basePToken: CharRefPToken | CharRefProps, other: RawCharRefProps = {}) {
      this.open = other.open || basePToken.open;
      this.openSpace = 'openSpace' in other ? other.openSpace : basePToken.openSpace;
      this.hexMarker = 'hexMarker' in other ? other.hexMarker : basePToken.hexMarker;
      this.hexMarkerSpace =
         'hexMarkerSpace' in other ? other.hexMarkerSpace : basePToken.hexMarkerSpace;
      this.digits = 'digits' in other ? other.digits : basePToken.digits;
      this.digitsSpace = 'digitsSpace' in other ? other.digitsSpace : basePToken.digitsSpace;
      this.close = 'close' in other ? other.close : basePToken.close;

      this.charCode = 0;
      this.char = '';

      if (!this.digits) {
         return;
      }

      this.charCode = parseInt(this.digits.str, this.hexMarker ? 16 : 10);
      this.char = String.fromCharCode(this.charCode);

      if (this.charCode > 0xffff) {
         const [high, low] = extractSurrogatePair(this.charCode);

         this.char = String.fromCharCode(high) + String.fromCharCode(low);
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
   const pre: CharRefProps = { open: openSToken };

   source.extractToObject('space', pre, 'openSpace');
   source.extractToObject('multi', ['x', 'X'], pre, 'hexMarker');
   source.check(() => {
      source.extractToObject('space', pre, 'hexMarkerSpace');
      source.extractToObject('digit', pre.hexMarker ? 16 : 10, pre, 'digits');
      source.extractToObject('space', pre, 'digitsSpace');
      source.extractToObject('match', ';', pre, 'close');
      source.check(() => {
         deliverPToken(new CharRefPToken(pre));
      });
   });
}

export { CHARREF_PTOKEN, CharRefPToken, parseCharRef };
