/* Copyright ® 2019-2026 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { toSToken } from 'basic';
import { ParamCollector } from 'basic-test';
import {
   TextPToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
} from 'pToken';
import { vi } from 'vitest';

import { charCheck } from '../../common/charCheck';
import { externalIdCheck } from '../../common/externalIdCheck';
import { literalCheck } from '../../common/literalCheck';
import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { warningCodes } from '../../error/warningCodes';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { entityDeclarationCheck } from '../entityDeclarationCheck';

vi.mock('../../common/charCheck');
vi.mock('../../common/externalIdCheck');
vi.mock('../../common/literalCheck');
vi.mock('../../common/nameCheck');
vi.mock('../../common/nameXmlCheck');

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('entityDeclarationCheck (unit)', () => {
   let genEntityDeclarationPToken: GeneralEntityDeclarationPToken;
   let paramEntityDeclarationPToken: ParameterEntityDeclarationPToken;
   let collector: ParamCollector;
   let confVer: ConformanceVersion;

   beforeEach(() => {
      genEntityDeclarationPToken = new GeneralEntityDeclarationPToken({
         close: toSToken('>'),
         externalIdSpace: toSToken(' '),
         name: toSToken('anEntity'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
      });

      paramEntityDeclarationPToken = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         parameter: toSToken('%'),
         parameterSpace: toSToken(' '),
         name: toSToken('anEntity'),
         nameSpace: toSToken(' '),
         close: toSToken('>'),
      });

      confVer = new ConformanceVersion();
      collector = new ParamCollector();
   });

   it('asks the literal module to look for problems in the declaration part', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         value: [new TextPToken({ text: toSToken('yipes') })],
      });

      entityDeclarationCheck(pToken, collector, new ConformanceVersion());

      expect(literalCheck).toHaveBeenCalledWith(pToken, collector, confVer, WFEID.NOUN_ENTITYVALUE);
   });

   it('reports an error if % is not followed by a space', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         parameterSpace: undefined,
      });

      entityDeclarationCheck(pToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE,
         lastPosition: pToken.parameter,
         params: ['anEntity'],
         position: undefined,
      });
   });

   it('reports an error if there is no name', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         name: undefined,
      });

      entityDeclarationCheck(pToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ENTITYDECL_NO_NAME,
         lastPosition: pToken.parameterSpace,
         params: [],
         position: undefined,
      });
   });

   it('calls nameCheck() to report on name validity', () => {
      entityDeclarationCheck(paramEntityDeclarationPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         paramEntityDeclarationPToken.name,
         collector,
         confVer,
         WFEID.ENTITYDECL_NAME_INVALID,
      );
   });

   it('calls nameXmlCheck() to report on bad names', () => {
      entityDeclarationCheck(paramEntityDeclarationPToken, collector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
         paramEntityDeclarationPToken.name,
         collector,
         confVer,
         'ENTITY',
         WID.ENTITYDECL_NAME_XMLDASH_RESERVED,
         WID.ENTITYDECL_NAME_XML_RESERVED,
      );
   });

   it('reports an error if there is no space after the name', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         nameSpace: undefined,
      });

      entityDeclarationCheck(pToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ENTITYDECL_NAME_NO_TRAILING_SPACE,
         lastPosition: pToken.name,
         params: ['anEntity'],
         position: undefined,
      });
   });

   it('calls externalId.entityDeclarationCheck() to check on the externalId', () => {
      const pToken = new ParameterEntityDeclarationPToken(paramEntityDeclarationPToken, {
         externalId: {},
      });

      entityDeclarationCheck(pToken, collector, confVer);

      expect(externalIdCheck).toHaveBeenCalledWith(pToken.externalId, false, collector, confVer);
   });

   it('reports an error if NDATA is the wrong case', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: {},
         nData: toSToken('nData'),
         nDataName: toSToken('foo'),
      });

      entityDeclarationCheck(pToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ENTITYDECL_NDATA_INVALID_CASE,
         params: ['anEntity', 'nData'],
         position: pToken.nData,
      });
   });

   it('reports an error if there is no NDATA value', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: {},
         nData: toSToken('nData'),
      });

      entityDeclarationCheck(pToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         lastPosition: pToken.nData,
         id: WFEID.ENTITYDECL_NDATA_NO_NAME,
         params: ['anEntity'],
      });
   });

   it('calls charCheck() to check on the ndata value', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         externalId: {},
         nData: toSToken('nData'),
         nDataName: toSToken('nDataName'),
      });

      entityDeclarationCheck(pToken, collector, confVer);

      expect(charCheck).toHaveBeenCalledWith(pToken.nDataName, collector, confVer, false);
   });

   it('reports an error if there was no closing', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         close: undefined,
      });

      entityDeclarationCheck(pToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ENTITYDECL_NO_CLOSE,
         lastPosition: pToken.nameSpace,
         params: ['anEntity'],
         position: undefined,
      });
   });

   it('reports an error when there is extra', () => {
      const pToken = new GeneralEntityDeclarationPToken(genEntityDeclarationPToken, {
         extra: toSToken('fooo'),
      });

      entityDeclarationCheck(pToken, collector, new ConformanceVersion());

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ENTITYDECL_EXTRA_TEXT,
         lastPosition: undefined,
         params: ['fooo'],
         position: pToken.extra,
      });
   });

   describe('general entity references', () => {
      it('reports no errors if there is no value', () => {
         const pToken = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            declType: toSToken('ENTITY'),
            declTypeSpace: toSToken(' '),
            parameter: toSToken('%'),
            parameterSpace: toSToken(' '),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            close: toSToken('>'),
         });

         entityDeclarationCheck(pToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports no errors if the value has no ampersands in it', () => {
         const pToken = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            declType: toSToken('ENTITY'),
            declTypeSpace: toSToken(' '),
            parameter: toSToken('%'),
            parameterSpace: toSToken(' '),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            value: [
               new TextPToken(toSToken('wowzers')),
               new ParameterEntityReferencePToken({
                  open: toSToken('%'),
                  name: toSToken('fred'),
                  close: toSToken(';'),
               }),
            ],
            close: toSToken('>'),
         });

         entityDeclarationCheck(pToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });

      it('reports a syntax error if there is a lone ampersand in the value', () => {
         const text = new TextPToken(toSToken('foo & bar'));
         const pToken = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            declType: toSToken('ENTITY'),
            declTypeSpace: toSToken(' '),
            parameter: toSToken('%'),
            parameterSpace: toSToken(' '),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            value: [
               text,
               new ParameterEntityReferencePToken({
                  open: toSToken('%'),
                  name: toSToken('fred'),
                  close: toSToken(';'),
               }),
            ],
            close: toSToken('>'),
         });

         entityDeclarationCheck(pToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_CHARS,
            lastPosition: undefined,
            params: ['& bar'],
            position: text.text,
         });
      });

      it('reports a syntax error for each lone ampersand', () => {
         const text = new TextPToken(toSToken('foo & bar & ginger'));
         const pToken = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            declType: toSToken('ENTITY'),
            declTypeSpace: toSToken(' '),
            parameter: toSToken('%'),
            parameterSpace: toSToken(' '),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            value: [
               text,
               new ParameterEntityReferencePToken({
                  open: toSToken('%'),
                  name: toSToken('fred'),
                  close: toSToken(';'),
               }),
            ],
            close: toSToken('>'),
         });

         entityDeclarationCheck(pToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_CHARS,
            lastPosition: undefined,
            params: ['& bar & gi'],
            position: text.text,
         });
         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_CHARS,
            lastPosition: undefined,
            params: ['& ginger'],
            position: text.text,
         });
      });

      it('reports a syntax error if there is something that looks like a reference but it has the wrong name syntax', () => {
         const text = new TextPToken(toSToken('foo &123;'));
         const pToken = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            declType: toSToken('ENTITY'),
            declTypeSpace: toSToken(' '),
            parameter: toSToken('%'),
            parameterSpace: toSToken(' '),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            value: [
               text,
               new ParameterEntityReferencePToken({
                  open: toSToken('%'),
                  name: toSToken('fred'),
                  close: toSToken(';'),
               }),
            ],
            close: toSToken('>'),
         });

         entityDeclarationCheck(pToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_SYNTAX,
            lastPosition: undefined,
            params: ['&123;'],
            position: text.text,
         });
      });

      it('reports a syntax error if we have a spacious reference', () => {
         const text = new TextPToken(toSToken('foo & name ;'));
         const pToken = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            declType: toSToken('ENTITY'),
            declTypeSpace: toSToken(' '),
            parameter: toSToken('%'),
            parameterSpace: toSToken(' '),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            value: [
               text,
               new ParameterEntityReferencePToken({
                  open: toSToken('%'),
                  name: toSToken('fred'),
                  close: toSToken(';'),
               }),
            ],
            close: toSToken('>'),
         });

         entityDeclarationCheck(pToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).toHaveWellFormedError({
            id: WFEID.REFERENCE_INVALID_SYNTAX,
            lastPosition: undefined,
            params: ['& name ;'],
            position: text.text,
         });
      });

      it('reports no error if the value looks like a legitimate name', () => {
         const text = new TextPToken(toSToken('foo &onetwothree;'));
         const pToken = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            declType: toSToken('ENTITY'),
            declTypeSpace: toSToken(' '),
            parameter: toSToken('%'),
            parameterSpace: toSToken(' '),
            name: toSToken('anEntity'),
            nameSpace: toSToken(' '),
            value: [
               text,
               new ParameterEntityReferencePToken({
                  open: toSToken('%'),
                  name: toSToken('fred'),
                  close: toSToken(';'),
               }),
            ],
            close: toSToken('>'),
         });

         entityDeclarationCheck(pToken, collector, new ConformanceVersion());

         // @ts-expect-error 2329/matchers
         expect(collector).not.toHaveAnyProblems();
      });
   });
});
