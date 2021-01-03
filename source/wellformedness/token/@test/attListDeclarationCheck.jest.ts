/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, Range, EntityId } from 'basic';
import { WellFormedError, XmlWarning } from 'error';
import { MockErrorCollector } from 'error-test';
import { AttListDeclarationPToken } from 'pToken';
import { SToken, toSToken } from 'sToken';

import { attListDeclarationCheck } from '../attListDeclarationCheck';

//ick
import literal from '../../../token/common/literal';
import misc from '../../../token/common/misc';
import { WordListPToken, WordListType } from 'token';

describe('attListDeclarationCheck()', () => {
   let mockErrorCollector: MockErrorCollector;
   let confVer: ConformanceVersion;
   let aldPToken: AttListDeclarationPToken;

   beforeEach(() => {
      aldPToken = new AttListDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ATTLIST'),
         elementName: toSToken('elementName'),
         elementNameSpace: toSToken(' '),
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
         close: toSToken('>'),
      });

      mockErrorCollector = new MockErrorCollector();
      confVer = new ConformanceVersion();

      jest.spyOn(literal, 'checkWellFormed').mockImplementation();
      jest.spyOn(misc, 'checkName').mockImplementation();
      jest.spyOn(misc, 'checkWellFormedNameRecommendation').mockImplementation();
   });

   it('reports an error if the declaration type is not all caps', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         declType: toSToken('attlist'),
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_DECLTYPE_INVALID,
         params: ['attlist'],
         position: testToken.declType,
         lastPosition: undefined,
      });
   });

   it('reports an error if there is no element name', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         elementName: undefined,
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_NO_ELEMENT_NAME,
         params: undefined,
         position: undefined,
         lastPosition: testToken.declType,
      });
   });

   it('reports an error if there is no space after the element name and there are attdefs', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         elementNameSpace: undefined,
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ELEMENT_NAME_NO_TRAILING_SPACE,
         params: undefined,
         position: undefined,
         lastPosition: testToken.elementName,
      });
   });

   it('reports no error if there is no space after the element name and there are no attdefs', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         elementNameSpace: undefined,
         attDefs: [],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error if there are no attribute definitions', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('calls misc.checkName() to report on name validity', () => {
      attListDeclarationCheck(aldPToken, mockErrorCollector, confVer);

      expect(misc.checkName).toHaveBeenCalledWith(
         aldPToken.elementName,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.ATTLISTDECL_ELEMENT_NAME_INVALID,
      );
   });

   it('calls misc.checkName() to report on attribute name validity', () => {
      attListDeclarationCheck(aldPToken, mockErrorCollector, confVer);

      expect(misc.checkName).toHaveBeenCalledWith(
         aldPToken.attDefs[0].name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.ATTLISTDECL_ATTR_NAME_INVALID,
      );
   });

   it('calls misc.checkWellFormedNameRecommendation() to report on attribute name conformance', () => {
      attListDeclarationCheck(aldPToken, mockErrorCollector, confVer);

      expect(misc.checkWellFormedNameRecommendation).toHaveBeenCalledWith(
         aldPToken.attDefs[0].name,
         mockErrorCollector,
         confVer,
         'ATTRIBUTE',
         XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XMLCOLON_RESERVED,
         XmlWarning.ID.ATTRLISTDECL_ATTR_NAME_XML_RESERVED,
      );
   });

   it('reports a warning if the same attribute name is listed multiple times', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
            {
               name: toSToken('two'),
               value: [],
            },
            {
               name: new SToken('att1', 'att1', new Range(new EntityId(), 10, 0, 10, 15, 0, 15)),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportWarning({
         id: XmlWarning.ID.ATTLISTDECL_ATTR_NAME_DUPLICATE,
         params: ['att1'],
         position: testToken.attDefs[2].name,
      });
   });

   it('reports an error if there is no space after the attribute name', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: undefined,
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_NAME_NO_SPACE,
         params: ['att1', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].name,
      });
   });

   it('reports an error if an unknown type is provided', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: undefined,
               type: toSToken('bogus'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_TYPE_UNKNOWN,
         params: ['att1', 'elementName', 'bogus'],
         position: testToken.attDefs[0].type,
      });
   });

   it('reports no error if the type is CDATA', () => {
      attListDeclarationCheck(aldPToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is ID', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('ID'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is IDREF', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('IDREF'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is IDREFS', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('IDREFS'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is ENTITY', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('ENTITY'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is ENTITIES', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('ENTITIES'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is NMTOKEN', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NMTOKEN'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is NMTOKENS', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NMTOKENS'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is NOTATION', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         elementName: toSToken('BUG'),
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NOTATION'),
               typeSpace: toSToken(' '),
               enumeration: new WordListPToken(WordListType.NOTATION, {
                  open: toSToken('('),
                  words: [
                     {
                        word: toSToken('x'),
                     },
                  ],
                  close: toSToken(')'),
                  closeSpace: toSToken(' '),
               }),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports an error if an the type is miscased', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('cdata'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_TYPE_INVALID,
         params: ['att1', 'elementName', 'cdata'],
         position: testToken.attDefs[0].type,
      });
   });

   it('reports an error this an enumerated type but it has no name list', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_ATTTYPE,
         params: ['att1', 'elementName'],
         lastPosition: testToken.attDefs[0].nameSpace,
      });
   });

   it('calls enumeration.checkWellFormed() if this is an enumerated type', () => {
      const cwfSpy = jest.fn();
      const enumeration = new WordListPToken(WordListType.ENUMERATION, {
         open: toSToken(' '),
      });
      enumeration.checkWellFormed = cwfSpy;
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               enumeration,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(cwfSpy).toHaveBeenCalledWith(mockErrorCollector, confVer);
   });

   it('reports an error the enumeration does not end with a space', () => {
      const enumeration = new WordListPToken(WordListType.ENUMERATION, {
         open: toSToken(' '),
      });
      enumeration.checkWellFormed = () => {};
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               enumeration,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE,
         params: ['att1', 'elementName'],
         lastPosition: testToken.attDefs[0].nameSpace,
      });
   });

   it('reports an error if this is an NOTATION type but it has no name list', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NOTATION'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_NOTATION,
         params: ['att1', 'elementName'],
         position: testToken.attDefs[0].typeSpace,
      });
   });

   it('calls enumeration.checkWellFormed() if this is an NOTATION type', () => {
      const cwfSpy = jest.fn();
      const enumeration = new WordListPToken(WordListType.NOTATION, {
         open: toSToken(' '),
      });
      enumeration.checkWellFormed = cwfSpy;
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               enumeration,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(cwfSpy).toHaveBeenCalledWith(mockErrorCollector, confVer);
   });

   it('reports an error the NOTATION list does not end with a space', () => {
      const enumeration = new WordListPToken(WordListType.NOTATION, {
         open: toSToken(' '),
      });
      enumeration.checkWellFormed = () => {};
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NOTATION'),
               typeSpace: toSToken(' '),
               enumeration,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_NOTATION_SPACE,
         params: ['att1', 'elementName'],
         position: testToken.attDefs[0].typeSpace, // Should be the end of the name list, but mocked out
      });
   });

   it('reports an error if there is no space after the attribute type', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: undefined,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_TYPE_NO_SPACE,
         params: ['att1', 'CDATA', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].type,
      });
   });

   it('reports an error if an unknown defaultType is provided', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#IMPLICIT'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN,
         params: ['att1', 'elementName', '#IMPLICIT'],
         position: testToken.attDefs[0].defaultType,
      });
   });

   it('reports no error if the type is #REQUIRED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is #IMPLIED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#IMPLIED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports no error if the type is #FIXED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#FIXED'),
               defaultTypeSpace: toSToken(' '),
               openQuote: toSToken('"'),
               closeQuote: toSToken('"'),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports an error if an the default type is miscased', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#required'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_DEFAULT_INVALID,
         params: ['att1', 'elementName', '#required'],
         position: testToken.attDefs[0].defaultType,
      });
   });

   it('reports an error if there is no space after a fixed type', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#FIXED'),
               defaultTypeSpace: undefined,
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_FIXED_NO_SPACE,
         params: ['att1', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].defaultType,
      });
   });

   it('reports an error if there is no value and no defaultType', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: undefined,
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: undefined,
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_NO_VALUE,
         params: ['att1', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].typeSpace,
      });
   });

   it('reports an error if there is no value after a #FIXED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#FIXED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_FIXED_NO_VALUE,
         params: ['att1', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].defaultTypeSpace,
      });
   });

   it('calls literal.checkWellFormed() with the attribute data', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#FIXED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      expect(literal.checkWellFormed).toHaveBeenCalledWith(
         testToken.attDefs[0],
         mockErrorCollector,
         confVer,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );
   });

   it('reports an error if there is a value after a #REQUIRED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_ATTR_EXTRA_VALUE,
         params: ['att1', 'elementName'],
         position: testToken.attDefs[0].openQuote,
      });
   });

   it('reports an error if there is no close', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         close: undefined,
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_NO_CLOSE,
         params: ['elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].defaultTypeSpace,
      });
   });

   it('reports an error if there is extra text after unassigned', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         extra: toSToken('CDATA'),
      });

      attListDeclarationCheck(testToken, mockErrorCollector, confVer);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportError({
         id: WellFormedError.ID.ATTLISTDECL_EXTRA_TEXT,
         params: ['CDATA'],
         position: testToken.extra,
         lastPosition: undefined,
      });
   });
});
