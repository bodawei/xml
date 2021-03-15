/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ErrorCollector } from 'basic';
import { defaultExtractors } from 'extractor';
import { STokenSource, toSToken } from 'sToken';
import { parseDocTypeStart } from 'token';
import { DeclarationPToken } from '../../../token/bridge/baseDeclaration';

import { WellFormedError } from '../../error/WellFormedError';
import { docTypeStartCheck } from '../docTypeStartCheck';

describe('docTypeStartCheck()', () => {
   let declaration: DeclarationPToken;

   beforeEach(() => {
      declaration = new DeclarationPToken('FOO', {
         open: toSToken('<!'),
         declType: toSToken('DOCTYPE'),
      });
   });

   it('asks the declaration module to report if there is no type', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('rootElement system "sys.dtd" [');
      source.endText();
      delete declaration.declType;

      parseDocTypeStart(source, declaration, (parsing) => {
         const ec = new ErrorCollector(toSToken('x'), WellFormedError);

         docTypeStartCheck(parsing, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.DECL_NO_DECLTYPE);
         done?.();
      });
   });

   it('asks the externalId module to look for well formed problems', (done) => {
      const source = new STokenSource(defaultExtractors);
      source.addText('rootElement system "sys.dtd" [');
      source.endText();

      parseDocTypeStart(source, declaration, (parsing) => {
         const ec = new ErrorCollector(toSToken('x'), WellFormedError);

         docTypeStartCheck(parsing, ec, new ConformanceVersion());

         expect(ec.getErrors()[0].id).toEqual(WellFormedError.ID.EXTERNALID_INVALID_CASE);
         done?.();
      });
   });
});
