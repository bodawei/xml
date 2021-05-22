/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import {
   makeAttListDeclaration,
   makeDocTypeEnd,
   makeDocTypeStart,
   makeElementDeclaration,
   makeElementEmpty,
   makeElementEnd,
   makeElementStart,
   makeExternalSubsetEnd,
   makeExternalSubsetStart,
   makeGeneralEntityDeclaration,
   makeGeneralEntityReference,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterEntityReference,
   makeXmlDecl,
} from 'token-test';

import { ValidityChecker } from '../ValidityChecker';
import { attListDeclarationUpdateState } from '../token/attListDeclarationUpdateState';
import { attListDeclarationValidate } from '../token/attListDeclarationValidate';
import { conditionalValidate } from '../token/conditionalValidate';
import { docTypeStartUpdateState } from '../token/docTypeStartUpdateState';
import { elementDeclarationUpdateState } from '../token/elementDeclarationUpdateState';
import { elementDeclarationValidate } from '../token/elementDeclarationValidate';
import { elementEndUpdateState } from '../token/elementEndUpdateState';
import { elementEndValidate } from '../token/elementEndValidate';
import { elementStartUpdateState } from '../token/elementStartUpdateState';
import { elementStartValidate } from '../token/elementStartValidate';
import { elidedEntityDeclarationUpdateState } from '../token/elidedEntityDeclarationUpdateState';
import { externalSubsetStartUpdateState } from '../token/externalSubsetStartUpdateState';
import { externalSubsetEndUpdateState } from '../token/externalSubsetEndUpdateState';
import { generalEntityDeclarationUpdateState } from '../token/generalEntityDeclarationUpdateState';
import { dtdEndValidate } from '../token/dtdEndValidate';
import { generalEntityReferenceValidate } from '../token/generalEntityReferenceValidate';
import { notationDeclarationUpdateState } from '../token/notationDeclarationUpdateState';
import { notationDeclarationValidate } from '../token/notationDeclarationValidate';
import { parameterEntityDeclarationUpdateState } from '../token/parameterEntityDeclarationUpdateState';
import { parameterEntityReferenceValidate } from '../token/parameterEntityReferenceValidate';
import { xmlDeclarationUpdateState } from '../token/xmlDeclarationUpdateState';
import { ConformanceVersion } from 'basic';
import { ConditionalPToken, ElidedEntityDeclarationPToken } from 'token';
import { toSToken } from 'sToken';

jest.mock('../token/attListDeclarationValidate');
jest.mock('../token/attListDeclarationUpdateState');
jest.mock('../token/conditionalValidate');
jest.mock('../token/docTypeStartUpdateState');
jest.mock('../token/dtdEndValidate');
jest.mock('../token/elementDeclarationUpdateState');
jest.mock('../token/elementDeclarationValidate');
jest.mock('../token/elementEndUpdateState');
jest.mock('../token/elementEndValidate');
jest.mock('../token/elementStartUpdateState');
jest.mock('../token/elementStartValidate');
jest.mock('../token/elidedEntityDeclarationUpdateState');
jest.mock('../token/externalSubsetEndUpdateState');
jest.mock('../token/externalSubsetStartUpdateState');
jest.mock('../token/generalEntityDeclarationUpdateState');
jest.mock('../token/generalEntityReferenceValidate');
jest.mock('../token/notationDeclarationUpdateState');
jest.mock('../token/notationDeclarationValidate');
jest.mock('../token/parameterEntityDeclarationUpdateState');
jest.mock('../token/parameterEntityReferenceValidate');
jest.mock('../token/xmlDeclarationUpdateState');

describe('ValidityChecker (unit)', () => {
   let version: ConformanceVersion;
   let checker: ValidityChecker;
   let ec: MockErrorCollector;
   let elementDeclarationUpdateStateMock: jest.MockedFunction<typeof elementDeclarationUpdateState>;

   beforeEach(async () => {
      version = new ConformanceVersion();
      checker = new ValidityChecker();
      ec = new MockErrorCollector();

      elementDeclarationUpdateStateMock = elementDeclarationUpdateState as jest.MockedFunction<
         typeof elementDeclarationUpdateState
      >;
      elementDeclarationUpdateStateMock.mockImplementation((token, state) => state);
   });

   it('stores the version passed to it and pass that on to other validations', () => {
      const elDecl = makeElementDeclaration();

      checker.checkPToken(version, ec);
      checker.checkPToken(elDecl, ec);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         expect.any(Object),
         ec,
         version,
      );
   });

   it('stores only the first version passed to it', () => {
      const elDecl = makeElementDeclaration();
      checker.checkPToken(version, ec);

      checker.checkPToken(new ConformanceVersion(1, 2), ec);
      checker.checkPToken(elDecl, ec);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         expect.any(Object),
         ec,
         version,
      );
   });

   it('validates an ATTLIST declaration', () => {
      const attListDecl = makeAttListDeclaration();

      checker.checkPToken(attListDecl, ec);

      expect(attListDeclarationValidate).toHaveBeenCalledWith(attListDecl, expect.any(Object), ec);
   });

   it('updates the state when passed an ATTLIST declaration', () => {
      const attListDecl = makeAttListDeclaration();

      checker.checkPToken(attListDecl, ec);

      expect(attListDeclarationUpdateState).toHaveBeenCalledWith(attListDecl, expect.any(Object));
   });

   it('validates a conditional start', () => {
      const conditional = new ConditionalPToken({ open: toSToken('<![') });
      checker.checkPToken(version, ec);

      checker.checkPToken(conditional, ec);

      expect(conditionalValidate).toHaveBeenCalledWith(conditional, expect.any(Object), ec);
   });

   it('updates the state when passed a docTypeStart', () => {
      const docTypeStart = makeDocTypeStart();

      checker.checkPToken(docTypeStart, ec);

      expect(docTypeStartUpdateState).toHaveBeenCalledWith(docTypeStart, expect.any(Object));
   });

   it('updates the state when passed an element start', () => {
      const elementEmpty = makeElementEmpty();

      checker.checkPToken(elementEmpty, ec);

      expect(elementStartUpdateState).toHaveBeenCalledWith(elementEmpty, expect.any(Object));
   });

   it('validates an element start', () => {
      const elStart = makeElementStart();

      checker.checkPToken(elStart, ec);

      expect(elementStartValidate).toHaveBeenCalledWith(elStart, expect.any(Object), ec);
   });

   it('updates the state when passed an element declaration', () => {
      const elDecl = makeElementDeclaration();

      checker.checkPToken(elDecl, ec);

      expect(elementDeclarationUpdateState).toHaveBeenCalledWith(elDecl, expect.any(Object));
   });

   it('validates an element declaration', () => {
      const elDecl = makeElementDeclaration();
      checker.checkPToken(version, ec);

      checker.checkPToken(elDecl, ec);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         expect.any(Object),
         ec,
         version,
      );
   });

   it('updates the state when passed an element end', () => {
      const elementEnd = makeElementEnd();

      checker.checkPToken(elementEnd, ec);

      expect(elementEndUpdateState).toHaveBeenCalledWith(elementEnd, expect.any(Object));
   });

   it('validates an element end', () => {
      const elementEnd = makeElementEnd();

      checker.checkPToken(elementEnd, ec);

      expect(elementEndValidate).toHaveBeenCalledWith(elementEnd, expect.any(Object), ec);
   });

   it('updates the state when passed an elided entity declaration', () => {
      const peDecl = makeParameterEntityDeclaration();
      const elided = new ElidedEntityDeclarationPToken(peDecl, peDecl.value); // typehack

      checker.checkPToken(elided, ec);

      expect(elidedEntityDeclarationUpdateState).toHaveBeenCalledWith(elided, expect.any(Object));
   });

   it('updates the state when passed an external subset end', () => {
      const esSSEnd = makeExternalSubsetEnd();

      checker.checkPToken(esSSEnd, ec);

      expect(externalSubsetEndUpdateState).toHaveBeenCalledWith(esSSEnd, expect.any(Object));
   });

   it('updates the state when passed an external subset start', () => {
      const esSSStart = makeExternalSubsetStart();

      checker.checkPToken(esSSStart, ec);

      expect(externalSubsetStartUpdateState).toHaveBeenCalledWith(esSSStart, expect.any(Object));
   });

   it('updates the state when passed a general entity declaration', () => {
      const geDecl = makeGeneralEntityDeclaration();

      checker.checkPToken(geDecl, ec);

      expect(generalEntityDeclarationUpdateState).toHaveBeenCalledWith(geDecl, expect.any(Object));
   });

   it('validates the state at the end of a DTD', () => {
      checker.checkPToken(makeDocTypeEnd(), ec);

      expect(dtdEndValidate).toHaveBeenCalledWith(expect.any(Object), ec);
   });

   it('validates an general entity reference', () => {
      const geRef = makeGeneralEntityReference();

      checker.checkPToken(geRef, ec);

      expect(generalEntityReferenceValidate).toHaveBeenCalledWith(geRef, expect.any(Object), ec);
   });

   it('updates the state when passed a notation declaration', () => {
      const notationDecl = makeNotationDeclaration();

      checker.checkPToken(notationDecl, ec);

      expect(notationDeclarationUpdateState).toHaveBeenCalledWith(notationDecl, expect.any(Object));
   });

   it('validates a notation declaration', () => {
      const notationDecl = makeNotationDeclaration();

      checker.checkPToken(notationDecl, ec);

      expect(notationDeclarationValidate).toHaveBeenCalledWith(
         notationDecl,
         expect.any(Object),
         ec,
      );
   });

   it('updates the state when passed a parameter entity declaration', () => {
      const peDecl = makeParameterEntityDeclaration();

      checker.checkPToken(peDecl, ec);

      expect(parameterEntityDeclarationUpdateState).toHaveBeenCalledWith(
         peDecl,
         expect.any(Object),
      );
   });

   it('validates an parameter entity reference', () => {
      const peRef = makeParameterEntityReference();

      checker.checkPToken(peRef, ec);

      expect(parameterEntityReferenceValidate).toHaveBeenCalledWith(peRef, expect.any(Object), ec);
   });

   it('updates the state when passed an XML Declaration', () => {
      const xmlDecl = makeXmlDecl();

      checker.checkPToken(xmlDecl, ec);

      expect(xmlDeclarationUpdateState).toHaveBeenCalledWith(xmlDecl, expect.any(Object));
   });

   it('will not update the state twice when called with two XML Declarations', () => {
      const xmlDecl = makeXmlDecl();

      checker.checkPToken(xmlDecl, ec);
      checker.checkPToken(xmlDecl, ec);

      expect(xmlDeclarationUpdateState).toHaveBeenCalledTimes(1);
   });
});
