import { Transform } from 'stream';

function formatExternalId(externalId: any) {
   if (!externalId) {
      return 'ERROR';
   }

   if (externalId.publicId) {
      return `PUBLIC '${externalId.publicId}'`;
   } else {
      return `SYSTEM '${externalId.systemId}'`;
   }
}

class XTokenToXmlStream extends Transform {
   private stash: any;
   private seenNotation: boolean = false;
   private inDocType: boolean = false;
   private notations: { [name: string]: string } = {};
   private inElement: boolean = false;
   private elementStack: Array<string> = [];

   constructor() {
      super({
         objectMode: true,
      });
   }

   _transform(xToken: any, _: string, done: () => void) {
      // console.log('xToken.type', xToken.type);
      switch (xToken.type) {
         case 'SPACE_XTOKEN':
            // console.log('  SPACE', xToken.text);
            if (this.inElement) {
               this.push(xToken.text);
            }
            break;
         case 'ERROR_TYPE':
            // console.log('error', xToken);
            break;
         case 'DOCTYPE_START_XTOKEN':
            this.stash = xToken;
            this.inDocType = true;
            break;
         case 'NOTATION_DECLARATION_XTOKEN':
            this.notations[xToken.name] = `<!NOTATION ${xToken.name} ${formatExternalId(xToken.externalId)}>\n`;
            this.seenNotation = true;
            break;
         case 'DOCTYPE_END_XTOKEN':
            if (this.seenNotation) {
               const keys = Object.keys(this.notations).sort();
               this.push(`<!DOCTYPE ${this.stash.name} [\n`);
               keys.forEach(key => {
                  this.push(this.notations[key]);
               });
               this.push(`]>\n`);
            }
            this.inDocType = false;
            break;
         case 'PROCESSING_INSTRUCTION_XTOKEN':
            // if (!this.inDocType) {
            this.push(`<?${xToken.target} ${xToken.instruction}?>`);
            // }
            break;
         case 'ELEMENT_EMPTY_XTOKEN':
            const attrs2 = xToken.attributes.map((attr: any) => {
               const value = attr.value.map((element: any) => {
                  // console.log('b', element);
                  if (element.text) {
                     return element.text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                  } else if (element.char) {
                     return element.char.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                  }

                  return '';
               });
               return `${attr.name}="${value.join('')}"`;
            });;
            this.push(`<${xToken.name}${attrs2.length > 0 ? ` ${attrs2.join(' ')}` : ''}></${xToken.name}>`); // !!!
            break;
         case 'ELEMENT_START_XTOKEN':
            const attrs = xToken.attributes.map((attr: any) => {
               const value = attr.value.map((element: any) => {
                  // console.log('b', element);
                  if (element.text) {
                     return element.text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                  } else if (element.char) {
                     return element.char.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                  }

                  return '';
               });
               return `${attr.name}="${value.join('')}"`;
            });
            this.push(`<${xToken.name}${attrs.length > 0 ? ` ${attrs.join(' ')}` : ''}>`);
            this.inElement = true;
            this.elementStack.push(xToken.name);
            break;
         case 'ELEMENT_END_XTOKEN':
            this.push(`</${xToken.name}>`);
            this.elementStack.pop();
            if (this.elementStack.length === 0) {
               this.inElement = false;
            }
            break;
         case 'CHARREF_XTOKEN':
            this.push(xToken.char.replace(/"/g, '&quot;'));
            break;
         case 'CDATA_XTOKEN':
         case 'CHARDATA_XTOKEN':
            // console.log('  CHARDATA', xToken.text);
            // console.log('  c', xToken);
            this.push(xToken.text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            break;
         default:
            // console.log('==>', xToken.type);
            break;
      }

      done();
   }
}

export default XTokenToXmlStream;