/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { CharRefXToken } from './token/CharRefXToken';
import { ProcessingInstructionXToken } from './token/processingInstructionXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
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
   SpaceXToken,
} from 'token';
import { ParseValue } from 'pToken';

type XToken =
   | CharRefXToken
   | GeneralEntityReferenceXToken
   | ParameterEntityReferenceXToken
   | TextDeclarationXToken
   | XmlDeclarationXToken
   // temp additions
   | ParseValue // EEEK.
   | CharDataXToken
   | CdataXToken
   | DocTypeEndXToken
   | DocTypeStartXToken
   | ElementEmptyXToken
   | ElementEndXToken
   | ElementStartXToken
   | NotationDeclarationXToken
   | SpaceXToken
   // Fully blessed
   | ProcessingInstructionXToken;

export { XToken };
