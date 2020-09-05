/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion, EntityId } from 'basic';
import { PToken as PTokenClassic } from 'token';

export * from './util/externalIdToEntityId';

type PToken = PTokenClassic;
type ParseValue = PToken | ConformanceVersion | EntityId;

enum ContextType {
   DOCUMENT,
   EXTERNAL_SUBSET,
   PARAMETER_ENTITY,
   GENERAL_ENTITY,
}

export { ContextType, ParseValue, PToken };
