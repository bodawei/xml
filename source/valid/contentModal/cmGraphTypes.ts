/* Copyright ® 2018 by 柏大衛. All rights reserved. */

type CmStateId = number;

/*
 * CmTransition is used to represent an arc from one Cmstate to another. It is
 * "triggered" by a name found in the original NameList. The "ref" value
 * is the numeric path to this Cmtransition in the original expression.
 * Thus, "foo" in (a, b, ( c | foo | d), z) is at "3/2" (which means the third item
 * the top list, and the second in the list at position three).
 * Note that a ref may contain multiple such paths in the case that this
 * Cmtransition has been combined with others.
 */
interface CmTransition {
   ref: string;
   stateId: CmStateId;
}

interface CmState {
   id: CmStateId;
   trans: CnNameToCmTransitionMap;
   autoTrans?: Array<CmStateId>;
   done?: boolean; // true if you can stop when you reach this Cmstate.
}

interface CnNameToCmTransitionMap {
   [name: string]: CmTransition;
}

interface CmStateIdToCmStateMap {
   [CmstateId: string]: CmState;
}

interface CmGraph {
   startId: CmStateId;
   endId: CmStateId;
   states: CmStateIdToCmStateMap;
}

export {
   CmStateId,
   CmTransition,
   CmState,
   CnNameToCmTransitionMap,
   CmStateIdToCmStateMap,
   CmGraph,
};
