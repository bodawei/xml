import { PToken, ATTLISTDECL_PTOKEN_TYPE, AttListPToken, ELEMENT_START_PTOKEN, ELEMENT_EMPTY_PTOKEN, ElementStartPToken, ElementEmptyPToken, TEXT_PTOKEN, TextPToken } from "token";
import { strOrBlank, toSToken } from "sToken";
import { LiteralValuePToken } from "source/token/common/literal";

interface  AttDetals {
   isCData: boolean,
}

interface AttDetailsMap {
   [elementName: string]: {
      [attName: string]: AttDetals
   }
}

/*
TODO

Feature: Normalization
- Add handling of characther referencers
- Digest spec into specific requirements and add coments to code
- Add support for 1.0's \r\n handling
- Bless 3.3.3 in the doc folder

Feature: Default attributes
- Find the part of the spec for this
- Add suport in.

Cleanup
- Combined regexes
- Make regex's global

Question
- What should we be doing about construction
   - Should we be preserving originalStr in text tokens?
   - should we be leaving empty TextPTokens?
- Avoid using new
*/

function normalizeString(input: string, details: AttDetals): string {
   if (details.isCData) {
      return input.replace(/\r\n/g, '\n').replace(/[ \r\n\t]/g, ' ');
   }

   return input.replace(/\r\n/g, '\n').replace(/[ \r\n\t]+/g, ' ');
}

function normalizeAttr(attributeValue: LiteralValuePToken, details: AttDetals): LiteralValuePToken {
   let newValue: LiteralValuePToken = [];
   let lastWasSpace: boolean = true;
   let lastText: TextPToken | undefined = undefined;
   
   for (let val of attributeValue) {
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
         newValue = newValue.filter(item => item !== lastText);
      }
   }

   return newValue;
}


class AttFixer {
   private attDetails: AttDetailsMap = {};

   processPToken(input: PToken): PToken {

      switch (input.type) {
         case ELEMENT_START_PTOKEN:
         case ELEMENT_EMPTY_PTOKEN:
            return this.normalizeElementAttributes(input);
         case ATTLISTDECL_PTOKEN_TYPE:
            this.captureAttributeDetails(input);
            break;
      }

      return input;
   }


   private captureAttributeDetails(attList: AttListPToken): void {
      const elementName = strOrBlank(attList.elementName);

      if (elementName === '') {
         return;
      }

      this.attDetails[elementName] = this.attDetails[elementName] || {};

      const elDetails = this.attDetails[elementName];

      for (let def of attList.attDefs) {
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

         // At the moment, we only care about CDATA vs. other types, so collapse the types.
         elDetails[attName] = {
            isCData: attType === 'cdata'
         }
      }
   }

   private normalizeElementAttributes(item: ElementStartPToken | ElementEmptyPToken): ElementStartPToken | ElementEmptyPToken {
      const newAttributes = [];
      const elementName = strOrBlank(item.name);
      let newItem: ElementStartPToken | ElementEmptyPToken = item;

      for (let attr of item.attributes) {
         const attrName = strOrBlank(attr.name);
         const attrDefs = this.attDetails[elementName] ?? {};
         const attrDef = attrDefs[attrName];

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

export {
   AttFixer,
}


/*
#### 3.3.3 Attribute-Value Normalization

Before the value of an attribute is passed to the application or checked for validity, the XML processor must normalize it as follows:

> **1.0/2: Appends:** ...must normalize the attribute value by applying the algorithm below, or by using some other method such that the value passed to the application is the same as that produced by the algorithm. ***(cosmetic)***

> **1.0/2: Adds:** 1. All line breaks must have been normalized on input to #xA as described in 2.11 End-of-Line Handling, so the rest of this algorithm operates on text normalized in this way. ***(cosmetic)***

> **1.0/2: Adds:** 2. Begin with a normalized value consisting of the empty string. ***(cosmetic)***

> **1.0/2: Adds:** 3. For each character, entity reference, or character reference in the unnormalized attribute value, beginning with the first and continuing to the last, do the following: ***(cosmetic)***

* a character reference is processed by appending the referenced character to the attribute value

> **1.0/2: Replaces:**    * For a character reference, append the referenced character to the normalized value. ***(cosmetic)***

* an entity reference is processed by recursively processing the replacement text of the entity

> **1.0/2: Replaces:**       * For an entity reference, recursively apply step 3 of this algorithm to the replacement text of the entity. ***(cosmetic)***

* a whitespace character (#x20, #xD, #xA, #x9) is processed by appending #x20 to the normalized value, except that only a single #x20 is appended for a "#xD#xA" sequence that is part of an external parsed entity or the literal entity value of an internal parsed entity

> **1.0/2: Replaces:**       * For a white space character (#x20, #xD, #xA, #x9), append a space character (#x20) to the normalized value. ***(cosmetic)***

* other characters are processed by appending them to the normalized value

> **1.0/2: Replaces:**   * For another character, append the character to the normalized value. ***(cosmetic)***

If the attribute type is not CDATA, then the XML processor must further process the normalized attribute value by discarding any leading and trailing space (#x20) characters, and by replacing sequences of space (#x20) characters by a single space (#x20) character.

> **1.0/2: Modifies:** If the declared value is not CDATA, ... ***(cosmetic)***

> **1.0/2: Adds:** Note that if the unnormalized attribute value contains a character reference to a white space character other than space (#x20), the normalized value contains the referenced character itself (#xD, #xA or #x9). This contrasts with the case where the unnormalized value contains a white space character (not a reference), which is replaced with a space character (#x20) in the normalized value and also contrasts with the case where the unnormalized value contains an entity reference whose replacement text contains a white space character; being recursively processed, the white space character is replaced with a space character (#x20) in the normalized value. ***(cosmetic)***

All attributes for which no declaration has been read should be treated by a non-validating processor as if declared CDATA.

> **1.0/2: Modified:** ... treated by a non-validating parser as if declared CDATA. ***(cosmetic)***

> **1.0/3: Adds:** It is an error if an attribute value contains a reference to an entity for which no declaration has been read.

> **1.0/2: Adds all the below** ***(cosmetic)***

Following are examples of attribute normalization. Given the following declarations:
```
<!ENTITY d "&#xD;">
<!ENTITY a "&#xA;">
<!ENTITY da "&#xD;&#xA;">
```
the attribute specifications in the left column below would be normalized to the character sequences of the middle column if the attribute a is declared NMTOKENS and to those of the right columns if a is declared CDATA.

| Attribute specification | a is NMTOKENS | a is CDATA |
| ------ | ------ | ------ |
| a=" <br> xyz" |  x y z | #x20 #x20 x y z |
| a="&amp;d;&amp;d;A&amp;a;&a;B&amp;da;" | A #x20 B | #x20 #x20 A #x20 #x20 B #x20 #x20 |
| a="&amp;#xd;&amp;#xd;A&amp;#xa;&amp;#xa;B&amp;#xd;&amp;#xa;" | #xD #xD A #xA #xA B #xD #xA | #xD #xD A #xA #xA B #xD #xD |

Note that the last example is invalid (but well-formed) if a is declared to be of type NMTOKENS.

> **1.0/3: Modified:** Fixes the last example to be `#xD #xD A #xA #xA B #xD #xA`


##### Appendix: Standards
* 1.0/1: https://www.w3.org/TR/1998/REC-xml-19980210#AVNormalize
   * Annotated: https://www.xml.com/axml/axml.html
* 1.0/2: https://www.w3.org/TR/2000/REC-xml-20001006#AVNormalize
* 1.0/3: https://www.w3.org/TR/2004/REC-xml-20040204#AVNormalize
* 1.0/4: https://www.w3.org/TR/2006/REC-xml-20060816#AVNormalize
* 1.0/5: https://www.w3.org/TR/xml#AVNormalize
* 1.0/6: https://www.w3.org/XML/xml-V10-5e-errata
* 1.1/1: https://www.w3.org/TR/2004/REC-xml11-20040204#AVNormalize
* 1.1/2: https://www.w3.org/TR/2006/REC-xml11-20060816#AVNormalize
* 1.1/3: https://www.w3.org/XML/xml-V11-2e-errata


*/