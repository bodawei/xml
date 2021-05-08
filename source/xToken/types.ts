/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ParseToken } from 'pToken';

import { AttListDeclarationXToken } from './token/attListDeclarationXToken';
import { ConditionalEndXToken } from './token/conditionalEndXToken';
import { ConditionalStartXToken } from './token/conditionalStartXToken';
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
   | ParseToken
   | AttListDeclarationXToken
   | CdataXToken
   | CharDataXToken
   | CharRefXToken
   | CommentXToken
   | ConditionalEndXToken
   | ConditionalStartXToken
   | DocTypeEndXToken
   | DocTypeStartXToken
   | GeneralEntityEndXToken
   | GeneralEntityStartXToken
   | ParameterEntityEndXToken
   | ParameterEntityStartXToken
   // ---
   | GeneralEntityReferenceXToken
   | ParameterEntityReferenceXToken
   | TextDeclarationXToken
   | XmlDeclarationXToken
   | ElementEmptyXToken
   | ElementEndXToken
   | ElementStartXToken
   | SpaceXToken
   | ElementDeclarationXToken
   | GeneralEntityDeclarationXToken
   | NotationDeclarationXToken
   | ParameterEntityDeclarationXToken
   | ProcessingInstructionXToken
   | UnknownDeclarationXToken
   | TextXToken;

export { XToken };
