/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityLocation } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as declaration from './declaration.js';
import * as docTypeStart from './docTypeStart.js';
import * as entityDeclaration from './entityDeclaration.js';

describe('docTypeStart (integration)', () => {

   describe('parse()', () => {

   });

   describe('makeToken()', () => {
      let expectedLToken;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
      });

      it('populates the token with data from the parsed', () => {
         const parsed = {
            type: 'DOCTYPE_START',
            open: expectedLToken('<!'),
            postOpenSpace: expectedLToken(' '),
            declType: expectedLToken('DOCTYPE'),
            postDeclTypeSpace: expectedLToken('\t'),
            name: expectedLToken('elemType'),
            postNameSpace: expectedLToken('  '),
            externalId: {
               type: 'EXTERNAL_ID',
               idType: expectedLToken('PUBLIC'),
               postIdTypeSpace: expectedLToken(' '),
               publicOpenQuote: expectedLToken('"'),
               publicValue: expectedLToken('pub.xml'),
               publicCloseQuote: expectedLToken('"'),
               postPublicSpace: expectedLToken('\t'),
               systemOpenQuote: expectedLToken('"'),
               systemValue: expectedLToken('sys.xml'),
               systemCloseQuote: expectedLToken('"'),
            },
            postExternalIdSpace: expectedLToken('\t'),
            startInternalSubset: expectedLToken('['),
         };

         const token = docTypeStart.makeToken(parsed);

         expect(token.name).toEqual('elemType');
         expect(token.externalLoc).toEqual(new EntityLocation('sys.xml', 'pub.xml'));
         expect(token.lTokens[0]).toEqual(parsed.open);
         expect(token.lTokens[6]).toEqual(parsed.externalId.idType);
      });

   });

});
