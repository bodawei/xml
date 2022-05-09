/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { ErrorCodes } from 'basic';
import { wellFormedWarnings } from './wellFormedWarnings';

const wellFormedWarningCodes = new ErrorCodes(wellFormedWarnings);

export { wellFormedWarningCodes };
