/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

const ErrorCollector = require('../basic/ErrorCollector.js');
const SyntaxError = require('../error/SyntaxError.js');
const token = require('./XmlToken.js');

const XML_DECL_PARAMS = {
   version: 'version',
   encoding: 'encoding',
   standalone: 'standalone',
};

const WFEID = SyntaxError.ID;

function textOrBlank(chunk) {
   return chunk ? chunk.text : '';
}

function textOrUndefined(chunk) {
   return chunk && chunk.text;
}

class XmlDeclaration extends token.XmlToken {

   constructor(params, chunks) {
      super(chunks);

      this.params = params;
   }

}

module.exports = {

   XmlDeclaration,

   checkWellFormed(parsed, isDocEntity) { // need type and version
      const err = new ErrorCollector(parsed.openChunk, SyntaxError);
      let foundEncoding;

      // check that the parameters are in the right order and have the right values
      for (let index = 0; index < parsed.params.length; index++) {
         const param = parsed.params[index];
         const nameText = textOrBlank(param.nameChunk);
         const lcName = nameText.toLocaleLowerCase();
         const valueText = textOrBlank(param.valueChunk);
         const lcValue = valueText.toLocaleLowerCase();
         let foundVersion;
         let seenStandalone;

         err.setPos(parsed.nameChunk);

         if (index === 0) {
            err.check(!parsed.postTargetSpaceChunk, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
         } else {
            err.check(!parsed.params[index - 1].trailingSpaceChunk, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
         }

//         err.checkNameInvalid(param.nameChunk, WFEID.ATTRIBUTE_INVALID_NAME);
         if (XML_DECL_PARAMS[lcName]) {
            err.check(param.nameChunk.text !== lcName, WFEID.XMLDECL_ATTR_INVALID_CASE, [ lcName, nameText ]);
         }

         err.setPos(param.openQuoteChunk);
         err.check(!param.equalChunk, WFEID.ATTRIBUTE_NO_EQUAL, [ nameText ]);
         err.check(!param.openQuoteChunk, WFEID.ATTRIBUTE_NO_QUOTE, [ nameText ]);

         err.setPos(param.valueChunk);
         err.check(!param.valueChunk, WFEID.ATTRIBUTE_NO_VALUE, [ nameText ]);
//         err.add(XmlText.validateText(param.valueChunk, version, parsed.openChunk));

         switch (lcName) {
            case 'version':
               foundVersion = true;
               err.check(index !== 0, WFEID.XMLDECL_VERSION_INVALID_ORDER, [ index ]);
               err.check(valueText !== '1.1' && valueText !== '1.0', WFEID.XMLDECL_VERSION_INVALD, [ valueText ]);
               break;
            case 'encoding':
               foundEncoding = true;
               if (isDocEntity) {
                  err.check(!foundVersion || seenStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER, [], param.nameChunk);
               }
               if (valueText) {
                  err.check(valueText.match(/^[A-Za-z][-A-Za-z0-9._]*$/), WFEID.XMLDECL_ENCODING_INVALID,
                     [ valueText ]);
               }
               break;
            case 'standalone':
               seenStandalone = true;
               if (!isDocEntity) {
                  err.report(WFEID.TEXTDECL_XTRA_STANDALONE, [], param.nameChunk);
               }

               err.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER, param.nameChunk);
               err.check(lcValue !== 'no' && lcValue !== 'yes', WFEID.XMLDECL_STANDALONE_INVALID, [ valueText ]);
               err.check(valueText !== lcValue, WFEID.XMLDECL_STANDALONE_INVALID_CASE, [ lcValue, valueText ]);
               break;
            default:
               err.report(WFEID.XMLDECL_ATTR_UNKNOWN, [ param.nameChunk.text ], param.nameChunk);
         }
      }

      err.setPos(parsed.closeChunk);

      err.check(parsed.params.length === 0, WFEID.XMLDECL_NO_ATTRIBUTES,
         [ isDocEntity ? WFEID.NOUN_XMLDECL : WFEID.NOUN_TEXTDECL ]);

      if (!isDocEntity) {
         err.check(!foundEncoding, WFEID.TEXTDECL_NO_ENCODING);
      }

      err.check(!parsed.closeChunk, WFEID.XMLDECL_NO_CLOSE);

      return err;
   },

   makeToken(parsed) {
      return new XmlDeclaration(extractParams(parsed), []);
   },
};

function extractParams(parsed) {
   const params = [];

   for (let index = 0; index < parsed.params.length; index++) {
      const param = parsed.params[index];

      params.push({
         name: textOrBlank(param.nameChunk),
         value: textOrUndefined(param.valueChunk),
      });
   }

   return params;
}
