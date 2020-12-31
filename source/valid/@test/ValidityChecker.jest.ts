/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'error-test';
import {
   makeAttListDeclaration,
   makeExternalSubsetEnd,
   makeExternalSubsetStart,
   makeXmlDecl,
} from 'token-test';

import { ValidityChecker } from '../ValidityChecker';
import { xmlDeclarationUpdateState } from '../token/xmlDeclarationUpdateState';
import { externalSubsetStartUpdateState } from '../token/externalSubsetStartUpdateState';
import { externalSubsetEndUpdateState } from '../token/externalSubsetEndUpdateState';
import { attListDeclarationUpdateState } from '../token/attListDeclarationUpdateState';

jest.mock('../token/attListDeclarationUpdateState');
jest.mock('../token/externalSubsetEndUpdateState');
jest.mock('../token/externalSubsetStartUpdateState');
jest.mock('../token/xmlDeclarationUpdateState');

describe('ValidityChecker (unit)', () => {
   let checker: ValidityChecker;
   let ec: MockErrorCollector;

   beforeEach(async () => {
      checker = new ValidityChecker();
      ec = new MockErrorCollector();
   });

   it('calls the routine to update the state when passed an ATTLIST declaration', () => {
      const attListDecl = makeAttListDeclaration();

      checker.checkPToken(attListDecl, ec);

      expect(attListDeclarationUpdateState).toHaveBeenCalledWith(attListDecl, expect.any(Object));
   });

   it('calls the routine to update the state when passed an external subset start', () => {
      const exSSStart = makeExternalSubsetStart();

      checker.checkPToken(exSSStart, ec);

      expect(externalSubsetStartUpdateState).toHaveBeenCalledWith(exSSStart, expect.any(Object));
   });

   it('calls the routine to update the state when passed an external subset start', () => {
      const esSSEnd = makeExternalSubsetEnd();

      checker.checkPToken(esSSEnd, ec);

      expect(externalSubsetEndUpdateState).toHaveBeenCalledWith(esSSEnd, expect.any(Object));
   });

   it('calls the routine to update the state when passed an XML Declaration', () => {
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
