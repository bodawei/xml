/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ParseToken } from 'pToken';

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
import { SpaceXToken } from './token/spaceXtoken';
import { CdataXToken } from './token/cdataXToken';
import { CharDataXToken } from './token/charDataXToken';
import { CommentXToken } from './token/commentXToken';
import { DocTypeEndXToken } from './token/docTypeEndXToken';
import { DocTypeStartXToken } from './token/docTypeStartXToken';
import { ElementEmptyXToken } from './token/elementEmptyXToken';
import { ElementEndXToken } from './token/elementEndXToken';
import { ElementStartXToken } from './token/elementStartXToken';
import { GeneralEntityEndXToken } from './marker/generalEntityEndXToken';
import { UnknownDeclarationXToken } from './token/unknownDeclarationXToken';
import { GeneralEntityStartXToken } from './marker/generalEntityStartXToken';
import { ParameterEntityEndXToken } from './marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from './marker/parameterEntityStartXToken';

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
   | CommentXToken
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
   | GeneralEntityEndXToken
   | GeneralEntityStartXToken
   | ParameterEntityEndXToken
   | ParameterEntityStartXToken
   | UnknownDeclarationXToken
   | TextXToken;

export { XToken };
