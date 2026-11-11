/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import { ContentModelP, ElementDeclarationPToken } from 'pToken';

import { contentModelCheck } from '../../common/contentModelCheck';
import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { warningCodes } from '../../error/warningCodes';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { elementDeclarationCheck } from '../elementDeclarationCheck';

jest.mock('../../common/contentModelCheck');
jest.mock('../../common/nameCheck');
jest.mock('../../common/nameXmlCheck');
jest.mock('../../common/nameXmlCheck');

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('elementDeclarationCheck()', () => {
   let collector: ParamCollector;
   let confVer: ConformanceVersion;
   let elementDeclaration: ElementDeclarationPToken;

   beforeEach(() => {
      confVer = new ConformanceVersion();
      collector = new ParamCollector();
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

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_OPEN_XTRA_SPACE_AFTER,
         lastPosition: undefined,
         params: [],
         position: elementDeclaration.openSpace,
      });
   });

   it('reports an error if the declType is not "ELEMENT"', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         declType: toSToken('Element'),
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_DECLTYPE_INVALID,
         lastPosition: undefined,
         params: ['Element'],
         position: elementDeclaration.declType,
      });
   });

   it('reports an error if there is no space after declType', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         declTypeSpace: undefined,
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_DECLTYPE_NO_SPACE,
         lastPosition: elementDeclaration.declType,
         params: [],
         position: undefined,
      });
   });

   it('reports an error if there is no name', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         name: undefined,
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_NO_NAME,
         lastPosition: elementDeclaration.declTypeSpace,
         params: [],
         position: undefined,
      });
   });

   it('calls nameCheck() to report on bad names', () => {
      elementDeclarationCheck(elementDeclaration, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         elementDeclaration.name,
         collector,
         confVer,
         WFEID.ELEMENTDECL_NAME_INVALID,
      );
   });

   it('calls nameXmlCheck() to report on bad names', () => {
      elementDeclarationCheck(elementDeclaration, collector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
         elementDeclaration.name,
         collector,
         confVer,
         'ELEMENT',
         WID.ELEMENTDECL_NAME_XMLCOLON_RESERVED,
         WID.ELEMENTDECL_NAME_XML_RESERVED,
      );
   });

   it('reports an error if there is no space after the name', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         nameSpace: undefined,
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_NAME_NO_SPACE,
         lastPosition: elementDeclaration.name,
         params: ['elementName'],
         position: undefined,
      });
   });

   it('reports an error if there was no content spec at all', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: undefined,
         contentSpec: undefined,
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_NO_SPEC,
         lastPosition: elementDeclaration.nameSpace,
         params: ['elementName'],
         position: undefined,
      });
   });

   it('reports an error if the content spec was an invalid value', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentSpec: toSToken('XYZ'),
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_SPEC_UNKNOWN,
         params: ['elementName', 'XYZ'],
         position: elementDeclaration.contentSpec,
      });
   });

   it('reports an error if the content spec was cased wrong', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentSpec: toSToken('any'),
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_SPEC_INVALID_CASE,
         params: ['elementName', 'ANY', 'any'],
         position: elementDeclaration.contentSpec,
      });
   });

   it('reports an error if there was no closing', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         close: undefined,
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_NO_CLOSE,
         lastPosition: elementDeclaration.nameSpace,
         params: ['elementName'],
         position: undefined,
      });
   });

   it('calls contentModelCheck() if there are contentModel', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         contentModel: new ContentModelP({}),
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      expect(contentModelCheck).toHaveBeenCalledWith(
         new ContentModelP({}),
         collector,
         confVer,
         true,
      );
   });

   it('reports an error if there is extra', () => {
      elementDeclaration = new ElementDeclarationPToken(elementDeclaration, {
         extra: toSToken('foo'),
      });

      elementDeclarationCheck(elementDeclaration, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ELEMENTDECL_EXTRA_TEXT,
         lastPosition: undefined,
         params: ['foo'],
         position: elementDeclaration.extra,
      });
   });
});
