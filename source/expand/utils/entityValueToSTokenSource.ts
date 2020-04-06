import { EntityMetaData } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource } from 'sToken';
import {
   CHARREF_PTOKEN,
   TEXT_PTOKEN,

   EntityValuePToken,
} from 'token';

function entityValueToSTokenSource(entityValue: EntityValuePToken, emd: EntityMetaData): STokenSource {
   const source = new STokenSource(defaultExtractors, emd);

   for (let element of entityValue) {
      switch (element.type) {
         case CHARREF_PTOKEN:
            source.addText(String.fromCharCode(element.charCode));
            break;
         case TEXT_PTOKEN:
            source.addText(element.text.str);
            break;
      }
   }

   source.endText();

   return source;
}

export {
   entityValueToSTokenSource,
};