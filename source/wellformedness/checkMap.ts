/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { Collector, ConformanceVersion } from 'basic';
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
   CONDITIONAL_START_PTOKEN,
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

import { generalEntityStartCheck } from './marker/generalEntityStartCheck';
import { parameterEntityStartCheck } from './marker/parameterEntityStartCheck';
import { attListDeclarationCheck } from './token/attListDeclarationCheck';
import { cdataCheck } from './token/cdataCheck';
import { charDataCheck } from './token/charDataCheck';
import { charRefCheck } from './token/charRefCheck';
import { commentCheck } from './token/commentCheck';
import { conditionalStartCheck } from './token/conditionalStartCheck';
import { docTypeEndCheck } from './token/docTypeEndCheck';
import { docTypeStartCheck } from './token/docTypeStartCheck';
import { elementDeclarationCheck } from './token/elementDeclarationCheck';
import { elementEndCheck } from './token/elementEndCheck';
import { elementStartCheck } from './token/elementStartCheck';
import { entityDeclarationCheck } from './token/entityDeclarationCheck';
import { generalEntityReferenceCheck } from './token/generalEntityReferenceCheck';
import { notationDeclarationCheck } from './token/notationDeclarationCheck';
import { parameterEntityReferenceCheck } from './token/parameterEntityReferenceCheck';
import { processingInstructionCheck } from './token/processingInstructionCheck';
import { textDeclarationCheck } from './token/textDeclarationCheck';
import { xmlDeclarationCheck } from './token/xmlDeclarationCheck';

type CheckMap = Record<
   string,
   | undefined
   | ((
        pToken: any,
        Collector: Collector,
        confVer: ConformanceVersion,
        inSecondPassContxt?: boolean,
     ) => void)
>;

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
   [CONDITIONAL_START_PTOKEN]: conditionalStartCheck,
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
