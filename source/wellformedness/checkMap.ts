/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, ConformanceVersion } from 'basic';
import {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   CHARREF_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   ATTLIST_DECLARATION_PTOKEN,
   ELEMENT_DECLARATION_PTOKEN,
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   NOTATION_DECLARATION_PTOKEN,
   PROCESSING_INSTRUCTION_PTOKEN,
   PARAMETER_ENTITY_DECLARATION_PTOKEN,
   XMLDECL_PTOKEN,
   TEXTDECL_PTOKEN,
} from 'pToken';
import {
   COMMENT_PTOKEN,
   CDATA_PTOKEN,
   CHARDATA_PTOKEN,
   CONDITIONAL_PTOKEN,
   DOCTYPE_END_PTOKEN,
   DOCTYPE_START_PTOKEN,
   ELEMENT_EMPTY_PTOKEN,
   ELEMENT_END_PTOKEN,
   ELEMENT_START_PTOKEN,
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
} from 'token';

import { attListDeclarationCheck } from './token/attListDeclarationCheck';
import { cdataCheck } from './token/cdataCheck';
import { charRefCheck } from './token/charRefCheck';
import { charDataCheck } from './token/charDataCheck';
import { commentCheck } from './token/commentCheck';
import { conditionalStartCheck } from './token/conditionalStartCheck';
import { docTypeEndCheck } from './token/docTypeEndCheck';
import { docTypeStartCheck } from './token/docTypeStartCheck';
import { elementDeclarationCheck } from './token/elementDeclarationCheck';
import { elementEndCheck } from './token/elementEndCheck';
import { elementStartCheck } from './token/elementStartCheck';
import { notationDeclarationCheck } from './token/notationDeclarationCheck';
import { parameterEntityReferenceCheck } from './token/parameterEntityReferenceCheck';
import { generalEntityReferenceCheck } from './token/generalEntityReferenceCheck';
import { entityDeclarationCheck } from './token/entityDeclarationCheck';
import { processingInstructionCheck } from './token/processingInstructionCheck';
import { textDeclarationCheck } from './token/textDeclarationCheck';
import { xmlDeclarationCheck } from './token/xmlDeclarationCheck';

import { generalEntityStartCheck } from './marker/generalEntityStartCheck';
import { parameterEntityStartCheck } from './marker/parameterEntityStartCheck';

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
   [CDATA_PTOKEN]: cdataCheck,
   [CHARREF_PTOKEN]: charRefCheck,
   [CHARDATA_PTOKEN]: charDataCheck,
   [COMMENT_PTOKEN]: commentCheck,
   [CONDITIONAL_PTOKEN]: conditionalStartCheck,
   [DOCTYPE_END_PTOKEN]: docTypeEndCheck,
   [DOCTYPE_START_PTOKEN]: docTypeStartCheck,
   [ELEMENT_DECLARATION_PTOKEN]: elementDeclarationCheck,
   [ELEMENT_EMPTY_PTOKEN]: elementStartCheck,
   [ELEMENT_END_PTOKEN]: elementEndCheck,
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
