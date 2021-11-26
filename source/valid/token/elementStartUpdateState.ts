/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { pTokenArrayToString } from 'pToken';
import { strOrBlank } from 'sToken';
import { ElementStartPToken, ElementEmptyPToken, ELEMENT_EMPTY_PTOKEN } from 'token';

import {
   ElementContext,
   ElDeclType,
   IdMap,
   IdRefMap,
   ValidityState,
} from '../common/validityState';

interface Ids {
   ids: IdMap;
   idRefs: IdRefMap;
}

function updateFromAttributes(
   el: ElementStartPToken | ElementEmptyPToken,
   state: ValidityState,
): Ids {
   const ids = { ...state.ids };
   const idRefs = { ...state.idRefs };
   const elName = strOrBlank(el.name);
   const attDefs = state.attributes[elName];

   if (!attDefs) {
      return { idRefs, ids };
   }

   // Store all ID attribute values that we find for future use in enforcing §3.3.1 validity
   // constraints (see, in particular, docEndValidate())
   for (const att of el.attributes) {
      const attName = strOrBlank(att.name);
      const attValue = pTokenArrayToString(att.value);
      const defType = strOrBlank(attDefs[attName]?.def.type).toUpperCase();

      if (defType === 'ID' && !ids[attValue]) {
         ids[attValue] = {
            attName,
            elName,
         };
      }

      // Store all IDREF attribute values that we find for future use in enforcing §3.3.1 validity
      // constraints (see, in particular, docEndValidate())
      let refs: Array<string> = [];

      if (defType === 'IDREF') {
         refs = [attValue];
      } else if (defType === 'IDREFS') {
         refs = attValue.trim().split(/ +/);
      }

      for (const refValue of refs) {
         // Do not store reference values that we aready know their targets
         if (ids[refValue]) {
            continue;
         }

         idRefs[refValue] = idRefs[refValue] ?? {
            attName,
            elName,
            sToken: att.name,
         };
      }
   }

   return {
      idRefs,
      ids,
   };
}

function updateCurrentElContext(
   elName: string,
   state: ValidityState,
): ValidityState['elementContext'] {
   const stack = state.elementContext.contextStack;
   const curContext = stack[stack.length - 1] as ElementContext | undefined;

   if (curContext?.details.type !== ElDeclType.ELEMENT) {
      return state.elementContext;
   }

   const currentState = curContext.details.graph.states[curContext.stateId];
   const destState = currentState.trans[elName];

   if (destState) {
      const newContext: ElementContext = { ...curContext, stateId: destState.stateId };
      const temp = [...state.elementContext.contextStack];
      temp.pop();
      temp.push(newContext);

      return {
         ...state.elementContext,
         contextStack: temp,
      };
   }

   return state.elementContext;
}

function elementStartUpdateState(
   el: ElementStartPToken | ElementEmptyPToken,
   state: ValidityState,
): ValidityState {
   const elName = strOrBlank(el.name);
   const details = state.elements[elName];
   let newElementContxt = updateCurrentElContext(elName, state);
   let context: ElementContext;

   if (el.type !== ELEMENT_EMPTY_PTOKEN) {
      if (details) {
         context = {
            details,
            lastToken: undefined,
            parentName: elName,
            stateId: details.type === ElDeclType.ELEMENT ? details.graph.startId : 0,
         };
      } else {
         context = {
            details: {
               isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
               type: ElDeclType.ANY,
            },
            lastToken: undefined,
            parentName: elName,
            stateId: 0,
         };
      }

      newElementContxt = {
         ...newElementContxt,
         contextStack: [...newElementContxt.contextStack, context],
      };
   }

   const attrState = updateFromAttributes(el, state);

   if (newElementContxt.contextStack.length === 0) {
      newElementContxt = {
         ...newElementContxt,
         pastEnd: true,
      };
   }

   return {
      ...state,
      elementContext: newElementContxt,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- alwaysdefined by updateFromAttributes()
      idRefs: attrState.idRefs,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- alwaysdefined by updateFromAttributes()
      ids: attrState.ids,
   };
}

export { elementStartUpdateState };
