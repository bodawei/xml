/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { SToken } from 'sToken';
import Offset from '../Offset';

const XML_ERROR_TOKEN = 'ERROR_TYPE';
const FATAL_ERROR_SUBTYPE = 'FATAL_ERROR_SUBTYPE';
const WARNING_SUBTYPE = 'WARNING_SUBTYPE';

type XmlErrorPosition = Offset | SToken;

interface XmlErrorToken {
   readonly code: number;
   readonly context?: Offset;
   readonly id: string;
   readonly message: string;
   readonly place?: Offset;
   readonly subtype: string;
   readonly type: typeof XML_ERROR_TOKEN;
}

export { XML_ERROR_TOKEN, FATAL_ERROR_SUBTYPE, WARNING_SUBTYPE, XmlErrorPosition, XmlErrorToken };
