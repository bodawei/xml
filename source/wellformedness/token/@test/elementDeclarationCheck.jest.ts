/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { ElementDeclarationPToken } from '../../../pToken/token/elementDeclaration';
import { toSToken } from 'sToken';

import { WellFormedError } from '../../error/WellFormedError';
import { nameCheck } from '../util/nameCheck';

import { elementDeclarationCheck } from '../elementDeclarationCheck';
import { contentModelCheck } from '../../common/contentModelCheck';

// ick
import misc from '../../../token/common/misc';
import { ContentModelP } from 'pToken';

jest.mock('../../../token/common/misc');
jest.mock('../../common/contentModelCheck');
jest.mock('../util/nameCheck');

describe('elementDeclarationCheck()', () => {
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let elementDeclaration: ElementDeclarationPToken;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         openSpace: undefined,
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken('\t'),
         name: toSToken('elementName'),
         nameSpace: toSToken('\n'),
         close: toSToken('>'),
      });
   });

   it('reports an error if there is a space after the open', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         openSpace: toSToken(' '),
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_OPEN_XTRA_SPACE_AFTER,
         params: undefined,
         position: elementDeclaration.openSpace,
         lastPosition: undefined,
      });
   });

   it('reports an error if the declType is not "ELEMENT"', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         declType: toSToken('Element'),
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_DECLTYPE_INVALID,
         params: ['Element'],
         position: elementDeclaration.declType,
         lastPosition: undefined,
      });
   });

   it('reports an error if there is no space after declType', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         declTypeSpace: undefined,
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_DECLTYPE_NO_SPACE,
         params: undefined,
         position: undefined,
         lastPosition: elementDeclaration.declType,
      });
   });

   it('reports an error if there is no name', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         name: undefined,
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_NO_NAME,
         params: undefined,
         position: undefined,
         lastPosition: elementDeclaration.declTypeSpace,
      });
   });

   it('calls nameCheck() to report on bad names', () => {
      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         elementDeclaration.name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.ELEMENTDECL_NAME_INVALID,
      );
   });

   it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(
         elementDeclaration.name,
         mockErrorCollector,
         confVer,
         'ELEMENT',
         XmlWarning.ID.ELEMENTDECL_NAME_XMLCOLON_RESERVED,
         XmlWarning.ID.ELEMENTDECL_NAME_XML_RESERVED,
      );
   });

   it('reports an error if there is no space after the name', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         nameSpace: undefined,
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_NAME_NO_SPACE,
         params: ['elementName'],
         position: undefined,
         lastPosition: elementDeclaration.name,
      });
   });

   it('reports an error if there was no content spec at all', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentSpec: undefined,
         contentModel: undefined,
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_NO_SPEC,
         params: ['elementName'],
         position: undefined,
         lastPosition: elementDeclaration.nameSpace,
      });
   });

   it('reports an error if the content spec was an invalid value', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentSpec: toSToken('XYZ'),
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_SPEC_UNKNOWN,
         params: ['elementName', 'XYZ'],
         position: elementDeclaration.contentSpec,
      });
   });

   it('reports an error if the content spec was cased wrong', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentSpec: toSToken('any'),
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_SPEC_INVALID_CASE,
         params: ['elementName', 'ANY', 'any'],
         position: elementDeclaration.contentSpec,
      });
   });

   it('reports an error if there was no closing', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         close: undefined,
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_NO_CLOSE,
         params: ['elementName'],
         position: undefined,
         lastPosition: elementDeclaration.nameSpace,
      });
   });

   it('calls nameList.checkWellFormed() if there are contentModel', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: new ContentModelP({}),
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(contentModelCheck).toHaveBeenCalledWith(
         new ContentModelP({}),
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if there is extra', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         extra: toSToken('foo'),
      });

      elementDeclarationCheck(elementDeclaration, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ELEMENTDECL_EXTRA_TEXT,
         params: ['foo'],
         position: elementDeclaration.extra,
         lastPosition: undefined,
      });
   });
});
