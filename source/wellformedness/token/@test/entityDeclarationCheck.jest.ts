/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { WellFormedError, XmlWarning } from 'error';
import { MockErrorCollector } from 'error-test';
import { GeneralEntityDeclarationPToken, ParameterEntityDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import * as externalId from '../../common/externalIdCheck';
import { nameCheck } from '../util/nameCheck';

import { entityDeclarationCheck } from '../entityDeclarationCheck';

// ick
import { TextPToken } from 'token';
import literal from '../../../token/common/literal';
import * as misc from '../../../token/common/misc';

jest.mock('../util/nameCheck');

describe('entityDeclarationCheck (unit)', () => {
   let genEntityDeclarationPToken: GeneralEntityDeclarationPToken;
   let paramEntityDeclarationPToken: ParameterEntityDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let miscWellFormedSpy: jest.MockedFunction<typeof misc.checkCharWellFormed>;
   let miscSpy: jest.MockedFunction<typeof misc.checkWellFormedNameRecommendation>;
   let externalIdSpy: jest.MockedFunction<typeof externalId.externalIdCheck>;

   beforeEach(() => {
      genEntityDeclarationPToken = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('anEntity'),
         nameSpace: toSToken(' '),
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      paramEntityDeclarationPToken = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         parameter: toSToken('%'),
         parameterSpace: toSToken(' '),
         name: toSToken('anEntity'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();
      miscSpy = jest.spyOn(misc, 'checkWellFormedNameRecommendation') as jest.MockedFunction<
         typeof misc.checkWellFormedNameRecommendation
      >;
      miscWellFormedSpy = jest.spyOn(misc, 'checkCharWellFormed') as jest.MockedFunction<
         typeof misc.checkCharWellFormed
      >;
      externalIdSpy = jest.spyOn(externalId, 'externalIdCheck') as jest.MockedFunction<
         typeof externalId.externalIdCheck
      >;
   });

   it('asks the literal module to look for problems in the declaration part', () => {
      const literalSpy = jest.spyOn(literal, 'checkWellFormed');

      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         value: [new TextPToken({ text: toSToken('yipes') })],
      });

      entityDeclarationCheck(pToken, mockErrorCollector, new ConformanceVersion());

      expect(literalSpy).toHaveBeenCalledWith(
         pToken,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.NOUN_ENTITYVALUE,
      );
   });

   it('reports an error if % is not followed by a space', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         parameterSpace: undefined,
      });

      entityDeclarationCheck(pToken, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE,
         params: ['anEntity'],
         position: undefined,
         lastPosition: pToken.parameter,
      });
   });

   it('reports an error if there is no name', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         name: undefined,
      });

      entityDeclarationCheck(pToken, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ENTITYDECL_NO_NAME,
         params: undefined,
         position: undefined,
         lastPosition: pToken.parameterSpace,
      });
   });

   it('calls nameCheck() to report on name validity', () => {
      entityDeclarationCheck(paramEntityDeclarationPToken, mockErrorCollector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         paramEntityDeclarationPToken.name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.ENTITYDECL_NAME_INVALID,
      );
   });

   it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
      entityDeclarationCheck(paramEntityDeclarationPToken, mockErrorCollector, confVer);

      expect(miscSpy).toHaveBeenCalledWith(
         paramEntityDeclarationPToken.name,
         mockErrorCollector,
         confVer,
         'ENTITY',
         XmlWarning.ID.ENTITYDECL_NAME_XMLDASH_RESERVED,
         XmlWarning.ID.ENTITYDECL_NAME_XML_RESERVED,
      );
   });

   it('reports an error if there is no space after the name', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         nameSpace: undefined,
      });

      entityDeclarationCheck(pToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE,
         params: ['anEntity'],
         position: undefined,
         lastPosition: pToken.name,
      });
   });

   it('calls externalId.entityDeclarationCheck() to check on the externalId', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         externalId: {},
      });

      entityDeclarationCheck(pToken, mockErrorCollector, confVer);

      expect(externalIdSpy).toHaveBeenCalledWith(pToken.externalId, mockErrorCollector, confVer);
   });

   it('reports an error if NDATA is the wrong case', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: {},
         nData: toSToken('nData'),
         nDataName: toSToken('foo'),
      });

      entityDeclarationCheck(pToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ENTITYDECL_NDATA_INVALID_CASE,
         params: ['anEntity', 'nData'],
         position: pToken.nData,
      });
   });

   it('reports an error if there is no NDATA value', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: {},
         nData: toSToken('nData'),
      });

      entityDeclarationCheck(pToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ENTITYDECL_NDATA_NO_NAME,
         params: ['anEntity'],
         lastPosition: pToken.nData,
      });
   });

   it('calls checkCharWellFormed() to check on the ndata value', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: {},
         nData: toSToken('nData'),
         nDataName: toSToken('nDataName'),
      });

      entityDeclarationCheck(pToken, mockErrorCollector, confVer);

      expect(miscWellFormedSpy).toHaveBeenCalledWith(pToken.nDataName, mockErrorCollector, confVer);
   });

   it('reports an error if there is no EnitytValue or ExternalID', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: undefined,
         externalIdSpace: undefined,
         value: undefined,
      });

      entityDeclarationCheck(pToken, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ENTITYDECL_NO_VALUE,
         params: ['anEntity'],
         lastPosition: pToken.nameSpace,
      });
   });

   it('reports an error if there was no closing', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         close: undefined,
      });

      entityDeclarationCheck(pToken, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ENTITYDECL_NO_CLOSE,
         params: ['anEntity'],
         position: undefined,
         lastPosition: pToken.nameSpace,
      });
   });

   it('reports an error when there is extra', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         extra: toSToken('fooo'),
      });

      entityDeclarationCheck(pToken, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ENTITYDECL_EXTRA_TEXT,
         params: ['fooo'],
         position: pToken.extra,
         lastPosition: undefined,
      });
   });
});
