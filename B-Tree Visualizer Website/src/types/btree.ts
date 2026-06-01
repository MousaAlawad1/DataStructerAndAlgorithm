export interface BTreeNode {
  id: string; // Unique identifier for rendering, transitions, and interactive nodes
  keys: number[];
  isLeaf: boolean;
  children: BTreeNode[];
}

export type BTreeActionType =
  | 'search'
  | 'insert_traverse'
  | 'insert_split'
  | 'insert_promote'
  | 'delete_traverse'
  | 'delete_leaf'
  | 'delete_internal'
  | 'delete_borrow'
  | 'delete_merge'
  | 'delete_rebalance'
  | 'success'
  | 'error'
  | 'info';

export interface BTreeSnapshot {
  tree: BTreeNode | null;
  activeNodeId: string | null;
  activeKeyIndex: number | null;
  highlightedNodeIds: string[];
  actionType: BTreeActionType;
  description: string;
  highlightedCodeLines: string[];
  operation: 'Insert' | 'Delete' | 'Search' | 'Init' | 'Reset';
  val: number | null;
  diskAccessCount: number;
}

export interface BTreeHistoryItem {
  tree: BTreeNode | null;
  degree: number;
  label: string;
  timestamp: string;
}

export interface BTreeStats {
  height: number;
  keyCount: number;
  nodeCount: number;
  leafCount: number;
  minDegree: number;
  maxKeys: number;
  avgOccupancy: number; // Percentage of space filled
  diskAccessesSimulated: number;
}

export const PSEUDOCODE_TEMPLATES = {
  Insert: [
    { id: 'ins_start', text: 'B-Tree-Insert(T, k):', indent: 0 },
    { id: 'ins_root_check', text: '  r = T.root', indent: 0 },
    { id: 'ins_root_full', text: '  if r.n == 2t - 1 // Root is full', indent: 0 },
    { id: 'ins_new_root', text: '    s = Allocate-Node()', indent: 1 },
    { id: 'ins_set_root', text: '    T.root = s; s.leaf = false; s.c[1] = r', indent: 2 },
    { id: 'ins_split_root', text: '    B-Tree-Split-Child(s, 1, r) // Split old root', indent: 2 },
    { id: 'ins_insert_nonfull_root', text: '    B-Tree-Insert-Nonfull(s, k)', indent: 2 },
    { id: 'ins_else', text: '  else', indent: 0 },
    { id: 'ins_insert_nonfull', text: '    B-Tree-Insert-Nonfull(r, k)', indent: 1 },
    { id: 'split_start', text: 'B-Tree-Split-Child(x, i, y):', indent: 0 },
    { id: 'split_alloc', text: '  z = Allocate-Node(); z.leaf = y.leaf', indent: 1 },
    { id: 'split_move_keys', text: '  z.n = t - 1; move last t-1 keys from y to z', indent: 1 },
    { id: 'split_move_children', text: '  if not y.leaf: move last t children from y to z', indent: 1 },
    { id: 'split_adjust_y', text: '  y.n = t - 1 // Shrink y to t-1 keys', indent: 1 },
    { id: 'split_insert_child', text: '  insert z as x.c[i+1] // Insert z in parent x', indent: 1 },
    { id: 'split_promote_key', text: '  insert y.keys[t] in x.keys[i] // Promote median key', indent: 1 },
  ],
  Delete: [
    { id: 'del_start', text: 'B-Tree-Delete(T, k):', indent: 0 },
    { id: 'del_root_check', text: '  if T.root is empty: return', indent: 1 },
    { id: 'del_call', text: '  B-Tree-Delete-Key(T.root, k)', indent: 1 },
    { id: 'del_root_shrink', text: '  if T.root has 0 keys and is not leaf:', indent: 1 },
    { id: 'del_new_root', text: '    T.root = T.root.c[1] // Shrink height', indent: 2 },
    { id: 'del_key_start', text: 'B-Tree-Delete-Key(x, k):', indent: 0 },
    { id: 'del_leaf', text: '  if x.leaf: delete k from x // Case 1: Simple leaf delete', indent: 1 },
    { id: 'del_internal', text: '  else if k is in x: // Case 2: Internal node delete', indent: 1 },
    { id: 'del_internal_pred', text: '    if left child y has >= t keys: replace with predecessor', indent: 2 },
    { id: 'del_internal_succ', text: '    else if right child z has >= t keys: replace with successor', indent: 2 },
    { id: 'del_internal_merge', text: '    else merge k and z into y, delete k recursively', indent: 2 },
    { id: 'del_descend', text: '  else: // Case 3: Key not in x. Descend with rebalancing', indent: 1 },
    { id: 'del_descend_check', text: '    let c = child containing k. if c.n == t - 1:', indent: 2 },
    { id: 'del_borrow_left', text: '      if left sibling has >= t keys: borrow from left', indent: 3 },
    { id: 'del_borrow_right', text: '      else if right sibling has >= t keys: borrow from right', indent: 3 },
    { id: 'del_merge_siblings', text: '      else merge c with a sibling (left or right)', indent: 3 },
    { id: 'del_recurse', text: '    B-Tree-Delete-Key(appropriate_child, k)', indent: 2 },
  ],
  Search: [
    { id: 'sea_start', text: 'B-Tree-Search(x, k):', indent: 0 },
    { id: 'sea_loop', text: '  i = 1', indent: 1 },
    { id: 'sea_find', text: '  while i <= x.n and k > x.keys[i]: i = i + 1', indent: 1 },
    { id: 'sea_match', text: '  if i <= x.n and k == x.keys[i]: return (x, i) // Found!', indent: 1 },
    { id: 'sea_leaf', text: '  if x.leaf: return NIL // Not found', indent: 1 },
    { id: 'sea_recurse', text: '  else: return B-Tree-Search(x.c[i], k) // Traverse', indent: 1 },
  ],
};
