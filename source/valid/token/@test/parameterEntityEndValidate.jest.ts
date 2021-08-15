/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { MockErrorCollector } from 'basic-test';
import {
   AttListDeclarationPToken,
   ElementDeclarationPToken,
   NotationDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParseToken,
   ProcessingInstructionPToken,
} from 'pToken';
import { SToken, toSToken } from 'sToken';
import { CommentPToken } from 'token';
import {
   makeCharData,
   makeConditionalSection,
   makeParameterEntityEnd,
   makeParameterEntityStart,
} from 'token-test';

import { validCodes } from '../../error/validCodes';
import { ValidateState } from '../../common/validateState';
import { parameterEntityEndValidate } from '../parameterEntityEndValidate';

const VID = validCodes.id;

describe('parameterEntityEndValidate (unit)', () => {
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();

      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
         },
      });
   });

   const data = [
      [
         new AttListDeclarationPToken({
            open: toSToken('<!'),
         }),
         new AttListDeclarationPToken({
            close: toSToken('>'),
            open: toSToken('<!'),
         }),
         toSToken('<!'),
         'ATTLIST',
      ],
      [
         new ElementDeclarationPToken({
            open: toSToken('<!'),
         }),
         new ElementDeclarationPToken({
            close: toSToken('>'),
            open: toSToken('<!'),
         }),
         toSToken('<!'),
         'ELEMENT',
      ],
      [
         new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
         }),
         new ParameterEntityDeclarationPToken({
            close: toSToken('>'),
            open: toSToken('<!'),
         }),
         toSToken('<!'),
         'ENTITY',
      ],
      [
         new NotationDeclarationPToken({
            open: toSToken('<!'),
         }),
         new NotationDeclarationPToken({
            close: toSToken('>'),
            open: toSToken('<!'),
         }),
         toSToken('<!'),
         'NOTATION',
      ],
      [
         new CommentPToken({
            open: toSToken('<!--'),
         }),
         new CommentPToken({
            close: toSToken('-->'),
            open: toSToken('<!--'),
         }),
         toSToken('<!--'),
         'comment',
      ],
      [
         new ProcessingInstructionPToken({
            open: toSToken('<?'),
         }),
         new ProcessingInstructionPToken({
            close: toSToken('?>'),
            open: toSToken('<?'),
         }),
         toSToken('<?'),
         'processing instruction',
      ],
   ] as ReadonlyArray<[ParseToken, ParseToken, SToken, string]>;

   data.forEach((params) => {
      const [token, wholeToken, open, type] = params;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

      it(`reports an error when there was an incomplete ${type} declaration at the end of the parameter entity content`, () => {
         state = new ValidateState({
            dtdContext: {
               enclosingStack: [makeParameterEntityStart()],
               lastPToken: token,
            },
         });

         parameterEntityEndValidate(makeParameterEntityEnd(), state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.PEREF_INVALID_START_NESTING,
            lastPosition: undefined,
            params: [type],
            position: open,
         });
      });

      it(`reports no error when there was a complete ${type} declaration at the end of the parameter entity content`, () => {
         state = new ValidateState({
            dtdContext: {
               enclosingStack: [makeParameterEntityStart()],
               lastPToken: wholeToken,
            },
         });

         parameterEntityEndValidate(makeParameterEntityEnd(), state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });
   });

   it('reports no error when there was another token at the end of the parameter entity content', () => {
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            lastPToken: makeCharData(),
         },
      });

      parameterEntityEndValidate(makeParameterEntityEnd(), state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the previous thing in the enclosingStack is a conditional section start', () => {
      state = new ValidateState({
         dtdContext: {
            enclosingStack: [makeConditionalSection()],
         },
      });

      parameterEntityEndValidate(makeParameterEntityEnd(), state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.PEREF_INVALID_CONDITIONALSECTION_START_NESTING,
         lastPosition: undefined,
         params: [],
         position: makeConditionalSection().open,
      });
   });

   it('reports no error when the previous thing in the enclosingStack is a parameter entity start', () => {
      parameterEntityEndValidate(makeParameterEntityEnd(), state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
