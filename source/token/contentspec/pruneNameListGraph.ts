/* Copyright ® 2018 by 柏大衛. All rights reserved. */

import { StateIdToStateMap, Graph } from './nameListGraphTypes';

function pruneNameListGraph(graph: Graph): void {
   const newStates: StateIdToStateMap = {};
   const oldStates = graph.states;
   newStates[graph.startId] = oldStates[graph.startId];
   newStates[graph.endId] = oldStates[graph.endId];

   Object.keys(oldStates).forEach((stateId) => {
      const id = parseInt(stateId, 10);
      const state = oldStates[id];

      // Remove empty autoTrans values
      if (state.autoTrans && state.autoTrans.length === 0) {
         delete state.autoTrans;
      }

      // Assemble the set of states actually being used
      Object.keys(state.trans).forEach((name) => {
         const trans = state.trans[name];
         newStates[trans.stateId] = oldStates[trans.stateId];
      });
   });

   graph.states = newStates;
}

export default pruneNameListGraph;