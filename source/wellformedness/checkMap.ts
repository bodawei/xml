/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector } from 'error';

import { PARAMETER_ENTITY_REFERENCE_PTOKEN } from '../token/parameterEntityReference'; // WTF?
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from '../token/generalEntityReference'; // WTF?
import { CHARREF_PTOKEN } from '../token/charRef'; // WTF?

import { charRefCheck } from './token/charRefCheck';
import { notationDeclarationCheck } from './token/notationDeclarationCheck';
import { parameterEntityReferenceCheck } from './token/parameterEntityReferenceCheck';
import { generalEntityReferenceCheck } from './token/generalEntityReferenceCheck';
import { processingInstructionCheck } from './token/processingInstructionCheck';
import { textDeclarationCheck } from './token/textDeclarationCheck';
import { xmlDeclarationCheck } from './token/xmlDeclarationCheck';

// we have a circular dependency somewhere.
import { NOTATION_DECLARATION_PTOKEN } from '../pToken/token/notationDeclaration';
import { PROCESSING_INSTRUCTION_PTOKEN } from '../pToken/token/processingInstruction';
import { XMLDECL_PTOKEN } from '../pToken/token/xmlDeclaration';
import { TEXTDECL_PTOKEN } from '../pToken/token/textDeclaration';

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
   [NOTATION_DECLARATION_PTOKEN]: notationDeclarationCheck,
   [PARAMETER_ENTITY_REFERENCE_PTOKEN]: parameterEntityReferenceCheck,
   [PROCESSING_INSTRUCTION_PTOKEN]: processingInstructionCheck,
   [TEXTDECL_PTOKEN]: textDeclarationCheck,
   [XMLDECL_PTOKEN]: xmlDeclarationCheck,
};

export { checkMap };
