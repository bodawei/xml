/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { LTokenSource, defaultExtractors } from '../lToken';
import { makeLTokenMaker } from '../lToken/test';

import * as declaration from './declaration.js';
import * as docTypeStart from './docTypeStart.js';
import * as entityDeclaration from './entityDeclaration.js';
import * as notationDeclaration from './notationDeclaration.js';

describe('declaration (integration)', () => {

   describe('parse()', () => {
      let expectedLToken;
      let emd;
      let source;

      beforeEach(() => {
         expectedLToken = makeLTokenMaker();
         emd = new EntityMetaData();
         source = new LTokenSource(defaultExtractors, emd);
      });

   });

});
