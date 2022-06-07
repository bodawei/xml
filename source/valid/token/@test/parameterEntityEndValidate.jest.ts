/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ParamCollector } from 'basic-test';
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
   makeConditionalStart,
   makeParameterEntityEnd,
   makeParameterEntityStart,
} from 'token-test';

import { ValidityState } from '../../common/validityState';
import { validityErrorCodes } from '../../error/validityErrorCodes';
import { parameterEntityEndValidate } from '../parameterEntityEndValidate';

const VID = validityErrorCodes.id;

describe('parameterEntityEndValidate (unit)', () => {
   let collector: ParamCollector;
   let state: ValidityState;

   beforeEach(() => {
      collector = new ParamCollector();

      state = new ValidityState({
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: false,
            inExternalSubset: false,
            lastPToken: undefined,
         },
      });
   });

   describe('Proper Declaration/PE Nesting (§2.8.0)', () => {
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

         it(`reports an error when there was an incomplete ${type} declaration at the end of the parameter entity content (§2.8.0)`, () => {
            state = new ValidityState(state, {
               dtdContext: {
                  enclosingStack: [makeParameterEntityStart()],
                  inExternalMarkupContext: false,
                  inExternalSubset: false,
                  lastPToken: token,
               },
            });

            parameterEntityEndValidate(makeParameterEntityEnd(), state, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).toHaveValidityError({
               id: VID.PEREF_INVALID_START_NESTING,
               lastPosition: undefined,
               params: [type],
               position: open,
            });
         });

         it(`reports no error when there was a complete ${type} declaration at the end of the parameter entity content (§2.8.0)`, () => {
            state = new ValidityState({
               dtdContext: {
                  enclosingStack: [makeParameterEntityStart()],
                  inExternalMarkupContext: false,
                  inExternalSubset: false,
                  lastPToken: wholeToken,
               },
            });

            parameterEntityEndValidate(makeParameterEntityEnd(), state, collector);

            // @ts-expect-error 2329/matchers
            expect(collector).not.toHaveAnyProblems();
         });
      });
   });

   describe('Proper Declaration/PE Nesting (§2.8.0)', () => {
      it('reports no error when there was another token at the end of the parameter entity content (§2.8.0)', () => {
         state = new ValidityState({
            dtdContext: {
               enclosingStack: [makeParameterEntityStart()],
               inExternalMarkupContext: false,
               inExternalSubset: false,
               lastPToken: makeCharData(),
            },
         });

         parameterEntityEndValidate(makeParameterEntityEnd(), state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });

   describe('Proper Conditional Section/PE Nesting (§3.4.0)', () => {
      it('reports an error when the previous thing in the enclosingStack is a conditional section start (§3.4.0)', () => {
         state = new ValidityState({
            dtdContext: {
               enclosingStack: [makeConditionalStart()],
               inExternalMarkupContext: false,
               inExternalSubset: false,
               lastPToken: undefined,
            },
         });

         parameterEntityEndValidate(makeParameterEntityEnd(), state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveValidityError({
            id: VID.PEREF_INVALID_CONDITIONALSECTION_START_NESTING,
            lastPosition: undefined,
            params: [],
            position: makeConditionalStart().open,
         });
      });

      it('reports no error when the previous thing in the enclosingStack is a parameter entity start (§3.4.0)', () => {
         parameterEntityEndValidate(makeParameterEntityEnd(), state, collector);

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
