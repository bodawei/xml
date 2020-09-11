/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector } from 'error';
import { TEXTDECL_PTOKEN, XMLDECL_PTOKEN } from 'pToken';

import { PARAMETER_ENTITY_REFERENCE_PTOKEN } from '../token/parameterEntityReference'; // WTF?
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from '../token/generalEntityReference'; // WTF?
import { CHARREF_PTOKEN } from '../token/charRef'; // WTF?
import { PROCESSING_INSTRUCTION_PTOKEN } from 'token';

import { charRefCheck } from './token/charRefCheck';
import { parameterEntityReferenceCheck } from './token/parameterEntityReferenceCheck';
import { generalEntityReferenceCheck } from './token/generalEntityReferenceCheck';
import { processingInstructionCheck } from './token/processingInstructionCheck';
import { textDeclarationCheck } from './token/textDeclarationCheck';
import { xmlDeclarationCheck } from './token/xmlDeclarationCheck';

interface CheckMap {
   [type: string]: (
      pToken: any,
      errorCollector: ErrorCollector,
      confVer: ConformanceVersion,
   ) => void;
}

const checkMap: CheckMap = {
   [CHARREF_PTOKEN]: charRefCheck,
   [GENERAL_ENTITY_REFERENCE_PTOKEN]: generalEntityReferenceCheck,
   [PARAMETER_ENTITY_REFERENCE_PTOKEN]: parameterEntityReferenceCheck,
   [PROCESSING_INSTRUCTION_PTOKEN]: processingInstructionCheck,
   [TEXTDECL_PTOKEN]: textDeclarationCheck,
   [XMLDECL_PTOKEN]: xmlDeclarationCheck,
};

export { checkMap };
