/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { toSToken } from 'sToken';
import { ConditionalClosePToken, ConditionalPToken, ElidedEntityDeclarationPToken } from 'token';
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
   makeProcessingInstruction,
   makeXmlDecl,
} from 'token-test';

import { ElDeclType, ValidateState } from '../validateState';
import { ValidityChecker } from '../ValidityChecker';
import { attListDeclarationUpdateState } from '../token/attListDeclarationUpdateState';
import { attListDeclarationValidate } from '../token/attListDeclarationValidate';
import { conditionalEndUpdateState } from '../token/conditionalEndUpdateState';
import { conditionalEndValidate } from '../token/conditionalEndValidate';
import { conditionalStartUpdateState } from '../token/conditionalStartUpdateState';
import { conditionalStartValidate } from '../token/conditionalStartValidate';
import { docTypeStartUpdateState } from '../token/docTypeStartUpdateState';
import { dtdEndValidate } from '../token/dtdEndValidate';
import { elementDeclarationUpdateState } from '../token/elementDeclarationUpdateState';
import { elementDeclarationPreprocess } from '../token/elementDeclarationPreprocess';
import { elementDeclarationValidate } from '../token/elementDeclarationValidate';
import { elementEndUpdateState } from '../token/elementEndUpdateState';
import { elementEndValidate } from '../token/elementEndValidate';
import { elementStartUpdateState } from '../token/elementStartUpdateState';
import { elementStartValidate } from '../token/elementStartValidate';
import { elidedEntityDeclarationUpdateState } from '../token/elidedEntityDeclarationUpdateState';
import { entityDeclarationValidate } from '../token/entityDeclarationValidate';
import { externalSubsetStartUpdateState } from '../token/externalSubsetStartUpdateState';
import { externalSubsetEndUpdateState } from '../token/externalSubsetEndUpdateState';
import { generalEntityDeclarationUpdateState } from '../token/generalEntityDeclarationUpdateState';
import { generalEntityReferenceValidate } from '../token/generalEntityReferenceValidate';
import { generalEntityStartValidate } from '../token/generalEntityStartValidate';
import { notationDeclarationUpdateState } from '../token/notationDeclarationUpdateState';
import { notationDeclarationValidate } from '../token/notationDeclarationValidate';
import { parameterEntityDeclarationUpdateState } from '../token/parameterEntityDeclarationUpdateState';
import { parameterEntityReferenceValidate } from '../token/parameterEntityReferenceValidate';
import { parameterEntityStartValidate } from '../token/parameterEntityStartValidate';
import { xmlDeclarationUpdateState } from '../token/xmlDeclarationUpdateState';
import { validityConstraint } from '../error/validityConstraint';
import { ElementDeclarationPToken } from 'pToken';

const VID = validityConstraint.id;

jest.mock('../token/attListDeclarationValidate');
jest.mock('../token/attListDeclarationUpdateState');
jest.mock('../token/conditionalEndUpdateState');
jest.mock('../token/conditionalEndValidate');
jest.mock('../token/conditionalStartUpdateState');
jest.mock('../token/conditionalStartValidate');
jest.mock('../token/docTypeStartUpdateState');
jest.mock('../token/dtdEndValidate');
jest.mock('../token/elementDeclarationUpdateState');
jest.mock('../token/elementDeclarationPreprocess');
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
   let ec: MockErrorCollector;
   let elementDeclarationUpdateStateMock: jest.MockedFunction<typeof elementDeclarationUpdateState>;
   let conditionalStartUpdateStateMock: jest.MockedFunction<typeof conditionalStartUpdateState>;
   let conditionalEndUpdateStateMock: jest.MockedFunction<typeof conditionalEndUpdateState>;

   beforeEach(async () => {
      version = new ConformanceVersion();
      checker = new ValidityChecker();
      ec = new MockErrorCollector();

      elementDeclarationUpdateStateMock = elementDeclarationUpdateState as jest.MockedFunction<
         typeof elementDeclarationUpdateState
      >;
      conditionalStartUpdateStateMock = conditionalStartUpdateState as jest.MockedFunction<
         typeof conditionalStartUpdateState
      >;
      conditionalEndUpdateStateMock = conditionalEndUpdateState as jest.MockedFunction<
         typeof conditionalEndUpdateState
      >;
      elementDeclarationUpdateStateMock.mockImplementation((token, details, state) => state);
      conditionalEndUpdateStateMock.mockImplementation((token, state) => state);
      conditionalStartUpdateStateMock.mockImplementation((token, state) => state);
   });

   it('stores the version passed to it and pass that on to other validations', () => {
      (elementDeclarationPreprocess as jest.Mock).mockReturnValue({});
      (elementDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const elDecl = makeElementDeclaration();

      checker.checkPToken(version, ec);
      checker.checkPToken(elDecl, ec);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         {},
         expect.any(Object),
         ec,
         version,
      );
   });

   it('reports an error when the context is EMPTY, and any non-element end token is delivered (§3.0.0)', () => {
      const newState = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  isExternalMarkupDeclaration: false,
                  token: new ElementDeclarationPToken({
                     declType: toSToken('EMPTY'),
                     name: toSToken('elementName'),
                     open: toSToken('<!'),
                  }),
                  type: ElDeclType.EMPTY,
               },
               parentName: 'elementName',
               stateId: 0,
            },
            contextStack: [],
            pastEnd: false,
         },
      });
      (
         elementStartUpdateState as jest.MockedFunction<typeof elementStartUpdateState>
      ).mockReturnValue(newState);
      (elementEndUpdateState as jest.MockedFunction<typeof elementEndUpdateState>).mockReturnValue(
         newState,
      );

      checker.checkPToken(makeElementStart(), ec);
      checker.checkPToken(makeProcessingInstruction(), ec);

      // @ts-expect-error 2329/matchers
      expect(ec).toReportValidityError({
         id: VID.CONTENT_IN_EMPTY_ELEMENT,
         lastPosition: undefined,
         params: ['elementName'],
         position: makeProcessingInstruction().open,
      });
   });

   it('reports no error when the context is EMPTY, and an element end token is delivered (§3.0.0)', () => {
      const newState = new ValidateState({
         elementContext: {
            activeContext: {
               declDetails: {
                  isExternalMarkupDeclaration: false,
                  token: new ElementDeclarationPToken({
                     declType: toSToken('EMPTY'),
                     name: toSToken('elementName'),
                     open: toSToken('<!'),
                  }),
                  type: ElDeclType.EMPTY,
               },
               parentName: 'elementName',
               stateId: 0,
            },
            contextStack: [],
            pastEnd: false,
         },
      });
      (
         elementStartUpdateState as jest.MockedFunction<typeof elementStartUpdateState>
      ).mockReturnValue(newState);
      (elementEndUpdateState as jest.MockedFunction<typeof elementEndUpdateState>).mockReturnValue(
         newState,
      );

      checker.checkPToken(makeElementStart(), ec);
      checker.checkPToken(makeElementEnd(), ec);

      expect(ec.errors).toEqual([]);
   });

   it('stores only the first version passed to it', () => {
      (elementDeclarationPreprocess as jest.Mock).mockReturnValue({});
      (elementDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const elDecl = makeElementDeclaration();
      checker.checkPToken(version, ec);

      checker.checkPToken(new ConformanceVersion(1, 2), ec);
      checker.checkPToken(elDecl, ec);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         {},
         expect.any(Object),
         ec,
         version,
      );
   });

   it('validates an ATTLIST declaration', () => {
      (attListDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const attListDecl = makeAttListDeclaration();

      checker.checkPToken(attListDecl, ec);

      expect(attListDeclarationValidate).toHaveBeenCalledWith(attListDecl, expect.any(Object), ec);
   });

   it('updates the state when passed an ATTLIST declaration', () => {
      (attListDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const attListDecl = makeAttListDeclaration();

      checker.checkPToken(attListDecl, ec);

      expect(attListDeclarationUpdateState).toHaveBeenCalledWith(attListDecl, expect.any(Object));
   });

   it('updates the state for a conditional end', () => {
      const conditional = new ConditionalClosePToken({ open: toSToken('<![') });

      checker.checkPToken(conditional, ec);

      expect(conditionalEndUpdateState).toHaveBeenCalledWith(conditional, expect.any(Object));
   });

   it('validates a conditional end', () => {
      const conditional = new ConditionalClosePToken({ open: toSToken('<![') });

      checker.checkPToken(conditional, ec);

      expect(conditionalEndValidate).toHaveBeenCalledWith(conditional, expect.any(Object), ec);
   });

   it('validates a conditional start', () => {
      const conditional = new ConditionalPToken({ open: toSToken('<![') });
      checker.checkPToken(version, ec);

      checker.checkPToken(conditional, ec);

      expect(conditionalStartValidate).toHaveBeenCalledWith(conditional, expect.any(Object), ec);
   });

   it('updates the state for a conditional start', () => {
      const conditional = new ConditionalPToken({ open: toSToken('<![') });

      checker.checkPToken(conditional, ec);

      expect(conditionalStartUpdateState).toHaveBeenCalledWith(conditional, expect.any(Object));
   });

   it('updates the state when passed a docTypeStart', () => {
      (docTypeStartUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const docTypeStart = makeDocTypeStart();

      checker.checkPToken(docTypeStart, ec);

      expect(docTypeStartUpdateState).toHaveBeenCalledWith(docTypeStart, expect.any(Object));
   });

   it('updates the state when passed an element start', () => {
      (elementStartUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const elementEmpty = makeElementEmpty();

      checker.checkPToken(elementEmpty, ec);

      expect(elementStartUpdateState).toHaveBeenCalledWith(elementEmpty, expect.any(Object));
   });

   it('validates an element start', () => {
      (elementStartUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const elStart = makeElementStart();

      checker.checkPToken(elStart, ec);

      expect(elementStartValidate).toHaveBeenCalledWith(elStart, expect.any(Object), ec);
   });

   it('updates the state when passed an element declaration', () => {
      (elementDeclarationPreprocess as jest.Mock).mockReturnValue({});
      (elementDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const elDecl = makeElementDeclaration();

      checker.checkPToken(elDecl, ec);

      expect(elementDeclarationUpdateState).toHaveBeenCalledWith(elDecl, {}, expect.any(Object));
   });

   it('validates an element declaration', () => {
      (elementDeclarationPreprocess as jest.Mock).mockReturnValue({});
      (elementDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const elDecl = makeElementDeclaration();
      checker.checkPToken(version, ec);

      checker.checkPToken(elDecl, ec);

      expect(elementDeclarationValidate).toHaveBeenCalledWith(
         elDecl,
         {},
         expect.any(Object),
         ec,
         version,
      );
   });

   it('updates the state when passed an element end', () => {
      (elementEndUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const elementEnd = makeElementEnd();

      checker.checkPToken(elementEnd, ec);

      expect(elementEndUpdateState).toHaveBeenCalledWith(elementEnd, expect.any(Object));
   });

   it('validates an element end', () => {
      (elementEndUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const elementEnd = makeElementEnd();

      checker.checkPToken(elementEnd, ec);

      expect(elementEndValidate).toHaveBeenCalledWith(elementEnd, expect.any(Object), ec);
   });

   it('updates the state when passed an elided entity declaration', () => {
      (elidedEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const peDecl = makeParameterEntityDeclaration();
      const elided = new ElidedEntityDeclarationPToken(peDecl, peDecl.value); // typehack

      checker.checkPToken(elided, ec);

      expect(elidedEntityDeclarationUpdateState).toHaveBeenCalledWith(elided, expect.any(Object));
   });

   it('updates the state when passed an external subset end', () => {
      (externalSubsetEndUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const esSSEnd = makeExternalSubsetEnd();

      checker.checkPToken(esSSEnd, ec);

      expect(externalSubsetEndUpdateState).toHaveBeenCalledWith(esSSEnd, expect.any(Object));
   });

   it('updates the state when passed an external subset start', () => {
      (externalSubsetStartUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const esSSStart = makeExternalSubsetStart();

      checker.checkPToken(esSSStart, ec);

      expect(externalSubsetStartUpdateState).toHaveBeenCalledWith(esSSStart, expect.any(Object));
   });

   it('validates a general entity declaration', () => {
      (generalEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const geDecl = makeGeneralEntityDeclaration();

      checker.checkPToken(geDecl, ec);

      expect(entityDeclarationValidate).toHaveBeenCalledWith(geDecl, expect.any(Object), ec);
   });

   it('updates the state when passed a general entity declaration', () => {
      (generalEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
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
      (notationDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const notationDecl = makeNotationDeclaration();

      checker.checkPToken(notationDecl, ec);

      expect(notationDeclarationUpdateState).toHaveBeenCalledWith(notationDecl, expect.any(Object));
   });

   it('validates a notation declaration', () => {
      (notationDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const notationDecl = makeNotationDeclaration();

      checker.checkPToken(notationDecl, ec);

      expect(notationDeclarationValidate).toHaveBeenCalledWith(
         notationDecl,
         expect.any(Object),
         ec,
      );
   });

   it('validates a general entity declaration', () => {
      (parameterEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const peDecl = makeParameterEntityDeclaration();

      checker.checkPToken(peDecl, ec);

      expect(entityDeclarationValidate).toHaveBeenCalledWith(peDecl, expect.any(Object), ec);
   });

   it('validates an general entity start', () => {
      const geStart = makeGeneralEntityStart();

      checker.checkPToken(geStart, ec);

      expect(generalEntityStartValidate).toHaveBeenCalledWith(geStart, expect.any(Object), ec);
   });

   it('validates an parameter entity reference', () => {
      const peRef = makeParameterEntityReference();

      checker.checkPToken(peRef, ec);

      expect(parameterEntityReferenceValidate).toHaveBeenCalledWith(peRef, expect.any(Object), ec);
   });

   it('updates the state when passed a parameter entity declaration', () => {
      (parameterEntityDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const peDecl = makeParameterEntityDeclaration();

      checker.checkPToken(peDecl, ec);

      expect(parameterEntityDeclarationUpdateState).toHaveBeenCalledWith(
         peDecl,
         expect.any(Object),
      );
   });

   it('validates an parameter entity start', () => {
      const peStart = makeParameterEntityStart();

      checker.checkPToken(peStart, ec);

      expect(parameterEntityStartValidate).toHaveBeenCalledWith(peStart, expect.any(Object), ec);
   });

   it('updates the state when passed an XML Declaration', () => {
      (xmlDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const xmlDecl = makeXmlDecl();

      checker.checkPToken(xmlDecl, ec);

      expect(xmlDeclarationUpdateState).toHaveBeenCalledWith(xmlDecl, expect.any(Object));
   });

   it('will not update the state twice when called with two XML Declarations', () => {
      (xmlDeclarationUpdateState as jest.Mock).mockReturnValue(new ValidateState());
      const xmlDecl = makeXmlDecl();

      checker.checkPToken(xmlDecl, ec);
      checker.checkPToken(xmlDecl, ec);

      expect(xmlDeclarationUpdateState).toHaveBeenCalledTimes(1);
   });
});
