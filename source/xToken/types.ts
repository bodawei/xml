/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { ParseToken } from 'pToken';

import { GeneralEntityEndXToken } from './marker/generalEntityEndXToken';
import { GeneralEntityStartXToken } from './marker/generalEntityStartXToken';
import { ParameterEntityEndXToken } from './marker/parameterEntityEndXToken';
import { ParameterEntityStartXToken } from './marker/parameterEntityStartXToken';
import { AttListDeclarationXToken } from './token/attListDeclarationXToken';
import { CdataXToken } from './token/cdataXToken';
import { CharDataXToken } from './token/charDataXToken';
import { CharRefXToken } from './token/charRefXToken';
import { CommentXToken } from './token/commentXToken';
import { ConditionalEndXToken } from './token/conditionalEndXToken';
import { ConditionalStartXToken } from './token/conditionalStartXToken';
import { DocTypeEndXToken } from './token/docTypeEndXToken';
import { DocTypeStartXToken } from './token/docTypeStartXToken';
import { ElementDeclarationXToken } from './token/elementDeclarationXToken';
import { ElementEmptyXToken } from './token/elementEmptyXToken';
import { ElementEndXToken } from './token/elementEndXToken';
import { ElementStartXToken } from './token/elementStartXToken';
import { GeneralEntityDeclarationXToken } from './token/generalEntityDeclarationXToken';
import { GeneralEntityReferenceXToken } from './token/generalEntityReferenceXToken';
import { NotationDeclarationXToken } from './token/notationDeclarationXToken';
import { ParameterEntityDeclarationXToken } from './token/parameterEntityDeclarationXToken';
import { ParameterEntityReferenceXToken } from './token/parameterEntityReferenceXToken';
import { ProcessingInstructionXToken } from './token/processingInstructionXToken';
import { SpaceXToken } from './token/spaceXtoken';
import { TextDeclarationXToken } from './token/textDeclarationXToken';
import { TextXToken } from './token/textXToken';
import { UnknownDeclarationXToken } from './token/unknownDeclarationXToken';
import { XmlDeclarationXToken } from './token/xmlDeclarationXToken';

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
   | ElementDeclarationXToken
   | ElementEmptyXToken
   | ElementEndXToken
   | ElementStartXToken
   | GeneralEntityDeclarationXToken
   | GeneralEntityEndXToken
   | GeneralEntityReferenceXToken
   | GeneralEntityStartXToken
   | ParameterEntityDeclarationXToken
   | ParameterEntityEndXToken
   | ParameterEntityReferenceXToken
   | ParameterEntityStartXToken
   | ProcessingInstructionXToken
   | NotationDeclarationXToken
   | SpaceXToken
   | TextDeclarationXToken
   | TextXToken
   | UnknownDeclarationXToken
   | XmlDeclarationXToken;

export { XToken };
