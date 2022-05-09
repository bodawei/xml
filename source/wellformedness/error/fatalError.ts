/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCodes } from 'basic';
import { wellFormedFatalErrors } from './wellFormedFatalErrors';

const fatalError = new ErrorCodes(wellFormedFatalErrors);

export { fatalError };
