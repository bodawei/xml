/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Transform } from 'stream';
import {
   XToken,
   CHARREF_XTOKEN,
   NOTATION_DECLARATION_XTOKEN,
   PROCESSING_INSTRUCTION_XTOKEN,
   TEXT_XTOKEN,
   XMLDECL_XTOKEN,
   ExternalIdX,
} from 'xToken';
import {
   SPACE_XTOKEN,
   DOCTYPE_START_XTOKEN,
   DOCTYPE_END_XTOKEN,
   ELEMENT_EMPTY_XTOKEN,
   ELEMENT_START_XTOKEN,
   ELEMENT_END_XTOKEN,
   CDATA_XTOKEN,
   CHARDATA_XTOKEN,
   DocTypeStartXToken,
} from 'token';
import { AttributeXToken } from '../../../token/common/attribute';

function formatExternalId(externalId?: ExternalIdX): string {
   if (!externalId) {
      return '';
   }

   if (externalId.publicId) {
      return `PUBLIC '${externalId.publicId}'${
         externalId.systemId ? ` '${externalId.systemId}'` : ''
      }`;
   } else {
      return `SYSTEM '${externalId.systemId}'`;
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
         // See differences in rmt-044 and rmt-045 mentioned in fixTest
         .replace(/\u008c/g, '&#140;') // eslint-disable-line no-control-regex
         .replace(/\r/g, '&#13;')
   );
}

function formatAttrs(attrs?: ReadonlyArray<AttributeXToken>): string {
   if (!attrs) {
      return '';
   }

   const sortedAttrs = [...attrs].sort((left, right) => {
      const a = left.name;
      const b = right.name;
      return a === b ? 0 : a > b ? 1 : -1;
   });

   const attrStrings = sortedAttrs.map((attr) => {
      const value = attr.value.map((element) => {
         if (element.type === TEXT_XTOKEN) {
            return formatText(element.text);
         } else if (element.type === CHARREF_XTOKEN) {
            return formatText(element.char);
         }

         return '';
      });
      return `${attr.name}="${value.join('')}"`;
   });

   const attributesAsString = attrStrings.join(' ');

   if (attributesAsString.length > 0) {
      return ` ${attributesAsString}`;
   }

   return '';
}

/*
 * In theory, this takes a stream of XTokens and produces a stream of strings that
 * Collectively represent the Canonical XML version of the data.
 *
 * In practice, this only does enough of the canonicalization needed to make the xmlconf
 * processing to pass.
 * See: https://www.w3.org/TR/xml-c14n11/
 */
class XTokenToXmlStream extends Transform {
   private doctypeStart?: DocTypeStartXToken;

   private notations: { [name: string]: string } = {};

   private inElement = false;

   private elementStack: Array<string> = [];

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(xToken: XToken, _: string, done: () => void): void {
      switch (xToken.type) {
         case XMLDECL_XTOKEN:
            if (xToken.version === 1.1) {
               this.push('<?xml version="1.1"?>');
            }
            break;
         case SPACE_XTOKEN:
            if (this.inElement) {
               this.push(formatText(xToken.text));
            }
            break;
         case DOCTYPE_START_XTOKEN:
            this.doctypeStart = xToken;
            break;
         case NOTATION_DECLARATION_XTOKEN:
            this.notations[xToken.name] = `<!NOTATION ${xToken.name} ${formatExternalId(
               xToken.externalId,
            )}>\n`;
            break;
         case DOCTYPE_END_XTOKEN:
            const keys = Object.keys(this.notations).sort();

            if (keys.length > 0) {
               this.push(`<!DOCTYPE ${this.doctypeStart?.name || ''} [\n`);
               keys.forEach((key) => {
                  this.push(this.notations[key]);
               });
               this.push(']>\n');
            }
            break;
         case PROCESSING_INSTRUCTION_XTOKEN:
            this.push(`<?${xToken.target} ${xToken.instruction}?>`);
            break;
         case ELEMENT_EMPTY_XTOKEN:
            this.push(`<${xToken.name}${formatAttrs(xToken.attributes)}></${xToken.name}>`);
            break;
         case ELEMENT_START_XTOKEN:
            this.push(`<${xToken.name}${formatAttrs(xToken.attributes)}>`);
            this.inElement = true;
            this.elementStack.push(xToken.name);
            break;
         case ELEMENT_END_XTOKEN:
            this.push(`</${xToken.name}>`);
            this.elementStack.pop();

            if (this.elementStack.length === 0) {
               this.inElement = false;
            }
            break;
         case CHARREF_XTOKEN:
            this.push(formatText(xToken.char));
            break;
         case CDATA_XTOKEN:
         case CHARDATA_XTOKEN:
            this.push(formatText(xToken.text));
            break;
         default:
            break;
      }

      done();
   }
}

export { XTokenToXmlStream };
