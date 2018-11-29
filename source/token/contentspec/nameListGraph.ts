import nameListToGraph from './nameListToGraph';
import collapseAutoTrans from './collapseAutoTrans';
import pruneNameListGraph from './pruneNameListGraph';

let nameListGraph = {
   nameListToGraph,
   collapseAutoTrans,
   pruneNameListGraph,
};

export default nameListGraph;
export {
   nameListToGraph,
   collapseAutoTrans,
   pruneNameListGraph,
};