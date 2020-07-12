/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { CharRefXToken } from './token/CharRefXToken';
import { ParameterEntityReferenceXToken } from './token/ParameterEntityReferenceXToken';

type XToken =
   | TextDeclarationXToken
   | XmlDeclarationXToken
   | CharRefXToken
   | ParameterEntityReferenceXToken;

export { XToken };
