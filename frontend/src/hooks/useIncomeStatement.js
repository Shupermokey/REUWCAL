import { useMemo, useState } from "react";
import { IS } from "../utils/income/incomeStatement"

// returns: flatList for UI, values map, setters, and a compute(ctx)
export function useIncomeStatement(initialNodes) {
  const [nodes, setNodes] = useState(initialNodes); // array of {id, parentId, label, type, value, children[]...}

  const ctx = useMemo(() => {
    const map = new Map(nodes.map(n => [n.id, n]));
    return {
      node: (id) => map.get(id),
      value: (id) => {
        const n = map.get(id);
        if (!n) return 0;
        if (n.type === "line") return Number(n.value) || 0;
        if (typeof n.formula === "function") return Number(n.formula(ctx)) || 0;
        return 0;
      },
      children: (groupId, { exclude=[] } = {}) => {
        const g = map.get(groupId);
        if (!g?.children) return [];
        return g.children.filter(id => !exclude.includes(id));
      }
    };
  }, [nodes]);

  // Drag: using dnd-kit/react-beautiful-dnd you’ll update setNodes to move the node and its subtree
  const moveNodeWithSubtree = (dragId, dropParentId, index) => {
    // implementation detail: reparent dragId and splice subtree in target.children at index
    // (left out for brevity)
    setNodes(nextNodes);
  };

  return { nodes, setNodes, ctx, moveNodeWithSubtree };
}
