/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { EntityLocation, Range } from '../../basic';

const BLANK_ORIGIN = 'https://www.w3.org/TR/xml/#as-PE';
const RANGE = new Range(new EntityLocation(BLANK_ORIGIN), 0, 0, 0, 1, 0, 1);

const helper = {
   BLANK_ORIGIN,
   makeInsertedRange() {
      return RANGE.clone();
   },
}

export default helper;