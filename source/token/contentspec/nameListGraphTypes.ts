/* Copyright ® 2018 by 柏大衛. All rights reserved. */

type StateId = number;

/*
 * Transition is used to represent an arc from one state to another. It is
 * "triggered" by a name found in the original NameList. The "ref" value
 * is the numeric path to this transition in the original expression.
 * Thus, "foo" in (a, b, ( c | foo | d), z) is at "3/2" (which means the third item
 * the top list, and the second in the list at position three).
 * Note that a ref may contain multiple such paths in the case that this
 * transition has been combined with others.
 */
type Transition = {
   ref: string,
   stateId: StateId,
};

type State = {
   id: StateId
   trans: NameToTransitionMap
   autoTrans?: Array<StateId>
   done?: boolean // true if you can stop when you reach this state.
};

type NameToTransitionMap = {
   [name: string]: Transition
};

type StateIdToStateMap = {
   [stateId: number]: State,
};

type Graph = {
   startId: StateId,
   endId: StateId,
   states: StateIdToStateMap,
}


export { StateId, Transition, State, NameToTransitionMap, StateIdToStateMap, Graph };