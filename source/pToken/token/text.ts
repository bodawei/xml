/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'sToken';

const TEXT_PTOKEN = 'TEXT_PTOKEN';

interface RawTextProps {
   text?: SToken;
}

interface TextProps {
   text: SToken;
}

class TextPToken {
   public readonly type: typeof TEXT_PTOKEN = TEXT_PTOKEN;

   public readonly text: SToken;

   constructor(base: TextPToken | TextProps | SToken, other: RawTextProps = {}) {
      const newText = 'str' in base ? base : base.text;

      this.text = other.text ? other.text : newText;
   }
}

/**********************************************************************\
 parse() extracts a series of char data.

 PARAM
 source: A STokenSource to read from
 terminators: An array of characters that should be used to terminate
   the text.
 deliverPToken: Callback to deliver the PToken
\**********************************************************************/

function parseText(
   source: STokenSource,
   terminators: Array<string>,
   deliverPToken: (token: TextPToken | undefined) => void,
): void {
   source.extract('all', terminators, (sToken) => {
      deliverPToken(sToken ? new TextPToken({ text: sToken }) : undefined);
   });
}

function isTextPToken(item: unknown): item is TextPToken {
   if (!item) {
      return false;
   }

   const obj = typeof item === 'object' ? (item as { type: string }) : undefined;

   return !!obj && obj.type === TEXT_PTOKEN;
}

export { TEXT_PTOKEN, TextPToken, isTextPToken, parseText };
