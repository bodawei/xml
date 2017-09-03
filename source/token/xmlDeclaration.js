/* Copyright ® 2016-2017 by 柏大衛. All rights reserved. */

import { WellFormedError } from '../error';

import util from './util.js';
import xmlToken from './XmlToken.js';

const XML_DECLARATION = 'XML_DECLARATION';
const XMLDECL_NAME_TERMINATORS = [ '=', '?>' ];

const XML_DECL_PARAMS = {
   version: 'version',
   encoding: 'encoding',
   standalone: 'standalone',
};

const WFEID = WellFormedError.ID;

class XmlDeclaration extends xmlToken.Token {

   constructor(params, chunks) {
      super(chunks);

      this.params = params;
   }

}

function parse(source, preliminary, deliverParsed) {
   const results = {
      type: XML_DECLARATION,
      openChunk: preliminary.openChunk,
      postOpenSpaceChunk: preliminary.postOpenSpaceChunk,
      targetChunk: preliminary.targetChunk,
      postTargetSpaceChunk: preliminary.postTargetSpaceChunk,
   };

   getParams(source, (params) => {
      results.params = params;
      source.extract('match', '?>', (chunk) => {
         results.closeChunk = chunk;
         deliverParsed(results);
      });
   });
}

function getParams(source, deliverResults) {
   const params = [];
   source.extract('word', XMLDECL_NAME_TERMINATORS, (chunk) => {
      addParam(source, params, chunk, deliverResults);
   });
}

function addParam(source, params, nameChunk, deliverResults) {
   if (!nameChunk) {
      deliverResults(params);
      return;
   }
   const param = {
      nameChunk: nameChunk,
   };
   params.push(param);

   source.extractToObject('space', param, 'postNameSpaceChunk');
   source.extractToObject('match', '=', param, 'equalChunk');
   source.extractToObject('space', param, 'postEqualSpaceChunk');
   source.extract('peekChar', (quoteChunk) => {
      const gotQuote = quoteChunk && (quoteChunk.text === '"' || quoteChunk.text === '\'');

      if (gotQuote) {
         source.extractToObject('char', param, 'openQuoteChunk');
         source.extractToObject('all', [ quoteChunk.text ], param, 'valueChunk');
         source.extractToObject('match', quoteChunk.text, param, 'closeQuoteChunk');
         source.extractToObject('space', param, 'trailingSpaceChunk');
      }
      // else may want to extract space

      source.extract('word', XMLDECL_NAME_TERMINATORS, (chunk) => {
         addParam(source, params, chunk, deliverResults);
      });
   });
}

function checkWellFormed(parsed, err, isDocEntity) { // need type and version
   let foundEncoding;
   let foundVersion;
   let seenStandalone;

   // check that the parameters are in the right order and have the right values
   for (let index = 0; index < parsed.params.length; index++) {
      const param = parsed.params[index];
      const nameText = util.textOrBlank(param.nameChunk);
      const lcName = nameText.toLocaleLowerCase();
      const valueText = util.textOrBlank(param.valueChunk);
      const lcValue = valueText.toLocaleLowerCase();

      err.setPos(param.nameChunk);

      if (index === 0) {
         err.check(!parsed.postTargetSpaceChunk, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      } else {
         err.check(!parsed.params[index - 1].trailingSpaceChunk, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      }

//         err.checkNameInvalid(param.nameChunk, WFEID.ATTRIBUTE_INVALID_NAME);
      if (XML_DECL_PARAMS[lcName]) {
         err.check(param.nameChunk.text !== lcName, WFEID.XMLDECL_ATTR_INVALID_CASE, [ lcName, nameText ]);
      }

      switch (lcName) {
         case 'version':
            foundVersion = true;
            err.check(index !== 0, WFEID.XMLDECL_VERSION_INVALID_ORDER, [ index ]);
            break;
         case 'encoding':
            foundEncoding = true;
            if (isDocEntity) {
               err.check(!foundVersion || seenStandalone, WFEID.XMLDECL_ENCODING_INVALID_ORDER);
            }
            break;
         case 'standalone':
            seenStandalone = true;
            if (!isDocEntity) {
               err.report(WFEID.TEXTDECL_XTRA_STANDALONE);
            }

            err.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER, param.nameChunk);
            break;
         default:
            err.report(WFEID.XMLDECL_ATTR_UNKNOWN, [ param.nameChunk.text ]);
      }

      err.setPos(param.openQuoteChunk);
      err.check(!param.equalChunk, WFEID.ATTRIBUTE_NO_EQUAL, [ nameText ]);
      err.check(!param.openQuoteChunk, WFEID.ATTRIBUTE_NO_QUOTE, [ nameText ]);

      err.setPos(param.valueChunk);
      err.check(!param.valueChunk, WFEID.ATTRIBUTE_NO_VALUE, [ nameText ]);
//         err.add(XmlText.validateText(param.valueChunk, version, parsed.openChunk));

      switch (lcName) {
         case 'version':
            err.check(valueText !== '1.1' && valueText !== '1.0', WFEID.XMLDECL_VERSION_INVALD, [ valueText ]);
            break;
         case 'encoding':
            if (valueText) {
               err.check(!valueText.match(/^[A-Za-z][-A-Za-z0-9._]*$/), WFEID.XMLDECL_ENCODING_INVALID,
                  [ valueText ]);
            }
            break;
         case 'standalone':
            err.check(lcValue !== 'no' && lcValue !== 'yes', WFEID.XMLDECL_STANDALONE_INVALID, [ valueText ]);
            err.check(valueText !== lcValue, WFEID.XMLDECL_STANDALONE_INVALID_CASE, [ lcValue, valueText ]);
            break;
      }
   }

   err.setPos(parsed.closeChunk);

   err.check(parsed.params.length === 0, WFEID.XMLDECL_NO_ATTRIBUTES,
      [ isDocEntity ? WFEID.NOUN_XMLDECL : WFEID.NOUN_TEXTDECL ]);

   if (!isDocEntity) {
      err.check(!foundEncoding, WFEID.TEXTDECL_NO_ENCODING);
   }

   err.check(!parsed.closeChunk, WFEID.XMLDECL_NO_CLOSE);
}

function makeToken(parsed) {
   return new XmlDeclaration(extractParams(parsed), []);
}

function extractParams(parsed) {
   const params = [];

   for (let index = 0; index < parsed.params.length; index++) {
      const param = parsed.params[index];

      params.push({
         name: util.textOrBlank(param.nameChunk),
         value: util.textOrUndef(param.valueChunk),
      });
   }

   return params;
}

module.exports = {
   TYPE: XML_DECLARATION,
   Token: XmlDeclaration,
   parse,
   checkWellFormed,
   makeToken,
};
