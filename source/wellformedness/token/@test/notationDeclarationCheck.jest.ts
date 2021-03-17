/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { NotationDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { WellFormedError } from '../../error/WellFormedError';
import * as nameCheck from '../../common/nameCheck';
import misc from '../../../token/common/misc'; // ick

import * as externalId from '../../common/externalIdCheck';
import { notationDeclarationCheck } from '../notationDeclarationCheck';

describe('notationdeDeclaration (unit)', () => {
   let notationPToken: NotationDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),

         openSpace: undefined,
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      confVer = new ConformanceVersion();
      mockErrorCollector = new MockErrorCollector();
      jest.spyOn(externalId, 'externalIdCheck').mockImplementation();
      jest.spyOn(nameCheck, 'nameCheck').mockImplementation();
      jest.spyOn(misc, 'checkWellFormedNameRecommendation').mockImplementation();
   });

   it('asks the externalId module to look for well formed problems', () => {
      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(externalId.externalIdCheck).toHaveBeenCalledWith(
         notationPToken.externalId,
         true,
         mockErrorCollector,
         confVer,
      );
   });

   it('calls nameCheck() to report on bad names', () => {
      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(nameCheck.nameCheck).toHaveBeenCalledWith(
         notationPToken.name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.NOTATIONDECL_NAME_INVALID,
      );
   });

   it('calls misc.checkWellFormedNameRecommendation() to report on bad names', () => {
      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(
         notationPToken.name,
         mockErrorCollector,
         confVer,
         'NOTATION',
         XmlWarning.ID.NOTATIONDECL_NAME_XMLDASH_RESERVED,
         XmlWarning.ID.NOTATIONDECL_NAME_XML_RESERVED,
      );
   });

   it('reports an error if there is an extra opening space', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.NOTATIONDECL_OPEN_XTRA_SPACE_AFTER,
         params: undefined,
         position: notationPToken.openSpace,
      });
   });

   it('reports an error if notation is not capitalized', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('notation'),
      });

      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.NOTATIONDECL_DECLTYPE_INVALID,
         params: ['notation'],
         position: notationPToken.declType,
      });
   });

   it('reports an error if there is no name', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: undefined,
      });

      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.NOTATIONDECL_NO_NAME,
         params: undefined,
         position: undefined,
         lastPosition: notationPToken.declType,
      });
   });

   it('reports an error if there is no space after the name', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: undefined,
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.NOTATIONDECL_NAME_NO_SPACE,
         params: ['notationName'],
         position: undefined,
         lastPosition: notationPToken.name,
      });
   });

   it('reports an error if there is no external ID', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: undefined,
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
      });

      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.NOTATIONDECL_NO_EXTERNALID,
         params: undefined,
         position: notationPToken.nameSpace,
      });
   });

   it('reports an error if there was no closing', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         close: undefined,
      });

      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.NOTATIONDECL_NO_CLOSE,
         params: [notationPToken.name!.str],
         position: undefined,
         lastPosition: notationPToken.externalIdSpace,
      });
   });

   it('reports an error if there are extras', () => {
      notationPToken = new NotationDeclarationPToken({
         open: toSToken('<!'),
         openSpace: toSToken(' '),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         close: toSToken('>'),
         extra: toSToken('foo'),
      });

      notationDeclarationCheck(notationPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.NOTATIONDECL_EXTRA_TEXT,
         params: ['foo'],
         position: notationPToken.extra,
      });
   });
});
