/* Copyright ® 2018-2020 by 柏大衛. All rights reserved. */

import { CmStateIdToCmStateMap, CmGraph } from './cmGraphTypes';

function pruneCmGraph(graph: CmGraph): CmGraph {
   const oldStates = graph.states;
   const newStates: CmStateIdToCmStateMap = {
      [graph.startId]: oldStates[graph.startId],
      [graph.endId]: oldStates[graph.endId],
   };
   const states = Object.values(oldStates);

   for (const state of states) {
      // Remove empty autoTrans values
      if (state.autoTrans && state.autoTrans.length === 0) {
         delete state.autoTrans;
      }

      // copy or re-copy each state that is being used in a transition
      // from the old graph to the new one. This has the side effect
      // of removing any states that are not being used.
      const transMaps = Object.values(state.trans);

      for (const trans of transMaps) {
         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
         newStates[trans!.stateId] = oldStates[trans!.stateId];
      }
   }

   return {
      endId: graph.endId,
      startId: graph.startId,
      states: newStates,
   };
}

export { pruneCmGraph };
