/* Copyright ® 2020-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, ProblemCollector, toSToken } from 'basic';
import { ConditionalEndPToken, ConditionalStartPToken, ElidedEntityDeclarationPToken } from 'token';
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
   makeGeneralEntityStart,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterEntityReference,
   makeParameterEntityStart,
   makeXmlDecl,
} from 'token-test';

import { contentUpdateState } from '../common/contentUpdateState';
import { contentValidate } from '../common/contentValidate';
import { elementDeclarationPreprocess } from '../common/elementDeclarationPreprocess';
import { entityDeclarationValueValidate } from '../common/entityDeclarationValueValidate';
import { ValidityState } from '../common/validityState';
import { attListDeclarationUpdateState } from '../token/attListDeclarationUpdateState';
import { attListDeclarationValidate } from '../token/attListDeclarationValidate';
import { conditionalEndUpdateState } from '../token/conditionalEndUpdateState';
import { conditionalEndValidate } from '../token/conditionalEndValidate';
import { conditionalStartUpdateState } from '../token/conditionalStartUpdateState';
import { conditionalStartValidate } from '../token/conditionalStartValidate';
import { docTypeEndValidate } from '../token/docTypeEndValidate';
import { docTypeStartUpdateState } from '../token/docTypeStartUpdateState';
import { elementDeclarationUpdateState } from '../token/elementDeclarationUpdateState';
import { elementDeclarationValidate } from '../token/elementDeclarationValidate';
import { elementEndUpdateState } from '../token/elementEndUpdateState';
import { elementEndValidate } from '../token/elementEndValidate';
import { elementStartUpdateState } from '../token/elementStartUpdateState';
import { elementStartValidate } from '../token/elementStartValidate';
import { elidedEntityDeclarationUpdateState } from '../token/elidedEntityDeclarationUpdateState';
import { entityDeclarationValidate } from '../token/entityDeclarationValidate';
import { externalSubsetEndUpdateState } from '../token/externalSubsetEndUpdateState';
import { externalSubsetStartUpdateState } from '../token/externalSubsetStartUpdateState';
import { generalEntityDeclarationUpdateState } from '../token/generalEntityDeclarationUpdateState';
import { generalEntityReferenceValidate } from '../token/generalEntityReferenceValidate';
import { generalEntityStartValidate } from '../token/generalEntityStartValidate';
import { notationDeclarationUpdateState } from '../token/notationDeclarationUpdateState';
import { notationDeclarationValidate } from '../token/notationDeclarationValidate';
import { parameterEntityDeclarationUpdateState } from '../token/parameterEntityDeclarationUpdateState';
import { parameterEntityReferenceValidate } from '../token/parameterEntityReferenceValidate';
import { parameterEntityStartValidate } from '../token/parameterEntityStartValidate';
import { xmlDeclarationUpdateState } from '../token/xmlDeclarationUpdateState';
import { ValidityChecker } from '../validityChecker';

jest.mock('../common/contentValidate');
jest.mock('../common/contentUpdateState');
jest.mock('../common/elementDeclarationPreprocess');
jest.mock('../common/entityDeclarationValueValidate');
jest.mock('../token/attListDeclarationValidate');
jest.mock('../token/attListDeclarationUpdateState');
jest.mock('../token/conditionalEndUpdateState');
jest.mock('../token/conditionalEndValidate');
jest.mock('../token/conditionalStartUpdateState');
jest.mock('../token/conditionalStartValidate');
jest.mock('../token/docTypeStartUpdateState');
jest.mock('../token/docTypeEndValidate');
jest.mock('../token/elementDeclarationUpdateState');
jest.mock('../token/elementDeclarationValidate');
jest.mock('../token/elementEndUpdateState');
jest.mock('../token/elementEndValidate');
jest.mock('../token/elementStartUpdateState');
jest.mock('../token/elementStartValidate');
jest.mock('../token/elidedEntityDeclarationUpdateState');
jest.mock('../token/entityDeclarationValidate');
jest.mock('../token/externalSubsetEndUpdateState');
jest.mock('../token/externalSubsetStartUpdateState');
jest.mock('../token/generalEntityDeclarationUpdateState');
jest.mock('../token/generalEntityReferenceValidate');
jest.mock('../token/generalEntityStartValidate');
jest.mock('../token/notationDeclarationUpdateState');
jest.mock('../token/notationDeclarationValidate');
jest.mock('../token/parameterEntityDeclarationUpdateState');
jest.mock('../token/parameterEntityReferenceValidate');
jest.mock('../token/parameterEntityStartValidate');
jest.mock('../token/xmlDeclarationUpdateState');

describe('ValidityChecker (unit)', () => {
   let version: ConformanceVersion;
   let checker: ValidityChecker;
   let elementDeclarationUpdateStateMock: jest.MockedFunction<typeof elementDeclarationUpdateState>;
   let conditionalStartUpdateStateMock: jest.MockedFunction<typeof conditionalStartUpdateState>;
   let conditionalEndUpdateStateMock: jest.MockedFunction<typeof conditionalEndUpdateState>;

   beforeEach(() => {
      version = new ConformanceVersion();
      checker = new ValidityChecker();

      elementDeclarationUpdateStateMock = elementDeclarationUpdateState as jest.MockedFunction<
         typeof elementDeclarationUpdateState
      >;
      conditionalStartUpdateStateMock = conditionalStartUpdateState as jest.MockedFunction<
         typeof conditionalStartUpdateState
      >;
      conditionalEndUpdateStateMock = conditionalEndUpdateState as jest.MockedFunction<
         typeof conditionalEndUpdateState
      >;
      const contentUpdateStateMock = contentUpdateState as jest.MockedFunction<
         typeof conditionalEndUpdateState
      >;
      elementDeclarationUpdateStateMock.mockImplementation((token, details, state) => state);
      conditionalEndUpdateStateMock.mockImplementation((token, state) => state);
      conditionalStartUpdateStateMock.mockImplementation((token, state) => state);
      contentUpdateStateMock.mockImplementation((token, state) => state);
   });

   it('stores the version passed to it and pass that on to other validations', () => {
      (elementDeclarationPreprocess as jest.Mock).mockReturnValue({});
      (elementDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const elDecl = makeElementDeclaration();

      checker.check(version);
      checker.check(elDecl);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         {},
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('stores only the first version passed to it', () => {
      (elementDeclarationPreprocess as jest.Mock).mockReturnValue({});
      (elementDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const elDecl = makeElementDeclaration();
      checker.check(version);

      checker.check(new ConformanceVersion(1, 2));
      checker.check(elDecl);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         {},
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('validates the content on every token (§3.0.0)', () => {
      const conditional = new ConditionalEndPToken({ open: toSToken('<![') });

      checker.check(conditional);

      expect(contentValidate).toHaveBeenCalledWith(
         conditional,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state on every token (§3.0.0)', () => {
      const conditional = new ConditionalEndPToken({ open: toSToken('<![') });

      checker.check(conditional);

      expect(contentUpdateState).toHaveBeenCalledWith(conditional, expect.any(Object));
   });

   it('validates an ATTLIST declaration', () => {
      (attListDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const attListDecl = makeAttListDeclaration();

      checker.check(attListDecl);

      expect(attListDeclarationValidate).toHaveBeenCalledWith(
         attListDecl,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed an ATTLIST declaration', () => {
      (attListDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const attListDecl = makeAttListDeclaration();

      checker.check(attListDecl);

      expect(attListDeclarationUpdateState).toHaveBeenCalledWith(attListDecl, expect.any(Object));
   });

   it('updates the state for a conditional end', () => {
      const conditional = new ConditionalEndPToken({ open: toSToken('<![') });

      checker.check(conditional);

      expect(conditionalEndUpdateState).toHaveBeenCalledWith(conditional, expect.any(Object));
   });

   it('validates a conditional end', () => {
      const conditional = new ConditionalEndPToken({ open: toSToken('<![') });

      checker.check(conditional);

      expect(conditionalEndValidate).toHaveBeenCalledWith(
         conditional,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('validates a conditional start', () => {
      const conditional = new ConditionalStartPToken({ open: toSToken('<![') });
      checker.check(version);

      checker.check(conditional);

      expect(conditionalStartValidate).toHaveBeenCalledWith(
         conditional,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state for a conditional start', () => {
      const conditional = new ConditionalStartPToken({ open: toSToken('<![') });

      checker.check(conditional);

      expect(conditionalStartUpdateState).toHaveBeenCalledWith(conditional, expect.any(Object));
   });

   it('updates the state when passed a docTypeStart', () => {
      (docTypeStartUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const docTypeStart = makeDocTypeStart();

      checker.check(docTypeStart);

      expect(docTypeStartUpdateState).toHaveBeenCalledWith(docTypeStart, expect.any(Object));
   });

   it('updates the state when passed an element start', () => {
      (elementStartUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const elementEmpty = makeElementEmpty();

      checker.check(elementEmpty);

      expect(elementStartUpdateState).toHaveBeenCalledWith(elementEmpty, expect.any(Object));
   });

   it('validates an element start', () => {
      (elementStartUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const elStart = makeElementStart();

      checker.check(elStart);

      expect(elementStartValidate).toHaveBeenCalledWith(
         elStart,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed an element declaration', () => {
      (elementDeclarationPreprocess as jest.Mock).mockReturnValue({});
      (elementDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const elDecl = makeElementDeclaration();

      checker.check(elDecl);

      expect(elementDeclarationUpdateState).toHaveBeenCalledWith(elDecl, {}, expect.any(Object));
   });

   it('validates an element declaration', () => {
      (elementDeclarationPreprocess as jest.Mock).mockReturnValue({});
      (elementDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const elDecl = makeElementDeclaration();
      checker.check(version);

      checker.check(elDecl);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         {},
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed an element end', () => {
      (elementEndUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const elementEnd = makeElementEnd();

      checker.check(elementEnd);

      expect(elementEndUpdateState).toHaveBeenCalledWith(elementEnd, expect.any(Object));
   });

   it('validates an element end', () => {
      (elementEndUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const elementEnd = makeElementEnd();

      checker.check(elementEnd);

      expect(elementEndValidate).toHaveBeenCalledWith(
         elementEnd,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed an elided entity declaration', () => {
      (elidedEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const peDecl = makeParameterEntityDeclaration();
      const elided = new ElidedEntityDeclarationPToken(peDecl, peDecl.value);

      checker.check(elided);

      expect(elidedEntityDeclarationUpdateState).toHaveBeenCalledWith(elided, expect.any(Object));
   });

   it('updates the state when passed an elided entity declaration', () => {
      const peDecl = makeParameterEntityDeclaration();
      const elided = new ElidedEntityDeclarationPToken(peDecl, peDecl.value);

      checker.check(elided);

      expect(entityDeclarationValueValidate).toHaveBeenCalledWith(
         elided,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed an external subset end', () => {
      (externalSubsetEndUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const esSSEnd = makeExternalSubsetEnd();

      checker.check(esSSEnd);

      expect(externalSubsetEndUpdateState).toHaveBeenCalledWith(esSSEnd, expect.any(Object));
   });

   it('updates the state when passed an external subset start', () => {
      (externalSubsetStartUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const esSSStart = makeExternalSubsetStart();

      checker.check(esSSStart);

      expect(externalSubsetStartUpdateState).toHaveBeenCalledWith(esSSStart, expect.any(Object));
   });

   it('validates a general entity declaration', () => {
      (generalEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const geDecl = makeGeneralEntityDeclaration();

      checker.check(geDecl);

      expect(entityDeclarationValidate).toHaveBeenCalledWith(
         geDecl,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed a general entity declaration', () => {
      (generalEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const geDecl = makeGeneralEntityDeclaration();

      checker.check(geDecl);

      expect(generalEntityDeclarationUpdateState).toHaveBeenCalledWith(geDecl, expect.any(Object));
   });

   it('validates the state at the end of a DTD', () => {
      checker.check(makeDocTypeEnd());

      expect(docTypeEndValidate).toHaveBeenCalledWith(
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('validates an general entity reference', () => {
      const geRef = makeGeneralEntityReference();

      checker.check(geRef);

      expect(generalEntityReferenceValidate).toHaveBeenCalledWith(
         geRef,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed a notation declaration', () => {
      (notationDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const notationDecl = makeNotationDeclaration();

      checker.check(notationDecl);

      expect(notationDeclarationUpdateState).toHaveBeenCalledWith(notationDecl, expect.any(Object));
   });

   it('validates a notation declaration', () => {
      (notationDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const notationDecl = makeNotationDeclaration();

      checker.check(notationDecl);

      expect(notationDeclarationValidate).toHaveBeenCalledWith(
         notationDecl,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('validates a general entity declaration', () => {
      (parameterEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const peDecl = makeParameterEntityDeclaration();

      checker.check(peDecl);

      expect(entityDeclarationValidate).toHaveBeenCalledWith(
         peDecl,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('validates an general entity start', () => {
      const geStart = makeGeneralEntityStart();

      checker.check(geStart);

      expect(generalEntityStartValidate).toHaveBeenCalledWith(
         geStart,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('validates an parameter entity reference', () => {
      const peRef = makeParameterEntityReference();

      checker.check(peRef);

      expect(parameterEntityReferenceValidate).toHaveBeenCalledWith(
         peRef,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed a parameter entity declaration', () => {
      (parameterEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const peDecl = makeParameterEntityDeclaration();

      checker.check(peDecl);

      expect(parameterEntityDeclarationUpdateState).toHaveBeenCalledWith(
         peDecl,
         expect.any(Object),
      );
   });

   it('validates an parameter entity start', () => {
      const peStart = makeParameterEntityStart();

      checker.check(peStart);

      expect(parameterEntityStartValidate).toHaveBeenCalledWith(
         peStart,
         expect.any(Object),
         expect.any(ProblemCollector),
      );
   });

   it('updates the state when passed an XML Declaration', () => {
      (xmlDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const xmlDecl = makeXmlDecl();

      checker.check(xmlDecl);

      expect(xmlDeclarationUpdateState).toHaveBeenCalledWith(xmlDecl, expect.any(Object));
   });

   it('will not update the state twice when called with two XML Declarations', () => {
      (xmlDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidityState());
      const xmlDecl = makeXmlDecl();

      checker.check(xmlDecl);
      checker.check(xmlDecl);

      expect(xmlDeclarationUpdateState).toHaveBeenCalledTimes(1);
   });
});
