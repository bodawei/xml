/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { AttListDeclarationXToken } from './token/attListDeclarationXToken';
import { ConditionalSectionEndXToken } from './token/conditionalSectionEndXToken';
import { ConditionalSectionStartXToken } from './token/conditionalSectionStartXToken';
import { CharRefXToken } from './token/CharRefXToken';
import { ElementDeclarationXToken } from './token/elementDeclarationXToken';
import { GeneralEntityDeclarationXToken } from './token/generalEntityDeclarationXToken';
import { NotationDeclarationXToken } from './token/notationDeclarationXToken';
import { ParameterEntityDeclarationXToken } from './token/parameterEntityDeclarationXToken';
import { ProcessingInstructionXToken } from './token/processingInstructionXToken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';
import { ParameterEntityReferenceXToken } from './token/ParameterEntityReferenceXToken';
import { GeneralEntityReferenceXToken } from './token/generalEntityReferenceXToken';
import { TextXToken } from './token/textXToken';

// Temporary additions to allow us to build out the XTokenToXmlStream data

import {
   CdataXToken,
   CharDataXToken,
   DocTypeEndXToken,
   DocTypeStartXToken,
   ElementEmptyXToken,
   ElementEndXToken,
   ElementStartXToken,
   SpaceXToken,
} from 'token';
import { ParseToken } from 'pToken';

type XToken =
   | CharRefXToken
   | GeneralEntityReferenceXToken
   | ParameterEntityReferenceXToken
   | TextDeclarationXToken
   | XmlDeclarationXToken
   // temp additions
   | ParseToken // EEEK.
   | ConditionalSectionEndXToken
   | ConditionalSectionStartXToken
   | CharDataXToken
   | CdataXToken
   | DocTypeEndXToken
   | DocTypeStartXToken
   | ElementEmptyXToken
   | ElementEndXToken
   | ElementStartXToken
   | SpaceXToken
   // Fully blessed
   | AttListDeclarationXToken
   | ElementDeclarationXToken
   | GeneralEntityDeclarationXToken
   | NotationDeclarationXToken
   | ParameterEntityDeclarationXToken
   | ProcessingInstructionXToken
   | TextXToken;

export { XToken };
