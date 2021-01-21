/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ParseToken } from 'pToken';

type EToken = ParseToken;

export { EToken };
export { OpaqueEntityLoc } from './types';
export { resolveEntityId } from './utils/resolveEntityId';
export { EntityExpander } from './EntityExpander';
export { EntityProcessors, AttributeValueResults, RetrieveResults } from './types';
