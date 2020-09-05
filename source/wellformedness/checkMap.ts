/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import { ErrorCollector } from 'error';

import { PARAMETER_ENTITY_REFERENCE_PTOKEN } from '../token/parameterEntityReference'; // WTF?
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from '../token/generalEntityReference'; // WTF?
import { CHARREF_PTOKEN } from '../token/charRef'; // WTF?
import { XMLDECL_PTOKEN } from '../token/xmlDeclaration'; // WTF?

import { charRefCheck } from './token/charRefCheck';
import { parameterEntityReferenceCheck } from './token/parameterEntityReferenceCheck';
import { generalEntityReferenceCheck } from './token/generalEntityReferenceCheck';
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
   [XMLDECL_PTOKEN]: xmlDeclarationCheck,
};

export { checkMap };
