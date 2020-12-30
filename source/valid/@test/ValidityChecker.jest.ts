/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'error-test';
import { makeXmlDecl } from 'token-test';

import { ValidityChecker } from '../ValidityChecker';
import { xmlDeclarationUpdateState } from '../token/xmlDeclarationUpdateState';

jest.mock('../token/xmlDeclarationUpdateState');

describe('xmlDeclarationUpdateState (unit)', () => {
   let checker: ValidityChecker;
   let ec: MockErrorCollector;

   beforeEach(async () => {
      checker = new ValidityChecker();
      ec = new MockErrorCollector();
   });

   it('updates the state when passed an XML Declaration', () => {
      const xmlDecl = makeXmlDecl();

      checker.checkPToken(xmlDecl, ec);

      expect(xmlDeclarationUpdateState).toHaveBeenCalledWith(xmlDecl, expect.any(Object));
   });

   it('will not update the state twice', () => {
      const xmlDecl = makeXmlDecl();

      checker.checkPToken(xmlDecl, ec);
      checker.checkPToken(xmlDecl, ec);

      expect(xmlDeclarationUpdateState).toHaveBeenCalledTimes(1);
   });
});
