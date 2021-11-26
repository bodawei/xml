/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { geRefValidate } from '../common/geRefValidate';

/*
 * Keep an entypoint consistent with all other token validators, even though it is
 * identical to the common routine
 */
const generalEntityReferenceValidate = geRefValidate;

export { generalEntityReferenceValidate };
