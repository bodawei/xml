/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';

import { MockErrorCollector } from 'basic-test';
import { AttListDeclarationPToken, ParameterEntityReferencePToken } from 'pToken';
import { toSToken } from 'sToken';
import { NOTATION_PTOKEN } from 'token';

import { validityConstraint } from '../../error/validityConstraint';
import { ValidateState } from '../../validateState';
import { attListDeclarationValidate } from '../attListDeclarationValidate';

const VID = validityConstraint.id;

describe('attListDeclarationValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      state = new ValidateState({});
   });

   describe('Proper Declaration/PE Nesting (§2.8.0)', () => {
      it('reports an error if a markup-internal PERef has been expanded and included the trailing > (§2.8.0)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            extra: toSToken('>'),
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.PEREF_INVALID_END_NESTING,
            lastPosition: undefined,
            params: ['ATTLIST'],
            position: attListDecl.open,
         });
      });

      it('reports no error if a markup-internal PERef has been expanded and included no extra text (§2.8.0)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('CDATA'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            extra: false,
            open: toSToken('<!'),
            unexpanded: {
               propName: 'name',
               tokens: [new ParameterEntityReferencePToken({ open: toSToken('%') })],
            },
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);
         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   describe('ID Attribute Default (§3.3.1)', () => {
      it('reports an error when there is no default for an ID attribute (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_ID_BAD_DEFAULT,
            lastPosition: toSToken('ID'),
            params: ['elName', 'att1', ''],
            position: undefined,
         });
      });

      it('reports an error when the default for an ID attribute is #FIXED (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  defaultType: toSToken('#FIXED'),
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_ID_BAD_DEFAULT,
            lastPosition: undefined,
            params: ['elName', 'att1', '#FIXED'],
            position: toSToken('#FIXED'),
         });
      });

      it('reports no error when the default for an ID attribute is #REQUIRED (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  defaultType: toSToken('#REQUIRED'),
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when the default for an ID attribute is #IMPLIED (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  defaultType: toSToken('#IMPLIED'),
                  name: toSToken('att1'),
                  type: toSToken('ID'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   describe('No Duplicate Tokens (§3.3.1)', () => {
      it('reports an error when a value is repeated in a NOTATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_DUPLICATE_NOTATION,
            lastPosition: undefined,
            params: ['elName', 'att1', 'one'],
            position: toSToken('one'),
         });
      });

      it('reports an error when a value is repeated in an ENUMERATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_DUPLICATE_ENUMERATION,
            lastPosition: undefined,
            params: ['elName', 'att1', 'one'],
            position: toSToken('one'),
         });
      });

      it('reports no errors when a value is repeated in a NOTATION attribute declaration, but this is 1.0/2 (§3.3.1)', () => {
         state = new ValidateState({
            confVer: new ConformanceVersion(1.0, 2),
         });
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when no values are repeated in a NOTATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: {
                     open: toSToken('('),
                     type: NOTATION_PTOKEN,
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('two'),
                        },
                     ],
                  },
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when there is no enumeration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            attDefs: [
               {
                  enumeration: undefined,
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  value: [],
               },
            ],
            elementName: toSToken('elName'),
            open: toSToken('<!'),
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });
});
