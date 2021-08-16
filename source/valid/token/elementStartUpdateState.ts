/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken, pTokenArrayToString } from 'pToken';
import { SToken, strOrBlank } from 'sToken';
import { ElementStartPToken, ElementEmptyPToken, ELEMENT_EMPTY_PTOKEN } from 'token';

import {
   ElementContext,
   ElDeclType,
   ValidityState,
   ValidityStateProps,
} from '../common/validityState';

function updateFromAttributes(
   el: ElementStartPToken | ElementEmptyPToken,
   state: ValidityState,
): ValidityStateProps {
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

function updateCurrentElContext(elName: string, state: ValidityState): ValidityState {
   const activeContext = state.elementContext.activeContext;

   if (activeContext?.details.type === ElDeclType.ELEMENT) {
      const currentState = activeContext.details.graph.states[activeContext.stateId];
      const destState = currentState.trans[elName];

      if (destState) {
         const newContext: ElementContext = { ...activeContext, stateId: destState.stateId };
         const temp = [...state.elementContext.contextStack];
         temp.pop();
         temp.push(newContext);

         return {
            ...state,
            elementContext: {
               ...state.elementContext,
               activeContext: newContext,
               contextStack: temp,
            },
         };
      }
   }

   return state;
}

function elementStartUpdateState(
   el: ElementStartPToken | ElementEmptyPToken,
   state: ValidityState,
): ValidityState {
   const elName = strOrBlank(el.name);
   const details = state.elements[elName];
   const newState: ValidityState = updateCurrentElContext(elName, state);
   let context: ElementContext;
   let elementContext = newState.elementContext;

   if (el.type === ELEMENT_EMPTY_PTOKEN) {
      // Why are we only checking empty elements?
      // And why aren't we checking the end more often?
      // And might it be better to check all conditions even if past the end?
      if (newState.elementContext.contextStack.length === 0) {
         elementContext = {
            ...state.elementContext,
            pastEnd: true,
         };
      }
   } else {
      if (details) {
         context = {
            details,
            lastToken: undefined,
            parentName: elName,
            stateId: details.type === ElDeclType.ELEMENT ? details.graph.startId : 0,
         };
      } else {
         // @@@@ this seems like we should be reporting an error here.  What error is that?
         context = {
            details: {
               isExternalMarkupDeclaration: state.dtdContext.inExternalMarkupContext,
               // Add a dummy declaration to keep the types happy.
               token: new ElementDeclarationPToken({
                  open: new SToken('<!', '<!', []),
               }),
               type: ElDeclType.ANY,
            },
            lastToken: undefined,
            parentName: elName,
            stateId: 0,
         };
      }

      const newElementContxt = newState.elementContext;
      elementContext = {
         ...newElementContxt,
         activeContext: context,
         contextStack: [...newElementContxt.contextStack, context],
      };
   }

   const attrState = updateFromAttributes(el, state);

   return {
      ...newState,
      elementContext,
      idRefs: attrState.idRefs ?? newState.idRefs,
      ids: attrState.ids ?? newState.ids,
   };
}

export { elementStartUpdateState };
