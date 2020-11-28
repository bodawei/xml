/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource, strOrBlank } from 'sToken';

type DeliverContentSpec = (pToken?: ContentSpecP) => void;
type InnerDeliverContentSpec = (pToken: ContentSpecProps) => void;

type DelimiterType = 'ANY' | 'CHOICE' | 'SEQUENCE';

interface ContentSpecProps {
   open?: SToken;
   openSpace?: SToken;
   names?: Array<ContentParticleProps>;
   close?: SToken;
   closeSpace?: SToken;
   repeat?: SToken;
   repeatSpace?: SToken;
}

interface NameProps {
   name?: SToken;
   nameSpace?: SToken;
   repeat?: SToken;
   repeatSpace?: SToken;
}

interface ContentParticleProps {
   particle?: NameProps | ContentSpecProps;
   delimiter?: SToken;
   delimiterSpace?: SToken;
}

interface ContentParticleP {
   readonly particle?: NameP | ContentSpecP;
   readonly delimiter?: SToken;
   readonly delimiterSpace?: SToken;
}

type NameP = Readonly<NameProps>;

class ContentSpecP {
   public readonly open?: SToken;

   public readonly openSpace?: SToken;

   public readonly names: Array<ContentParticleP>;

   public readonly close?: SToken;

   public readonly closeSpace?: SToken;

   public readonly repeat?: SToken;

   public readonly repeatSpace?: SToken;

   constructor(props: ContentSpecP | ContentSpecProps, other?: ContentSpecProps) {
      this.open = props.open;
      this.openSpace = props.openSpace;
      this.names = props.names || [];
      this.close = props.close;
      this.closeSpace = props.closeSpace;
      this.repeat = props.repeat;
      this.repeatSpace = props.repeatSpace;

      if (other) {
         this.open = 'open' in other ? other.open : this.open;
         this.openSpace = 'openSpace' in other ? other.openSpace : this.openSpace;
         this.names = 'names' in other ? other.names || [] : this.names;
         this.close = 'close' in other ? other.close : this.close;
         this.closeSpace = 'closeSpace' in other ? other.closeSpace : this.closeSpace;
         this.repeat = 'repeat' in other ? other.repeat : this.repeat;
         this.repeatSpace = 'repeatSpace' in other ? other.repeatSpace : this.repeatSpace;
      }
   }
}

function parseDelimiter(
   source: STokenSource,
   token: ContentSpecProps,
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
   deliverName: (name: NameP) => void,
) {
   const name: NameProps = {};

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
   props: ContentSpecProps,
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

      props.names = props.names || [];
      props.names.push(particle);

      if (charSToken.str === '(') {
         // eslint-disable-next-line @typescript-eslint/no-use-before-define
         parseContentSpec(source, (listPToken) => {
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
 parseContentSpec() extracts the STokens for a () enclosed series of word.
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

function parseContentSpec(source: STokenSource, deliverContentSpec: DeliverContentSpec): void {
   const props: ContentSpecProps = {};

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

            deliverContentSpec(new ContentSpecP(withNames));
         });
      });
   });
}

export { ContentSpecP, parseContentSpec };
