/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from './token/conformanceVersion';
import { PToken as PTokenClassic } from 'token';

export * from './token/conformanceVersion';

type PToken = PTokenClassic;
type ParseValue = PToken | ConformanceVersion;

enum ContextType {
   CONTENT,
   DOCUMENT,
   EXTERNAL_ENTITY,
}

export { ContextType, ParseValue, PToken };
