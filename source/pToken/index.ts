/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { PToken as PTokenClassic } from 'token';

import { ConformanceVersion } from './token/conformanceVersion';
import { EntityId } from './token/entityId';

export * from './token/conformanceVersion';
export * from './token/entityId';

type PToken = PTokenClassic;
type ParseValue = PToken | ConformanceVersion | EntityId;

enum ContextType {
   DOCUMENT,
   EXTERNAL_SUBSET,
   PARAMETER_ENTITY,
   GENERAL_ENTITY,
}

export { ContextType, ParseValue, PToken };
