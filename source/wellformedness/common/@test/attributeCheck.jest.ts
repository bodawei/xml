/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ParamCollector } from 'basic-test';
import { GeneralEntityReferencePToken, TextPToken } from 'pToken';
import { SToken, toSToken } from 'basic';
import { AttributePToken } from 'token';

import { attributeLangCheck } from '../attributeLangCheck';
import { literalCheck } from '../literalCheck';
import { nameCheck } from '../nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { attributeCheck } from '../attributeCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { warningCodes } from '../../error/warningCodes';
import { errorCodes } from '../../error/errorCodes';

jest.mock('../attributeLangCheck');
jest.mock('../literalCheck');
jest.mock('../nameCheck');
jest.mock('../../common/nameXmlCheck');

const WFEID = wellFormedErrorCodes.id;
const EID = errorCodes.id;

describe('attributeCheck (unit)', () => {
   let attributesPChunk: Array<AttributePToken>;
   let confVer: ConformanceVersion;
   let collector: ParamCollector;
   let previousSpace: SToken;
   let mockLiteralCheck: jest.MockedFunction<typeof literalCheck>;

   beforeEach(() => {
      attributesPChunk = [
         {
            equal: toSToken('='),
            name: toSToken('version'),
            postEqualSpace: toSToken(' '),
            postNameSpace: toSToken(' '),
            trailingSpace: toSToken(' '),
            value: [],
         },
         {
            equal: toSToken('='),
            name: toSToken('another'),
            postEqualSpace: undefined,
            postNameSpace: undefined,
            trailingSpace: undefined,
            value: [],
         },
      ];

      confVer = new ConformanceVersion();
      previousSpace = toSToken(' ');
      collector = new ParamCollector();
      mockLiteralCheck = literalCheck as jest.MockedFunction<typeof literalCheck>;
   });

   it('calls the nameCheck() routine', () => {
      attributeCheck(attributesPChunk, collector, confVer, previousSpace, '');

      expect(nameCheck).toHaveBeenCalledWith(
         attributesPChunk[0].name,
         collector,
         confVer,
         WFEID.ATTRIBUTE_INVALID_NAME,
      );
   });

   it('calls the attributeLangCheck() routine', () => {
      attributesPChunk[0].name.str = 'xml:lang';
      attributeCheck(attributesPChunk, collector, confVer, previousSpace, WFEID.NOUN_ATTRIBUTE);

      expect(attributeLangCheck).toHaveBeenCalledWith(
         attributesPChunk[0].value,
         collector,
         confVer,
      );
   });

   it('reports an error if an xml:space attribute has a value other than preserve or default', () => {
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributeCheck(
         [
            {
               equal: toSToken('='),
               name: toSToken('xml:space'),
               value: [new TextPToken(toSToken('bogus'))],
            },
         ],
         collector,
         confVer,
         undefined,
         WFEID.NOUN_ATTRIBUTE,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFError({
         id: EID.XMLSPACE_INVALID_VALUE,
         lastPosition: toSToken('='),
         params: ['bogus'],
         position: undefined,
      });
   });

   it('reports no error if an xml:space attribute has a of default', () => {
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributeCheck(
         [
            {
               equal: toSToken('='),
               name: toSToken('xml:space'),
               value: [new TextPToken(toSToken('default'))],
            },
         ],
         collector,
         confVer,
         toSToken(' '),
         WFEID.NOUN_ATTRIBUTE,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if an xml:space attribute has a of preserve', () => {
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributeCheck(
         [
            {
               equal: toSToken('='),
               name: toSToken('xml:space'),
               value: [new TextPToken(toSToken('preserve'))],
            },
         ],
         collector,
         confVer,
         toSToken(' '),
         WFEID.NOUN_ATTRIBUTE,
      );

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('asks the literal module to look for problems in the declaration part', () => {
      attributeCheck(attributesPChunk, collector, confVer, previousSpace, WFEID.NOUN_ATTRIBUTE);

      const params = mockLiteralCheck.mock.calls[0];
      expect(params[0]).toEqual(attributesPChunk[0]);
      expect(params[1]).toEqual(collector);
      expect(params[2]).toEqual(confVer);
      expect(params[3]).toEqual(WFEID.NOUN_ATTRIBUTE);
      expect(params[4] instanceof Function).toEqual(true);
   });

   it('reports an error if there is no space before the first attribute name', () => {
      attributeCheck(attributesPChunk, collector, confVer, undefined, WFEID.NOUN_ATTRIBUTE);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
         params: ['version'],
         position: undefined,
      });
   });

   it('reports an error if there is no space between the first and second attrs', () => {
      delete attributesPChunk[0].trailingSpace;

      attributeCheck(attributesPChunk, collector, confVer, previousSpace, WFEID.NOUN_ATTRIBUTE);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
         lastPosition: attributesPChunk[0].postEqualSpace,
         params: ['another'],
      });
   });

   it('calls the nameXmlCheck() function', () => {
      attributeCheck(
         attributesPChunk,
         collector,
         confVer,
         previousSpace,
         WFEID.NOUN_ATTRIBUTE,
         () => {},
      );

      expect(nameXmlCheck).toHaveBeenCalledWith(
         attributesPChunk[0].name,
         collector,
         confVer,
         'ATTRIBUTE',
         warningCodes.id.ATTRIBUTE_NAME_XMLCOLON_RESERVED,
         warningCodes.id.ATTRIBUTE_NAME_XML_RESERVED,
      );
   });

   it('calls the checkName function, if provided', () => {
      const checkName = jest.fn();

      attributeCheck(
         attributesPChunk,
         collector,
         confVer,
         previousSpace,
         WFEID.NOUN_ATTRIBUTE,
         checkName,
      );

      expect(checkName).toHaveBeenCalledWith(attributesPChunk[0].name, 0, collector, confVer);
   });

   it('calls the checkValue function, if provided', () => {
      const checkValue = jest.fn();
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributeCheck(
         attributesPChunk,
         collector,
         confVer,
         previousSpace,
         WFEID.NOUN_ATTRIBUTE,
         undefined,
         checkValue,
      );

      expect(checkValue).toHaveBeenCalledWith(
         attributesPChunk[0].name,
         attributesPChunk[0].value,
         collector,
         confVer,
      );
   });

   it('reports an error if there is no "=" found', () => {
      delete attributesPChunk[0].equal;

      attributeCheck(attributesPChunk, collector, confVer, previousSpace, WFEID.NOUN_ATTRIBUTE);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_NO_EQUAL,
         lastPosition: attributesPChunk[0].postNameSpace,
         params: ['version'],
      });
   });

   it('reports an error if attributes have duplicate names', () => {
      attributesPChunk[1].name.str = attributesPChunk[0].name.str;

      attributeCheck(attributesPChunk, collector, confVer, previousSpace, WFEID.NOUN_ATTRIBUTE);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_DUPLICATE_NAME,
         params: ['version'],
         position: attributesPChunk[1].name,
      });
   });

   it('reports no error if there is a duplicate name but it is not an attribute', () => {
      attributesPChunk[1].name.str = attributesPChunk[0].name.str;

      attributeCheck(attributesPChunk, collector, confVer, previousSpace, 'other');

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if there is a "<" in the attribute value', () => {
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributesPChunk[1].value = [
         new TextPToken({ text: toSToken('foo') }),
         new GeneralEntityReferencePToken({ open: toSToken('&') }),
         new TextPToken({ text: toSToken('t<o') }),
      ];

      attributeCheck(attributesPChunk, collector, confVer, previousSpace, WFEID.NOUN_ATTRIBUTE);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTRIBUTE_INVALID_VALUE,
         lastPosition: attributesPChunk[1].equal,
         params: ['another'],
      });
   });
});
