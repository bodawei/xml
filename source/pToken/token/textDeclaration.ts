/* Copyright ® 2016-2020 by 柏大衛. All rights reserved. */

import { SToken, STokenSource } from 'basic';

import { InstructionStart } from '../bridge/instruction';
import {
   InstructionField,
   parseFieldedInstruction,
   FieldedInstruction,
} from '../common/fieldedInstruction';

const TEXTDECL_PTOKEN = 'TEXTDECL_PTOKEN';

const PARAM_NAMES = ['version', 'encoding'];

interface RawTextDeclaration {
   open?: SToken;
   openSpace?: SToken;
   target?: SToken;
   targetSpace?: SToken;
   fields?: ReadonlyArray<InstructionField>;
   close?: SToken;
}

function isNotInstructionStart(
   item: InstructionStart | FieldedInstruction | TextDeclarationPToken,
): item is FieldedInstruction | TextDeclarationPToken {
   return 'fields' in item || 'close' in item;
}

class TextDeclarationPToken {
   public readonly type: typeof TEXTDECL_PTOKEN = TEXTDECL_PTOKEN;

   public readonly open: SToken;

   public readonly openSpace?: SToken;

   public readonly target?: SToken;

   public readonly targetSpace?: SToken;

   public readonly fields: ReadonlyArray<InstructionField> = [];

   public readonly close?: SToken;

   constructor(
      base: TextDeclarationPToken | InstructionStart | FieldedInstruction,
      other: RawTextDeclaration = {},
   ) {
      this.open = other.open ?? base.open;
      this.openSpace = 'openSpace' in other ? other.openSpace : base.openSpace;
      this.target = 'target' in other ? other.target : base.target;
      this.targetSpace = 'targetSpace' in other ? other.targetSpace : base.targetSpace;
      this.fields = [];

      if (isNotInstructionStart(base)) {
         this.fields = base.fields || [];
         this.close = base.close;
      }

      this.fields = 'fields' in other ? other.fields || [] : this.fields;
      this.close = 'close' in other ? other.close : this.close;
   }
}

/**********************************************************************\
 parseTextDeclaration() extracts the STokens of a Text Declaration.

 This assumes that the "<?xml " has already been processed, and those
 STokens are passed in through instStart.

 PARAM
 source: A STokenSource to read from
 instStart: The portion of the data already parsed into an InstructionStart
 deliverPToken: Callback to deliver the PToken
\**********************************************************************/

function parseTextDeclaration(
   source: STokenSource,
   instStart: InstructionStart,
   deliverPToken: (result: TextDeclarationPToken) => void,
): void {
   parseFieldedInstruction(source, instStart, PARAM_NAMES, (protoToken) => {
      deliverPToken(new TextDeclarationPToken(protoToken));
   });
}

export { TEXTDECL_PTOKEN, TextDeclarationPToken, parseTextDeclaration };
