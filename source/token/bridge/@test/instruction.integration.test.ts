/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../../error';
import { defaultExtractors } from '../../../extractor';
import { STokenSource } from '../../../sToken';

import * as instruction from '../instruction.js';

describe('instruction (integration)', () => {

   describe('checkWellFormed()', () => {
      let ec: ErrorCollector;
      let emd: EntityMetaData;
      let source: STokenSource;

      beforeEach(() => {
         emd = new EntityMetaData();
         source = new STokenSource(defaultExtractors, emd);
         ec = new ErrorCollector(undefined as any, WellFormedError);
      });

   });

});
