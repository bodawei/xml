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

   constructor(params, lTokens) {
      super(lTokens);

      this.params = params;
   }

}

function parse(source, preliminary, deliverParsed) {
   const results = {
      type: XML_DECLARATION,
      openLToken: preliminary.openLToken,
      postOpenSpaceLToken: preliminary.postOpenSpaceLToken,
      targetLToken: preliminary.targetLToken,
      postTargetSpaceLToken: preliminary.postTargetSpaceLToken,
   };

   getParams(source, (params) => {
      results.params = params;
      source.extract('match', '?>', (lToken) => {
         results.closeLToken = lToken;
         deliverParsed(results);
      });
   });
}

function getParams(source, deliverResults) {
   const params = [];
   source.extract('word', XMLDECL_NAME_TERMINATORS, (lToken) => {
      addParam(source, params, lToken, deliverResults);
   });
}

function addParam(source, params, nameLToken, deliverResults) {
   if (!nameLToken) {
      deliverResults(params);
      return;
   }
   const param = {
      nameLToken: nameLToken,
   };
   params.push(param);

   source.extractToObject('space', param, 'postNameSpaceLToken');
   source.extractToObject('match', '=', param, 'equalLToken');
   source.extractToObject('space', param, 'postEqualSpaceLToken');
   source.extract('peekChar', (quoteLToken) => {
      const gotQuote = quoteLToken && (quoteLToken.text === '"' || quoteLToken.text === '\'');

      if (gotQuote) {
         source.extractToObject('char', param, 'openQuoteLToken');
         source.extractToObject('all', [ quoteLToken.text ], param, 'valueLToken');
         source.extractToObject('match', quoteLToken.text, param, 'closeQuoteLToken');
         source.extractToObject('space', param, 'trailingSpaceLToken');
      }
      // else may want to extract space

      source.extract('word', XMLDECL_NAME_TERMINATORS, (lToken) => {
         addParam(source, params, lToken, deliverResults);
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
      const nameText = util.textOrBlank(param.nameLToken);
      const lcName = nameText.toLocaleLowerCase();
      const valueText = util.textOrBlank(param.valueLToken);
      const lcValue = valueText.toLocaleLowerCase();

      err.setPos(param.nameLToken);

      if (index === 0) {
         err.check(!parsed.postTargetSpaceLToken, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      } else {
         err.check(!parsed.params[index - 1].trailingSpaceLToken, WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME, [ nameText ]);
      }

//         err.checkNameInvalid(param.nameLToken, WFEID.ATTRIBUTE_INVALID_NAME);
      if (XML_DECL_PARAMS[lcName]) {
         err.check(param.nameLToken.text !== lcName, WFEID.XMLDECL_ATTR_INVALID_CASE, [ lcName, nameText ]);
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

            err.check(!foundVersion, WFEID.XMLDECL_STANDALONE_INVALID_ORDER, param.nameLToken);
            break;
         default:
            err.report(WFEID.XMLDECL_ATTR_UNKNOWN, [ param.nameLToken.text ]);
      }

      err.setPos(param.openQuoteLToken);
      err.check(!param.equalLToken, WFEID.ATTRIBUTE_NO_EQUAL, [ nameText ]);
      err.check(!param.openQuoteLToken, WFEID.ATTRIBUTE_NO_QUOTE, [ nameText ]);

      err.setPos(param.valueLToken);
      err.check(!param.valueLToken, WFEID.ATTRIBUTE_NO_VALUE, [ nameText ]);
//         err.add(XmlText.validateText(param.valueLToken, version, parsed.openLToken));

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

   err.setPos(parsed.closeLToken);

   err.check(parsed.params.length === 0, WFEID.XMLDECL_NO_ATTRIBUTES,
      [ isDocEntity ? WFEID.NOUN_XMLDECL : WFEID.NOUN_TEXTDECL ]);

   if (!isDocEntity) {
      err.check(!foundEncoding, WFEID.TEXTDECL_NO_ENCODING);
   }

   err.check(!parsed.closeLToken, WFEID.XMLDECL_NO_CLOSE);
}

function makeToken(parsed) {
   return new XmlDeclaration(extractParams(parsed), []);
}

function extractParams(parsed) {
   const params = [];

   for (let index = 0; index < parsed.params.length; index++) {
      const param = parsed.params[index];

      params.push({
         name: util.textOrBlank(param.nameLToken),
         value: util.textOrUndef(param.valueLToken),
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
