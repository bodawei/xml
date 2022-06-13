/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ProblemCollector } from 'basic';
import { STokenSource, toSToken } from 'basic';
import { DeclarationPToken, parseDocTypeStart } from 'token';

import { WellFormedError, wellFormedErrorCodes } from '../../error/wellFormedError';

import { docTypeStartCheck } from '../docTypeStartCheck';

const WFEID = wellFormedErrorCodes.id;

describe('docTypeStartCheck()', () => {
   let declaration: DeclarationPToken;

   beforeEach(() => {
      declaration = new DeclarationPToken('FOO', {
         declType: toSToken('DOCTYPE'),
         open: toSToken('<!'),
      });
   });

   it('asks the declaration module to report if there is no type', (done) => {
      const source = new STokenSource();
      source.addText('rootElement system "sys.dtd" [');
      source.endText();
      delete declaration.declType;

      parseDocTypeStart(source, declaration, (parsing) => {
         const collector = new ProblemCollector(toSToken('x'), WellFormedError);

         docTypeStartCheck(parsing, collector, new ConformanceVersion());

         expect(collector.getProblems()[0].id).toEqual(WFEID.DECL_NO_DECLTYPE);
         done();
      });
   });

   it('asks the externalId module to look for well formed problems', (done) => {
      const source = new STokenSource();
      source.addText('rootElement system "sys.dtd" [');
      source.endText();

      parseDocTypeStart(source, declaration, (parsing) => {
         const collector = new ProblemCollector(toSToken('x'), WellFormedError);

         docTypeStartCheck(parsing, collector, new ConformanceVersion());

         expect(collector.getProblems()[0].id).toEqual(WFEID.EXTERNALID_INVALID_CASE);
         done();
      });
   });
});
