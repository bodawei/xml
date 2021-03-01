/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, ConformanceVersion } from 'basic';

import { charRefCheck } from './token/charRefCheck';
import { attListDeclarationCheck } from './token/attListDeclarationCheck';
import { elementDeclarationCheck } from './token/elementDeclarationCheck';
import { elementStartCheck } from './token/elementStartCheck';
import { notationDeclarationCheck } from './token/notationDeclarationCheck';
import { parameterEntityReferenceCheck } from './token/parameterEntityReferenceCheck';
import { generalEntityReferenceCheck } from './token/generalEntityReferenceCheck';
import { entityDeclarationCheck } from './token/entityDeclarationCheck';
import { processingInstructionCheck } from './token/processingInstructionCheck';
import { textDeclarationCheck } from './token/textDeclarationCheck';
import { xmlDeclarationCheck } from './token/xmlDeclarationCheck';

// we have a circular dependency somewhere.
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from '../pToken/token/generalEntityReference'; // WTF?
import { CHARREF_PTOKEN } from '../pToken/token/charRef'; // WTF?
import { PARAMETER_ENTITY_REFERENCE_PTOKEN } from '../pToken/token/parameterEntityReference';
import { ATTLIST_DECLARATION_PTOKEN } from '../pToken/token/attListDeclaration';
import { ELEMENT_DECLARATION_PTOKEN } from '../pToken/token/elementDeclaration';
import { GENERAL_ENTITY_DECLARATION_PTOKEN } from '../pToken/token/generalEntityDeclaration';
import { NOTATION_DECLARATION_PTOKEN } from '../pToken/token/notationDeclaration';
import { PROCESSING_INSTRUCTION_PTOKEN } from '../pToken/token/processingInstruction';
import { PARAMETER_ENTITY_DECLARATION_PTOKEN } from '../pToken/token/parameterEntityDeclaration';
// import { XMLDECL_PTOKEN } from '../pToken/token/xmlDeclaration';
// import { GENERAL_ENTITY_START_PTOKEN } from 'token';
// import { ELEMENT_EMPTY_PTOKEN, ELEMENT_START_PTOKEN } from '../token/elementStart';
import { TEXTDECL_PTOKEN } from '../pToken/token/textDeclaration';
import { generalEntityStartCheck } from './marker/generalEntityStartCheck';
import { parameterEntityStartCheck } from './marker/parameterEntityStartCheck';

const ELEMENT_EMPTY_PTOKEN = 'ELEMENT_EMPTY_PTOKEN';
const ELEMENT_START_PTOKEN = 'ELEMENT_START_PTOKEN';
const GENERAL_ENTITY_START_PTOKEN = 'GENERAL_ENTITY_START_PTOKEN';
const GENERAL_ENTITY_END_PTOKEN = 'GENERAL_ENTITY_END_PTOKEN';
const PARAMETER_ENTITY_START_PTOKEN = 'PARAMETER_ENTITY_START_PTOKEN';
const PARAMETER_ENTITY_END_PTOKEN = 'PARAMETER_ENTITY_END_PTOKEN';
const XMLDECL_PTOKEN = 'XMLDECL_PTOKEN';

interface CheckMap {
   [type: string]:
      | undefined
      | ((pToken: any, errorCollector: ErrorCollector, confVer: ConformanceVersion) => void);
}

const checkMap: CheckMap = {
   // markers
   [GENERAL_ENTITY_START_PTOKEN]: generalEntityStartCheck,
   [GENERAL_ENTITY_END_PTOKEN]: () => {},
   [PARAMETER_ENTITY_START_PTOKEN]: parameterEntityStartCheck,
   [PARAMETER_ENTITY_END_PTOKEN]: () => {},
   // tokens
   [ATTLIST_DECLARATION_PTOKEN]: attListDeclarationCheck,
   [CHARREF_PTOKEN]: charRefCheck,
   [ELEMENT_DECLARATION_PTOKEN]: elementDeclarationCheck,
   [ELEMENT_EMPTY_PTOKEN]: elementStartCheck,
   [ELEMENT_START_PTOKEN]: elementStartCheck,
   [GENERAL_ENTITY_DECLARATION_PTOKEN]: entityDeclarationCheck,
   [GENERAL_ENTITY_REFERENCE_PTOKEN]: generalEntityReferenceCheck,
   [NOTATION_DECLARATION_PTOKEN]: notationDeclarationCheck,
   [PARAMETER_ENTITY_DECLARATION_PTOKEN]: entityDeclarationCheck,
   [PARAMETER_ENTITY_REFERENCE_PTOKEN]: parameterEntityReferenceCheck,
   [PROCESSING_INSTRUCTION_PTOKEN]: processingInstructionCheck,
   // Space needs no checking
   [TEXTDECL_PTOKEN]: textDeclarationCheck,
   [XMLDECL_PTOKEN]: xmlDeclarationCheck,
};

export { checkMap };
