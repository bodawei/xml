/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { NotationDeclarationPToken } from 'pToken';

import { externalIdCheck } from '../../common/externalIdCheck';
import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { warningCodes } from '../../error/warningCodes';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { notationDeclarationCheck } from '../notationDeclarationCheck';

jest.mock('../../common/nameCheck');
jest.mock('../../common/nameXmlCheck');
jest.mock('../../common/externalIdCheck');

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('notationdeDeclaration (unit)', () => {
   let notationPToken: NotationDeclarationPToken;
   let collector: ParamCollector;
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
      collector = new ParamCollector();
   });

   it('asks the externalId module to look for well formed problems', () => {
      notationDeclarationCheck(notationPToken, collector, confVer);

      expect(externalIdCheck).toHaveBeenCalledWith(
         notationPToken.externalId,
         true,
         collector,
         confVer,
      );
   });

   it('calls nameCheck() to report on bad names', () => {
      notationDeclarationCheck(notationPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         notationPToken.name,
         collector,
         confVer,
         WFEID.NOTATIONDECL_NAME_INVALID,
      );
   });

   it('calls nameXmlCheck() to report on bad names', () => {
      notationDeclarationCheck(notationPToken, collector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
         notationPToken.name,
         collector,
         confVer,
         'NOTATION',
         WID.NOTATIONDECL_NAME_XMLDASH_RESERVED,
         WID.NOTATIONDECL_NAME_XML_RESERVED,
      );
   });

   it('reports an error if there is an extra opening space', () => {
      notationPToken = new NotationDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         externalId: {},
         externalIdSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      });

      notationDeclarationCheck(notationPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.NOTATIONDECL_OPEN_XTRA_SPACE_AFTER,
         params: [],
         position: notationPToken.openSpace,
      });
   });

   it('reports an error if notation is not capitalized', () => {
      notationPToken = new NotationDeclarationPToken({
         declType: toSToken('notation'),
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      });

      notationDeclarationCheck(notationPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.NOTATIONDECL_DECLTYPE_INVALID,
         params: ['notation'],
         position: notationPToken.declType,
      });
   });

   it('reports an error if there is no name', () => {
      notationPToken = new NotationDeclarationPToken({
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         name: undefined,
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      });

      notationDeclarationCheck(notationPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.NOTATIONDECL_NO_NAME,
         params: [],
         position: undefined,
         lastPosition: notationPToken.declType,
      });
   });

   it('reports an error if there is no space after the name', () => {
      notationPToken = new NotationDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('NOTATION'),
         declTypeSpace: toSToken(' '),
         externalIdSpace: toSToken(' '),
         name: toSToken('notationName'),
         nameSpace: undefined,
         open: toSToken('<!'),
         openSpace: toSToken(' '),
      });

      notationDeclarationCheck(notationPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.NOTATIONDECL_NAME_NO_SPACE,
         lastPosition: notationPToken.name,
         params: ['notationName'],
         position: undefined,
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

      notationDeclarationCheck(notationPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.NOTATIONDECL_NO_EXTERNALID,
         params: [],
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

      notationDeclarationCheck(notationPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.NOTATIONDECL_NO_CLOSE,
         lastPosition: notationPToken.externalIdSpace,
         params: [notationPToken.name!.str],
         position: undefined,
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

      notationDeclarationCheck(notationPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.NOTATIONDECL_EXTRA_TEXT,
         params: ['foo'],
         position: notationPToken.extra,
      });
   });
});
