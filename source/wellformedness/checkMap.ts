/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, ConformanceVersion } from 'basic';

import { PARAMETER_ENTITY_REFERENCE_PTOKEN } from '../token/parameterEntityReference'; // WTF?
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from '../token/generalEntityReference'; // WTF?
import { CHARREF_PTOKEN } from '../token/charRef'; // WTF?

import { charRefCheck } from './token/charRefCheck';
import { attListDeclarationCheck } from './token/attListDeclarationCheck';
import { elementDeclarationCheck } from './token/elementDeclarationCheck';
import { notationDeclarationCheck } from './token/notationDeclarationCheck';
import { parameterEntityReferenceCheck } from './token/parameterEntityReferenceCheck';
import { generalEntityReferenceCheck } from './token/generalEntityReferenceCheck';
import { entityDeclarationCheck } from './token/entityDeclarationCheck';
import { processingInstructionCheck } from './token/processingInstructionCheck';
import { textDeclarationCheck } from './token/textDeclarationCheck';
import { xmlDeclarationCheck } from './token/xmlDeclarationCheck';

// we have a circular dependency somewhere.
import { ATTLIST_DECLARATION_PTOKEN } from '../pToken/token/attListDeclaration';
import { ELEMENT_DECLARATION_PTOKEN } from '../pToken/token/elementDeclaration';
import { GENERAL_ENTITY_DECLARATION_PTOKEN } from '../pToken/token/generalEntityDeclaration';
import { NOTATION_DECLARATION_PTOKEN } from '../pToken/token/notationDeclaration';
import { PROCESSING_INSTRUCTION_PTOKEN } from '../pToken/token/processingInstruction';
import { PARAMETER_ENTITY_DECLARATION_PTOKEN } from '../pToken/token/parameterEntityDeclaration';
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
   [ATTLIST_DECLARATION_PTOKEN]: attListDeclarationCheck,
   [CHARREF_PTOKEN]: charRefCheck,
   [ELEMENT_DECLARATION_PTOKEN]: elementDeclarationCheck,
   [GENERAL_ENTITY_DECLARATION_PTOKEN]: entityDeclarationCheck,
   [GENERAL_ENTITY_REFERENCE_PTOKEN]: generalEntityReferenceCheck,
   [NOTATION_DECLARATION_PTOKEN]: notationDeclarationCheck,
   [PARAMETER_ENTITY_DECLARATION_PTOKEN]: entityDeclarationCheck,
   [PARAMETER_ENTITY_REFERENCE_PTOKEN]: parameterEntityReferenceCheck,
   [PROCESSING_INSTRUCTION_PTOKEN]: processingInstructionCheck,
   [TEXTDECL_PTOKEN]: textDeclarationCheck,
   [XMLDECL_PTOKEN]: xmlDeclarationCheck,
};

export { checkMap };
