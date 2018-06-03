import { XNameList, XName, isXName } from '../token/common/nameList'

type StateID = number;

type Transition = {
   ref: string,
   stateId: StateID,
};

type State = {
   id: StateID,
   autoTrans: Array<StateID>
   trans: {
      [name: string]: Array<Transition>,
   },
};

type StateMap = {
   [id: number]: State,
};

type Graph = {
   start: StateID,
   end: StateID,
   states: StateMap,
}

let stateId = -1;

function makeState(graph?: Graph): State {
   stateId ++;

   const state: State = {
      id: stateId,
      autoTrans: [],
      trans: {}
   };

   if (graph) {
      graph.states[stateId] = state;
   }

   return state;
}

function addAutoTrans(state: State, autoTransToState: State): void {
   const index = state.autoTrans.indexOf(autoTransToState.id);
   
   if (index === -1) {
      state.autoTrans.push(autoTransToState.id);
   }
}

function addTrans(sourceState: State, destState: State, transName: string, transRef: string): void {
   sourceState.trans[transName] = [];
   sourceState.trans[transName].push({
      ref: transRef,
      stateId: destState.id,
   });
}

function processList(list: XNameList, start: State, end: State, baseRef: string): Graph {
   const graph: Graph = {
      start: start.id,
      end: end.id,
      states: {
         [start.id]: start,
         [end.id]: end,
      },
   };

   switch (list.repeat) {
      case 'ZEROONE':
         addAutoTrans(start, end);
         break;
      case 'ZEROPLUS':
         addAutoTrans(start, end);
         addAutoTrans(end, start);
         break;
      case 'ONE':
         // nothing.
         break;
      case 'ONEPLUS':
         addAutoTrans(end, start);
         break;
   }

   if (list.listType === 'CHOICE') {
      processChoiceList(list, graph, baseRef);
   } else {
      processSequenceList(list, graph, baseRef);
   }

   return graph;
}

function processXName(graph: Graph, name: XName, current: State, next: State, transRef: string): void {
   switch(name.repeat) {
      case 'ZEROONE':
         addAutoTrans(current, next);
         addTrans(current, next, name.name, transRef);
         break;
      case 'ZEROPLUS':
         const zpMid = makeState(graph);
         addAutoTrans(current, next);
         addAutoTrans(zpMid, next);
         addTrans(current, zpMid, name.name, transRef);
         addTrans(zpMid, zpMid, name.name, transRef);
         break;
      case 'ONE':
         addTrans(current, next, name.name, transRef);
         break;
      case 'ONEPLUS':
         const opMid = makeState(graph);
         addAutoTrans(opMid, next);
         addTrans(current, opMid, name.name, transRef);
         addTrans(opMid, opMid, name.name, transRef);
         break;
   }
}

function processXNameSequence(graph: Graph, name: XName, current: State, next: State, transRef: string): void {
   switch(name.repeat) {
      case 'ZEROONE':
         addAutoTrans(current, next);
         addTrans(current, next, name.name, transRef);
         break;
      case 'ZEROPLUS':
         addAutoTrans(current, next);
         addTrans(current, current, name.name, transRef);
         break;
      case 'ONE':
         addTrans(current, next, name.name, transRef);
         break;
      case 'ONEPLUS':
         const opMid = makeState(graph);
         addAutoTrans(opMid, next);
         addTrans(current, opMid, name.name, transRef);
         addTrans(opMid, opMid, name.name, transRef);
         break;
   }
}

// Choicelists, we always create a new state for sublists to start from (since at this point we don't want to deal with conflicts)
// we also always create a state at the end.  This is used, in some cases, for loops back to the start. 
function processChoiceList(list: XNameList, graph: Graph, refBase: string): void {
   for (let index = 0; index < list.names.length; index++) {
      const particle = list.names[index];
      const start = graph.states[graph.start];
      const end = graph.states[graph.end];

      if (isXName(particle)) {
         processXName(graph, particle, start, end, `${refBase}${index + 1}`);
      } else {
         const innerGraph = processList(particle, makeState(), makeState(), `${refBase}${index + 1},`);
         graph.states = Object.assign(graph.states, innerGraph.states) as StateMap;
         addAutoTrans(start, innerGraph.states[innerGraph.start]);
         addAutoTrans(innerGraph.states[innerGraph.end], end);
      }
   }
}

// Sequence lists, we always start from the current state (we don't need to worry about conflicts), but we do need an extra state at the end to branch from.
function processSequenceList(list: XNameList, graph: Graph, refBase: string): void {
   let current = graph.states[graph.start];
   let next: State;

   for (let index = 0; index < list.names.length; index++) {
      const particle = list.names[index];

      if (index === list.names.length -1) {
         next = graph.states[graph.end];
      } else {
         next = makeState(graph);
      }

      if (isXName(particle)) {
         processXNameSequence(graph, particle, current, next, `${refBase}${index + 1}`);
      } else {
         const innerGraph = processList(particle, current, makeState(), `${refBase}${index + 1},`);
         graph.states = Object.assign(graph.states, innerGraph.states) as StateMap;
         addAutoTrans(innerGraph.states[innerGraph.end], next);
      }

      current = next;
   }
}

function convertList(list: XNameList): Graph {
   stateId = -1;
   const result = processList(list, makeState(), makeState(), '');

   return result;
}

// Convert to remove autoTransitions

//looping auto-transitions are going to be puzzling.  What should we do with those?

export {
   convertList,
}