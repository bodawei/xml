/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource, strOrBlank } from 'sToken';

type DeliverContentSpec = (pToken?: ContentModelP) => void;
type InnerDeliverContentSpec = (pToken: ContentModelProps) => void;

type DelimiterType = 'ANY' | 'CHOICE' | 'SEQUENCE';

interface ContentModelProps {
   open?: SToken;
   openSpace?: SToken;
   particles?: Array<ContentParticleProps>;
   close?: SToken;
   closeSpace?: SToken;
   repeat?: SToken;
   repeatSpace?: SToken;
}

interface ContentNameProps {
   name?: SToken;
   nameSpace?: SToken;
   repeat?: SToken;
   repeatSpace?: SToken;
}

interface ContentParticleProps {
   particle?: ContentNameProps | ContentModelProps;
   delimiter?: SToken;
   delimiterSpace?: SToken;
}

interface ContentParticleP {
   readonly particle?: ContentNameP | ContentModelP;
   readonly delimiter?: SToken;
   readonly delimiterSpace?: SToken;
}

type ContentNameP = Readonly<ContentNameProps>;

class ContentModelP {
   public readonly open?: SToken;

   public readonly openSpace?: SToken;

   public readonly particles: Array<ContentParticleP>;

   public readonly close?: SToken;

   public readonly closeSpace?: SToken;

   public readonly repeat?: SToken;

   public readonly repeatSpace?: SToken;

   constructor(props: ContentModelP | ContentModelProps, other?: ContentModelProps) {
      this.open = props.open;
      this.openSpace = props.openSpace;
      this.particles = props.particles || [];
      this.close = props.close;
      this.closeSpace = props.closeSpace;
      this.repeat = props.repeat;
      this.repeatSpace = props.repeatSpace;

      if (other) {
         this.open = 'open' in other ? other.open : this.open;
         this.openSpace = 'openSpace' in other ? other.openSpace : this.openSpace;
         this.particles = 'particles' in other ? other.particles || [] : this.particles;
         this.close = 'close' in other ? other.close : this.close;
         this.closeSpace = 'closeSpace' in other ? other.closeSpace : this.closeSpace;
         this.repeat = 'repeat' in other ? other.repeat : this.repeat;
         this.repeatSpace = 'repeatSpace' in other ? other.repeatSpace : this.repeatSpace;
      }
   }
}

function isContentModelP(item: ContentModelP | ContentNameP): item is ContentModelP {
   if ('name' in item || 'nameSpace' in item) {
      return false;
   }

   if (
      'open' in item ||
      'openSpace' in item ||
      'particles' in item ||
      'close' in item ||
      'closeSpace' in item
   ) {
      return true;
   }

   return false;
}

function parseDelimiter(
   source: STokenSource,
   token: ContentModelProps,
   particle: ContentParticleProps,
   delimiterType: DelimiterType,
   deliverContentSpec: InnerDeliverContentSpec,
): void {
   let delimMatch;

   switch (delimiterType) {
      case 'CHOICE':
         delimMatch = ['|'];
         break;
      case 'SEQUENCE':
         delimMatch = [','];
         break;
      default:
         delimMatch = ['|', ','];
         break;
   }

   source.extractToObject('multi', delimMatch, particle, 'delimiter');
   source.extractNoParams('space', (delimiterSpace) => {
      particle.delimiterSpace = delimiterSpace;

      let newDelimiterType = delimiterType;

      if (particle.delimiter && delimiterType === 'ANY') {
         newDelimiterType = strOrBlank(particle.delimiter) === ',' ? 'SEQUENCE' : 'CHOICE';
      }

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      parseNames(source, token, newDelimiterType, deliverContentSpec);
   });
}

function parseName(
   source: STokenSource,
   wordDelims: Array<string>,
   deliverName: (name: ContentNameProps) => void,
) {
   const name: ContentNameProps = {};

   source.extractToObject('word', wordDelims, name, 'name');
   source.extractToObjectNoParams('space', name, 'nameSpace');
   source.extractToObject('multi', ['?', '*', '+'], name, 'repeat');
   source.extractNoParams('space', (repeatSpace) => {
      name.repeatSpace = repeatSpace;
      deliverName(name);
   });
}

function parseNames(
   source: STokenSource,
   props: ContentModelProps,
   delimterType: DelimiterType,
   deliverContentSpec: InnerDeliverContentSpec,
): void {
   source.extractNoParams('peekChar', (charSToken) => {
      if (
         !charSToken ||
         charSToken.str === '>' ||
         charSToken.str === ')' ||
         charSToken.str === '%'
      ) {
         deliverContentSpec(props);
         return;
      }

      const particle: ContentParticleProps = {};

      props.particles = props.particles || [];
      props.particles.push(particle);

      if (charSToken.str === '(') {
         // eslint-disable-next-line @typescript-eslint/no-use-before-define
         parseContentModel(source, (listPToken) => {
            particle.particle = listPToken;
            parseDelimiter(source, props, particle, delimterType, deliverContentSpec);
         });
      } else {
         const wordDelims = [')', '%', '>', '?', '*', '+', '('];

         switch (delimterType) {
            case 'CHOICE':
               wordDelims.unshift('|');
               break;
            case 'SEQUENCE':
               wordDelims.unshift(',');
               break;
            default:
               wordDelims.unshift(',');
               wordDelims.unshift('|');
               break;
         }

         parseName(source, wordDelims, (name) => {
            particle.particle = name;
            parseDelimiter(source, props, particle, delimterType, deliverContentSpec);
         });
      }
   });
}

/**********************************************************************\
 parseContentModel() extracts the STokens for a () enclosed series of word.
 This is used in the various syntax constructions listed below.
 It will stop any time it encounters a % character.

 PARAM
   source: An STokenSource to read from
   deliverContentSpec: Callback to deliver the PTokens

 SYNTAX
   §3.2.1
   [47] children       ::= (choice | seq) ('?' | '*' | '+')?
   [48] cp             ::= (Name | choice | seq) ('?' | '*' | '+')?
   [49] choice         ::= '(' S? cp ( S? '|' S? cp )+ S? ')'
   [50] seq            ::= '(' S? cp ( S? ',' S? cp )* S? ')'
   §3.2.2
   [51] Mixed          ::= '(' S? '#PCDATA' (S? '|' S? Name)* S? ')*'
                           | '(' S? '#PCDATA' S? ')'
\**********************************************************************/

function parseContentModel(source: STokenSource, deliverContentSpec: DeliverContentSpec): void {
   const props: ContentModelProps = {};

   source.extract('match', '(', (charSToken) => {
      if (!charSToken) {
         deliverContentSpec();
         return;
      }

      props.open = charSToken;
      source.extractToObjectNoParams('space', props, 'openSpace');

      parseNames(source, props, 'ANY', (withNames) => {
         source.extractToObject('match', ')', withNames, 'close');
         source.extractToObjectNoParams('space', withNames, 'closeSpace');
         source.extractToObject('multi', ['?', '*', '+'], withNames, 'repeat');
         source.extractNoParams('space', (spaceSToken?) => {
            withNames.repeatSpace = spaceSToken;

            deliverContentSpec(new ContentModelP(withNames));
         });
      });
   });
}

export { ContentModelP, ContentNameP, isContentModelP, parseContentModel };
