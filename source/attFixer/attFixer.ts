import {
   PToken,
   ATTLISTDECL_PTOKEN_TYPE,
   AttListPToken,
   ELEMENT_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ElementStartPToken,
   ElementEmptyPToken,
   TEXT_PTOKEN,
   TextPToken,
} from 'token';
import { strOrBlank, toSToken } from 'sToken';
import { LiteralValuePToken } from 'source/token/common/literal';
import { ENTITY_META_DATA, EntityMetaData } from 'basic';

interface AttDetals {
   isCData: boolean;
   defaultValue?: LiteralValuePToken
}

interface AttDetailsMap {
   [elementName: string]: {
      [attName: string]: AttDetals;
   };
}

/*
TODO

Feature: Normalization
x Add handling of characther referencers
x Digest spec into specific requirements and add coments to code
x Bless 3.3.3 in the doc folder
x Add support for 1.0's \r\n handling

Feature: Streaming
x Add a stream wrapper around this
x Add to the test system

Feature: Default attributes
x Find the part of the spec for this
x Add suport in.

Cleanup
- Add docs for the default stuff from 3.3.2
- Remove adding of defaults from validator
- integratin test has an extra space
- Combined regexes
- Make regex's global
- Some of the space processing seems a big janky.

Question
- What should we be doing about construction
   - Should we be preserving originalStr in text tokens?
   - should we be leaving empty TextPTokens?
- Avoid using new
*/

function normalizeString(input: string, details: AttDetals): string {
   let working = input;
   /*
    * §3.3.3: (1.0/1) a whitespace character (#x20, #xD, #xA, #x9) is processed by appending #x20
    *    to the normalized value, except that only a single #x20 is appended for a "#xD#xA"
    *    sequence that is part of an external parsed entity or the literal entity value of
    *    an internal parsed entity
    * §3.3.3 (1.0/2+) For a white space character (#x20, #xD, #xA, #x9), append a space
    *    character (#x20) to the normalized value.
    * (See discussion in the README for this)
    */
   working = working.replace(/[ \r\n\t]/g, ' ');

   // If the attribute type is not CDATA, then the XML processor must further process the normalized attribute value by discarding any leading and trailing space (#x20) characters, and by replacing sequences of space (#x20) characters by a single space (#x20) character.
   if (!details.isCData) {
      return working.replace(/[ ]+/g, ' ');
   }

   return working;
}

function normalizeAttr(attributeValue: LiteralValuePToken, details: AttDetals): LiteralValuePToken {
   let newValue: LiteralValuePToken = [];
   let lastWasSpace = true;
   let lastText: TextPToken | undefined;

   for (const val of attributeValue) {
      /*
       * §3.3.3 a character reference is processed by appending the referenced character to the
       *    attribute value
       * §3.3.3 an entity reference is processed by recursively processing the replacement text of the entity
       *    Though, these will already have been expanded, so we simply pass the start and end tokens through as well.
       * §3.3.3 Note that if the unnormalized attribute value contains a character reference to...
       *    To paraphrase: char refs in the attr value have that character passed through unchanged.
       *    in contrast non-char-ref'ed whitespace characters are transformed to spaces, and entity
       *    replacement text containing whitespace chars are also converted to space.
       */
      if (val.type === TEXT_PTOKEN) {
         let newText = normalizeString(strOrBlank(val.text), details);

         // Remove any leading space
         if (lastWasSpace && !details.isCData) {
            newText = newText.replace(/^[ ]+/, '');
         }

         if (newText.length === 0) {
            // Swallow the text token entirely.  Or leave it there but empty?
         } else {
            lastWasSpace = newText[newText.length - 1] === ' ';
            lastText = new TextPToken({
               text: toSToken(newText),
            });
            newValue.push(lastText);
         }
      } else {
         newValue.push(val);
      }
   }

   if (lastWasSpace && lastText && !details.isCData) {
      lastText.text.str = lastText.text.str.replace(/[ ]+$/, '');
      if (lastText.text.str.length === 0) {
         newValue = newValue.filter((item) => item !== lastText);
      }
   }

   return newValue;
}

class AttFixer {
   private attDetails: AttDetailsMap = {};
   private emd?: EntityMetaData;

   processPToken(input: PToken): PToken {
      switch (input.type) {
         case ENTITY_META_DATA:
            this.emd = this.emd ?? input;
            break;
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            const newInput = this.addDefaults(input);
            return this.normalizeElementAttributes(newInput);
         case ATTLISTDECL_PTOKEN_TYPE:
            this.captureAttributeDetails(input);
            break;
      }

      return input;
   }

   private addDefaults(      item: ElementStartPToken | ElementEmptyPToken,
      ): ElementStartPToken | ElementEmptyPToken {
         const elementName = strOrBlank(item.name);
         const attrDefs = this.attDetails[elementName] ?? {  };
         const attrsPresent: { [name: string]: boolean } = {};
         let haveAddedOne = false;

         for (const attr of item.attributes) {
            const attrName = strOrBlank(attr.name);

            if (attrName !== '') {
               attrsPresent[attrName] = true;
            }
         }

         for (const attrName of Object.keys(attrDefs)) {
            const attrDef = attrDefs[attrName];

            if (!attrsPresent[attrName] && attrDef.defaultValue) {
               if (!haveAddedOne) {
                  const previous = item.attributes[item.attributes.length - 1];
                  if (previous) {
                     previous.trailingSpace = previous.trailingSpace ?? toSToken(' ');
                  } else if (!item.nameSpace){
                     (item as any).nameSpace = toSToken(' ');

                  }
               }

               haveAddedOne = true;

               item.attributes.push({
                  name: toSToken(attrName),
                  equal: toSToken('='),
                  openQuote: toSToken('"'),
                  value: attrDef.defaultValue,
                  closeQuote: toSToken('"'),
                  trailingSpace: toSToken(' '),
               });
            }
         }

         return item;
      }


   private captureAttributeDetails(attList: AttListPToken): void {
      const elementName = strOrBlank(attList.elementName);

      if (elementName === '') {
         return;
      }

      this.attDetails[elementName] = this.attDetails[elementName] || {};

      const elDetails = this.attDetails[elementName];

      for (const def of attList.attDefs) {
         const attName = strOrBlank(def.name);
         const attType = strOrBlank(def.type).toLowerCase();

         // §3.3.0: When more than one AttlistDecl is provided for
         //    a given element type, the contents of all those provided
         //    are merged. When more than one definition is provided
         //    for the same attribute of a given element type, the first
         //    declaration is binding and later declarations are ignored
         if (elDetails[attName] || attName === '') {
            continue;
         }

         // §3.3.3 All attributes for which no declaration has been read should be
         //    treated by a non-validating processor as if declared CDATA.
         elDetails[attName] = {
            isCData: attType === 'cdata',
         };

         if (def.value) {
            elDetails[attName].defaultValue = def.value;
         }
      }
   }

   private normalizeElementAttributes(
      item: ElementStartPToken | ElementEmptyPToken,
   ): ElementStartPToken | ElementEmptyPToken {
      const newAttributes = [];
      const elementName = strOrBlank(item.name);
      let newItem: ElementStartPToken | ElementEmptyPToken = item;

      for (const attr of item.attributes) {
         const attrName = strOrBlank(attr.name);
         const attrDefs = this.attDetails[elementName] ?? {};
         const attrDef = attrDefs[attrName] ?? { isCData: false };

         newAttributes.push({
            ...attr,
            value: normalizeAttr(attr.value, attrDef),
         });
      }

      if (item.type === ELEMENT_START_PTOKEN) {
         newItem = new ElementStartPToken({
            ...item,
            attributes: newAttributes,
         });
      } else {
         newItem = new ElementStartPToken({
            ...item,
            attributes: newAttributes,
         });
      }

      return newItem;
   }
}

export { AttFixer };
