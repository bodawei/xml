/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';
import {
   CHARREF_PTOKEN,
   ExternalIdP,
   NOTATION_DECLARATION_PTOKEN,
   ParseToken,
   PROCESSING_INSTRUCTION_PTOKEN,
   pTokenArrayToString,
   TEXT_PTOKEN,
   XMLDECL_PTOKEN,
} from 'pToken';
import { strOrBlank } from 'basic';
import {
   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   DocTypeStartPToken,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELEMENT_START_PTOKEN,
   SPACE_PTOKEN,
   AttributePToken,
} from 'token';

function formatExternalId(externalId?: ExternalIdP): string {
   if (!externalId) {
      return '';
   }

   const publicId = pTokenArrayToString(externalId.public?.value);
   const systemId = pTokenArrayToString(externalId.system?.value);

   if (publicId) {
      return `PUBLIC '${publicId}'${systemId ? ` '${systemId}'` : ''}`;
   } else {
      return `SYSTEM '${systemId}'`;
   }
}

// We should find out what the actual rules are for canonical XML rather than cherry picking each control character for xmlconf purposes
function formatText(text: string): string {
   // console.log('>>', text, text.replace(/\u008c/g, '&#140;'), text.charCodeAt(0));
   return (
      text
         .replace(/&/g, '&amp;')
         .replace(/"/g, '&quot;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/\t/g, '&#9;')
         .replace(/\n/g, '&#10;')
         .replace(/\u000c/g, '&#12;') // eslint-disable-line no-control-regex
         // Puzzling. Some tests \u0085 literally in their output, some have the text &#133;.  I don't detect a pattern for which is which. See differences in rmt-037, rmt-044 and rmt-045 mentioned in fixTest
         .replace(/\u0085/g, '&#133;') // this is maybe only true for v1.1 eslint-disable-line no-control-regex
         .replace(/\u008c/g, '&#140;') // eslint-disable-line no-control-regex
         .replace(/\r/g, '&#13;')
   );
}

function formatAttrs(attrs?: ReadonlyArray<AttributePToken>): string {
   if (!attrs) {
      return '';
   }

   const sortedAttrs = [...attrs].sort((left, right) => {
      const a = strOrBlank(left.name);
      const b = strOrBlank(right.name);
      return a === b ? 0 : a > b ? 1 : -1;
   });

   const attrStrings = sortedAttrs.map((attr) => {
      const value = attr.value.map((element) => {
         if (element.type === TEXT_PTOKEN) {
            return formatText(strOrBlank(element.text));
         } else if (element.type === CHARREF_PTOKEN) {
            return formatText(element.char);
         }

         return '';
      });
      return `${strOrBlank(attr.name)}="${value.join('')}"`;
   });

   const attributesAsString = attrStrings.join(' ');

   if (attributesAsString.length > 0) {
      return ` ${attributesAsString}`;
   }

   return '';
}

/*
 * In theory, this takes a stream of PTokens and produces a stream of strings that
 * Collectively represent the Canonical XML version of the data.
 *
 * In practice, this only does enough of the canonicalization needed to make the xmlconf
 * processing to pass.
 * See: https://www.w3.org/TR/xml-c14n11/
 */
class PTokenToXmlStream extends Transform {
   private doctypeStart?: DocTypeStartPToken;

   private notations: Record<string, string> = {};

   private inElement = false;

   private elementStack: Array<string> = [];

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(xToken: ParseToken, _: string, done: () => void): void {
      switch (xToken.type) {
         case XMLDECL_PTOKEN:
            let version = '1.0';

            for (const param of xToken.fields) {
               if (strOrBlank(param.name) === 'version') {
                  version = strOrBlank(param.value);
               }
            }

            if (version === '1.1') {
               this.push('<?xml version="1.1"?>');
            }
            break;
         case SPACE_PTOKEN:
            if (this.inElement) {
               this.push(formatText(strOrBlank(xToken.text)));
            }
            break;
         case DOCTYPE_START_PTOKEN:
            this.doctypeStart = xToken;
            break;
         case NOTATION_DECLARATION_PTOKEN:
            this.notations[strOrBlank(xToken.name)] = `<!NOTATION ${strOrBlank(
               xToken.name,
            )} ${formatExternalId(xToken.externalId)}>\n`;
            break;
         case DOCTYPE_END_PTOKEN:
            const keys = Object.keys(this.notations).sort();

            if (keys.length > 0) {
               this.push(`<!DOCTYPE ${strOrBlank(this.doctypeStart?.name) || ''} [\n`);
               keys.forEach((key) => {
                  this.push(this.notations[key]);
               });
               this.push(']>\n');
            }
            break;
         case PROCESSING_INSTRUCTION_PTOKEN:
            this.push(`<?${strOrBlank(xToken.target)} ${strOrBlank(xToken.instruction)}?>`);
            break;
         case ELEMENT_EMPTY_PTOKEN:
            this.push(
               `<${strOrBlank(xToken.name)}${formatAttrs(xToken.attributes)}></${strOrBlank(
                  xToken.name,
               )}>`,
            );
            break;
         case ELEMENT_START_PTOKEN:
            this.push(`<${strOrBlank(xToken.name)}${formatAttrs(xToken.attributes)}>`);
            this.inElement = true;
            this.elementStack.push(strOrBlank(xToken.name));
            break;
         case ELEMENT_END_PTOKEN:
            this.push(`</${strOrBlank(xToken.name)}>`);
            this.elementStack.pop();

            if (this.elementStack.length === 0) {
               this.inElement = false;
            }
            break;
         case CHARREF_PTOKEN:
            this.push(formatText(xToken.char));
            break;
         case CDATA_PTOKEN:
         case CHARDATA_PTOKEN:
            this.push(formatText(strOrBlank(xToken.text)));
            break;
         default:
            break;
      }

      done();
   }
}

export { PTokenToXmlStream };
