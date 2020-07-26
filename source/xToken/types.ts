/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { CharRefXToken } from './token/CharRefXToken';
import { ParameterEntityReferenceXToken } from './token/ParameterEntityReferenceXToken';
import { GeneralEntityReferenceXToken } from './token/generalEntityReferenceXToken';

// Temporary additions to allow us to build out the XTokenToXmlStream data

import {
   CdataXToken,
   CharDataXToken,
   DocTypeEndXToken,
   DocTypeStartXToken,
   ElementEmptyXToken,
   ElementEndXToken,
   ElementStartXToken,
   NotationDeclarationXToken,
   ProcessingInstructionXToken,
   SpaceXToken,
} from 'token';

type XToken =
   | TextDeclarationXToken
   | XmlDeclarationXToken
   | CharRefXToken
   | GeneralEntityReferenceXToken
   | ParameterEntityReferenceXToken
   // additions
   | CharDataXToken
   | CdataXToken
   | DocTypeEndXToken
   | DocTypeStartXToken
   | ElementEmptyXToken
   | ElementEndXToken
   | ElementStartXToken
   | NotationDeclarationXToken
   | ProcessingInstructionXToken
   | SpaceXToken;

export { XToken };
