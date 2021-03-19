/* Copyright ® 2019-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import {
   TextPToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
} from 'pToken';
import { toSToken } from 'sToken';

import { charCheck } from '../../common/charCheck';
import { externalIdCheck } from '../../common/externalIdCheck';
import { literalCheck } from '../../common/literalCheck';
import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { WellFormedError } from '../../error/WellFormedError';

import { entityDeclarationCheck } from '../entityDeclarationCheck';

jest.mock('../../common/charCheck');
jest.mock('../../common/externalIdCheck');
jest.mock('../../common/literalCheck');
jest.mock('../../common/nameCheck');
jest.mock('../../common/nameXmlCheck');

describe('entityDeclarationCheck (unit)', () => {
   let genEntityDeclarationPToken: GeneralEntityDeclarationPToken;
   let paramEntityDeclarationPToken: ParameterEntityDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;

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
   });

   it('asks the literal module to look for problems in the declaration part', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         value: [new TextPToken({ text: toSToken('yipes') })],
      });

      entityDeclarationCheck(pToken, mockErrorCollector, new ConformanceVersion());

      expect(literalCheck).toHaveBeenCalledWith(
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

      expect(mockErrorCollector).toReportWFError({
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

      expect(mockErrorCollector).toReportWFError({
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

   it('calls nameXmlCheck() to report on bad names', () => {
      entityDeclarationCheck(paramEntityDeclarationPToken, mockErrorCollector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
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

      expect(mockErrorCollector).toReportWFError({
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

      expect(externalIdCheck).toHaveBeenCalledWith(
         pToken.externalId,
         false,
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if NDATA is the wrong case', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: {},
         nData: toSToken('nData'),
         nDataName: toSToken('foo'),
      });

      entityDeclarationCheck(pToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
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

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ENTITYDECL_NDATA_NO_NAME,
         params: ['anEntity'],
         lastPosition: pToken.nData,
      });
   });

   it('calls charCheck() to check on the ndata value', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: {},
         nData: toSToken('nData'),
         nDataName: toSToken('nDataName'),
      });

      entityDeclarationCheck(pToken, mockErrorCollector, confVer);

      expect(charCheck).toHaveBeenCalledWith(pToken.nDataName, mockErrorCollector, confVer);
   });

   it('reports an error if there was no closing', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         close: undefined,
      });

      entityDeclarationCheck(pToken, mockErrorCollector, new ConformanceVersion());

      expect(mockErrorCollector).toReportWFError({
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

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ENTITYDECL_EXTRA_TEXT,
         params: ['fooo'],
         position: pToken.extra,
         lastPosition: undefined,
      });
   });
});
