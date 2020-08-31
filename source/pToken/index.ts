/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { PToken as PTokenClassic } from 'token';

import { ConformanceVersion } from './token/conformanceVersion';
import { EntityUri } from './token/entityUri';

export * from './token/conformanceVersion';
export * from './token/entityUri';

type PToken = PTokenClassic;
type ParseValue = PToken | ConformanceVersion | EntityUri;

enum ContextType {
   DOCUMENT,
   EXTERNAL_SUBSET,
   PARAMETER_ENTITY,
   GENERAL_ENTITY,
}

export { ContextType, ParseValue, PToken };
