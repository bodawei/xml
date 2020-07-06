/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';

type XToken = TextDeclarationXToken | XmlDeclarationXToken;

export { XToken };
