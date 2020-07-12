/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { EntityMetaData } from 'basic';
import { ErrorCollector } from 'error';

import { PARAMETER_ENTITY_REFERENCE_PTOKEN } from '../token/parameterEntityReference'; // WTF?
import { CHARREF_PTOKEN } from '../token/charRef'; // WTF?

import { charRefCheck } from './tokens/charRefCheck';
import { parameterEntityReferenceCheck } from './tokens/parameterEntityReferenceCheck';

interface CheckMap {
   [type: string]: (pToken: any, errorCollector: ErrorCollector, emd: EntityMetaData) => void;
}

const checkMap: CheckMap = {
   [CHARREF_PTOKEN]: charRefCheck,
   [PARAMETER_ENTITY_REFERENCE_PTOKEN]: parameterEntityReferenceCheck,
};

export { checkMap };
