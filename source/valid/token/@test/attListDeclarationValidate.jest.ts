/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion } from 'basic';

import { MockErrorCollector } from 'basic-test';
import { AttListDeclarationPToken } from 'pToken';
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

   describe('No Duplicate Tokens (§3.3.1)', () => {
      it('reports an error when a value is repeated in a NOTATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  enumeration: {
                     type: NOTATION_PTOKEN,
                     open: toSToken('('),
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  value: [],
               },
            ],
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_DUPLICATE_NOTATION,
            params: ['elName', 'att1', 'one'],
            position: toSToken('one'),
            lastPosition: undefined,
         });
      });

      it('reports an error when a value is repeated in an ENUMERATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            attDefs: [
               {
                  name: toSToken('att1'),
                  enumeration: {
                     type: NOTATION_PTOKEN,
                     open: toSToken('('),
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  value: [],
               },
            ],
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ATTLISTDECL_DUPLICATE_ENUMERATION,
            params: ['elName', 'att1', 'one'],
            position: toSToken('one'),
            lastPosition: undefined,
         });
      });

      it('reports no errors when a value is repeated in a NOTATION attribute declaration, but this is 1.0/2 (§3.3.1)', () => {
         state = new ValidateState({
            confVer: new ConformanceVersion(1.0, 2),
         });
         const attListDecl = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  enumeration: {
                     type: NOTATION_PTOKEN,
                     open: toSToken('('),
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('one'),
                        },
                     ],
                  },
                  value: [],
               },
            ],
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when no values are repeated in a NOTATION attribute declaration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  enumeration: {
                     type: NOTATION_PTOKEN,
                     open: toSToken('('),
                     words: [
                        {
                           word: toSToken('one'),
                        },
                        {
                           word: toSToken('two'),
                        },
                     ],
                  },
                  value: [],
               },
            ],
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when there is no enumeration (§3.3.1)', () => {
         const attListDecl = new AttListDeclarationPToken({
            open: toSToken('<!'),
            elementName: toSToken('elName'),
            attDefs: [
               {
                  name: toSToken('att1'),
                  type: toSToken('NOTATION'),
                  enumeration: undefined,
                  value: [],
               },
            ],
         });

         attListDeclarationValidate(attListDecl, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });
});
