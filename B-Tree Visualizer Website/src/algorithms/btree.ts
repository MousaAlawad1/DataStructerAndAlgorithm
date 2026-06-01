import { BTreeNode, BTreeSnapshot, BTreeActionType, BTreeStats } from '../types/btree';

// Node ID generation counter
let nodeIdCounter = 0;
export const resetNodeIdCounter = () => {
  nodeIdCounter = 0;
};

export const generateNodeId = (): string => {
  nodeIdCounter++;
  return `node_${nodeIdCounter}_${Math.random().toString(36).substr(2, 5)}`;
};

// Helper to deeply clone a node
export const cloneNode = (node: BTreeNode): BTreeNode => {
  return {
    id: node.id,
    keys: [...node.keys],
    isLeaf: node.isLeaf,
    children: node.children.map((child) => cloneNode(child)),
  };
};

// Helper to deeply clone the whole tree
export const cloneTree = (root: BTreeNode | null): BTreeNode | null => {
  if (!root) return null;
  return cloneNode(root);
};

// Helper to create a new empty B-Tree Node
export const createNewNode = (isLeaf: boolean = true): BTreeNode => {
  return {
    id: generateNodeId(),
    keys: [],
    isLeaf,
    children: [],
  };
};

// Helper to calculate tree stats
export const getTreeStats = (root: BTreeNode | null, degree: number): BTreeStats => {
  if (!root) {
    return {
      height: 0,
      keyCount: 0,
      nodeCount: 0,
      leafCount: 0,
      minDegree: degree,
      maxKeys: 2 * degree - 1,
      avgOccupancy: 0,
      diskAccessesSimulated: 0,
    };
  }

  let keyCount = 0;
  let nodeCount = 0;
  let leafCount = 0;
  let height = 0;
  let totalOccupancy = 0;

  // Calculate height
  let curr: BTreeNode | null = root;
  while (curr) {
    height++;
    curr = curr.isLeaf ? null : curr.children[0];
  }

  // DFS to count nodes, leaves, and keys
  const dfs = (node: BTreeNode) => {
    nodeCount++;
    keyCount += node.keys.length;
    
    const maxKeys = 2 * degree - 1;
    totalOccupancy += node.keys.length / maxKeys;

    if (node.isLeaf) {
      leafCount++;
    } else {
      node.children.forEach((child) => dfs(child));
    }
  };

  dfs(root);

  return {
    height,
    keyCount,
    nodeCount,
    leafCount,
    minDegree: degree,
    maxKeys: 2 * degree - 1,
    avgOccupancy: Math.round((totalOccupancy / nodeCount) * 100),
    diskAccessesSimulated: height, // height is worst case disk access count for search
  };
};

export class BTreeEngine {
  root: BTreeNode | null = null;
  degree: number; // minimum degree t
  steps: BTreeSnapshot[] = [];
  diskAccessCount = 0;

  constructor(degree: number = 3) {
    this.degree = degree;
    resetNodeIdCounter();
    this.root = createNewNode(true);
  }

  private recordStep(
    activeNodeId: string | null,
    activeKeyIndex: number | null,
    highlightedNodeIds: string[],
    actionType: BTreeActionType,
    description: string,
    codeLines: string[],
    operation: 'Insert' | 'Delete' | 'Search' | 'Init' | 'Reset',
    val: number | null
  ) {
    this.steps.push({
      tree: cloneTree(this.root),
      activeNodeId,
      activeKeyIndex,
      highlightedNodeIds,
      actionType,
      description,
      highlightedCodeLines: codeLines,
      operation,
      val,
      diskAccessCount: this.diskAccessCount,
    });
  }

  // Search Operation
  public search(key: number): BTreeSnapshot[] {
    this.steps = [];
    this.diskAccessCount = 0;

    if (!this.root || this.root.keys.length === 0) {
      this.recordStep(
        null,
        null,
        [],
        'info',
        `The B-Tree is currently empty. Key ${key} could not be searched.`,
        ['sea_start'],
        'Search',
        key
      );
      return this.steps;
    }

    this.diskAccessCount = 1; // Root access
    this.searchRecursive(this.root, key);
    return this.steps;
  }

  private searchRecursive(node: BTreeNode, key: number): BTreeNode | null {
    this.recordStep(
      node.id,
      null,
      [],
      'search',
      `Searching node ${node.id}. Scanning keys to locate range for ${key}.`,
      ['sea_start', 'sea_loop'],
      'Search',
      key
    );

    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      this.recordStep(
        node.id,
        i,
        [],
        'search',
        `Comparing ${key} with key ${node.keys[i]} at index ${i}. Since ${key} > ${node.keys[i]}, continue scanning.`,
        ['sea_find'],
        'Search',
        key
      );
      i++;
    }

    if (i < node.keys.length && key === node.keys[i]) {
      this.recordStep(
        node.id,
        i,
        [node.id],
        'success',
        `🎉 Key ${key} found at index ${i} in node ${node.id}!`,
        ['sea_match'],
        'Search',
        key
      );
      return node;
    }

    if (node.isLeaf) {
      this.recordStep(
        node.id,
        null,
        [node.id],
        'error',
        `❌ Reached leaf node ${node.id} but key ${key} is not found in the tree.`,
        ['sea_leaf'],
        'Search',
        key
      );
      return null;
    }

    // Traverse to child
    this.diskAccessCount++;
    this.recordStep(
      node.id,
      null,
      [node.children[i].id],
      'search',
      `Key ${key} is between index ${i-1} and ${i} keys. Descending to child node at index ${i}. (Disk Access Count = ${this.diskAccessCount})`,
      ['sea_recurse'],
      'Search',
      key
    );

    return this.searchRecursive(node.children[i], key);
  }

  // Insert Operation
  public insert(key: number): BTreeSnapshot[] {
    this.steps = [];
    this.diskAccessCount = 1; // Root access

    if (!this.root) {
      this.root = createNewNode(true);
    }

    this.recordStep(
      null,
      null,
      [],
      'info',
      `Initiating insertion of key ${key} into the B-Tree.`,
      ['ins_start', 'ins_root_check'],
      'Insert',
      key
    );

    const maxKeys = 2 * this.degree - 1;

    if (this.root.keys.length === maxKeys) {
      // Root is full, must split
      this.recordStep(
        this.root.id,
        null,
        [this.root.id],
        'insert_split',
        `Root node ${this.root.id} is full (contains ${maxKeys} keys). Preemptive splitting of root is required before inserting.`,
        ['ins_root_full'],
        'Insert',
        key
      );

      const s = createNewNode(false);
      const oldRoot = this.root;
      s.children.push(oldRoot);
      this.root = s;

      this.diskAccessCount++; // Allocating new root
      this.recordStep(
        s.id,
        null,
        [s.id, oldRoot.id],
        'insert_split',
        `Allocated new root node ${s.id} and set the old root as its child. Preparing to split old root.`,
        ['ins_new_root', 'ins_set_root'],
        'Insert',
        key
      );

      this.splitChild(s, 0, oldRoot, key);
      this.insertNonFull(s, key);
    } else {
      this.insertNonFull(this.root, key);
    }

    // Final Success step
    this.recordStep(
      null,
      null,
      [],
      'success',
      `🎉 Insertion of key ${key} completed successfully! All B-Tree properties maintained.`,
      [],
      'Insert',
      key
    );

    return this.steps;
  }

  private splitChild(parent: BTreeNode, index: number, child: BTreeNode, targetKey: number) {
    const t = this.degree;
    const sibling = createNewNode(child.isLeaf);
    this.diskAccessCount++; // Allocate/write sibling node

    this.recordStep(
      parent.id,
      null,
      [parent.id, child.id, sibling.id],
      'insert_split',
      `Splitting full node ${child.id}. Creating a new sibling node ${sibling.id}.`,
      ['split_start', 'split_alloc'],
      'Insert',
      targetKey
    );

    // Copy the last t-1 keys of child to sibling
    const medianIndex = t - 1;
    const promotedKey = child.keys[medianIndex];

    sibling.keys = child.keys.slice(medianIndex + 1);
    child.keys = child.keys.slice(0, medianIndex);

    this.recordStep(
      parent.id,
      null,
      [child.id, sibling.id],
      'insert_split',
      `Moved last ${t - 1} keys [${sibling.keys.join(', ')}] from split node to sibling. Split node keeps [${child.keys.join(', ')}].`,
      ['split_move_keys'],
      'Insert',
      targetKey
    );

    // Copy children of child to sibling if not leaf
    if (!child.isLeaf) {
      sibling.children = child.children.slice(medianIndex + 1);
      child.children = child.children.slice(0, medianIndex + 1);
      this.recordStep(
        parent.id,
        null,
        [child.id, sibling.id],
        'insert_split',
        `Since nodes are internal, transferred last ${t} children references to the new sibling.`,
        ['split_move_children'],
        'Insert',
        targetKey
      );
    }

    // Insert sibling child reference in parent
    parent.children.splice(index + 1, 0, sibling);
    // Promote median key to parent
    parent.keys.splice(index, 0, promotedKey);

    this.recordStep(
      parent.id,
      index,
      [parent.id, child.id, sibling.id],
      'insert_promote',
      `Promoted the median key ${promotedKey} to parent node ${parent.id} at index ${index}. Inserted sibling node in parent.`,
      ['split_adjust_y', 'split_insert_child', 'split_promote_key'],
      'Insert',
      targetKey
    );
  }

  private insertNonFull(node: BTreeNode, key: number) {
    let i = node.keys.length - 1;
    const maxKeys = 2 * this.degree - 1;

    this.recordStep(
      node.id,
      null,
      [],
      'insert_traverse',
      `Navigating node ${node.id}. Preparing insertion.`,
      ['ins_insert_nonfull'],
      'Insert',
      key
    );

    if (node.isLeaf) {
      // Insert key into leaf
      node.keys.push(0); // expand
      while (i >= 0 && key < node.keys[i]) {
        node.keys[i + 1] = node.keys[i];
        i--;
      }
      node.keys[i + 1] = key;

      this.recordStep(
        node.id,
        i + 1,
        [node.id],
        'success',
        `Leaf node reached! Inserted key ${key} at index ${i + 1} in sorted order.`,
        ['ins_insert_nonfull'],
        'Insert',
        key
      );
    } else {
      // Find child to descend
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      i++;

      const child = node.children[i];
      this.diskAccessCount++; // traverse child

      this.recordStep(
        node.id,
        null,
        [child.id],
        'insert_traverse',
        `Key ${key} belongs in child at index ${i}. Checking if child node ${child.id} requires splitting.`,
        ['ins_insert_nonfull'],
        'Insert',
        key
      );

      if (child.keys.length === maxKeys) {
        // Split full child
        this.recordStep(
          node.id,
          null,
          [child.id],
          'insert_split',
          `Child node ${child.id} is full! Splitting it preemptively.`,
          [],
          'Insert',
          key
        );

        this.splitChild(node, i, child, key);

        // Determine which split node to descend into
        if (key > node.keys[i]) {
          i++;
          this.recordStep(
            node.id,
            null,
            [node.children[i].id],
            'insert_traverse',
            `Since ${key} is greater than promoted key ${node.keys[i-1]}, shifting target to new right sibling child at index ${i}.`,
            [],
            'Insert',
            key
          );
        }
      }

      this.insertNonFull(node.children[i], key);
    }
  }

  // Delete Operation
  public delete(key: number): BTreeSnapshot[] {
    this.steps = [];
    this.diskAccessCount = 1; // Root access

    if (!this.root || this.root.keys.length === 0) {
      this.recordStep(
        null,
        null,
        [],
        'info',
        `The B-Tree is empty. Delete operation for key ${key} aborted.`,
        ['del_start', 'del_root_check'],
        'Delete',
        key
      );
      return this.steps;
    }

    this.recordStep(
      this.root.id,
      null,
      [],
      'info',
      `Initiating deletion of key ${key} from the B-Tree. Starting search at root node.`,
      ['del_start', 'del_call'],
      'Delete',
      key
    );

    this.deleteRecursive(this.root, key);

    // Check if root has empty keys
    if (this.root && this.root.keys.length === 0) {
      if (!this.root.isLeaf) {
        this.recordStep(
          this.root.id,
          null,
          [this.root.id],
          'delete_rebalance',
          `Root node has run out of keys! Shrinking tree height. The first child becomes the new root.`,
          ['del_root_shrink', 'del_new_root'],
          'Delete',
          key
        );
        this.root = this.root.children[0];
      } else {
        // Keeps as an empty leaf
        this.recordStep(
          this.root.id,
          null,
          [],
          'info',
          `Root node is empty leaf. Tree is now completely empty.`,
          [],
          'Delete',
          key
        );
      }
    }

    this.recordStep(
      null,
      null,
      [],
      'success',
      `🎉 Deletion of key ${key} finished successfully! All constraints validated.`,
      [],
      'Delete',
      key
    );

    return this.steps;
  }

  private deleteRecursive(node: BTreeNode, key: number) {
    const t = this.degree;
    let idx = node.keys.indexOf(key);

    this.recordStep(
      node.id,
      idx !== -1 ? idx : null,
      [],
      'delete_traverse',
      `Checking node ${node.id} for key ${key}.`,
      ['del_key_start'],
      'Delete',
      key
    );

    if (idx !== -1) {
      // Case 1: Key is in node, and node is a leaf
      if (node.isLeaf) {
        node.keys.splice(idx, 1);
        this.recordStep(
          node.id,
          null,
          [node.id],
          'success',
          `Case 1: Key ${key} found in leaf node ${node.id}. Deleting key directly.`,
          ['del_leaf'],
          'Delete',
          key
        );
        return;
      }

      // Case 2: Key is in internal node
      this.recordStep(
        node.id,
        idx,
        [node.id],
        'delete_internal',
        `Case 2: Key ${key} is in internal node ${node.id}. We must maintain degree constraints.`,
        ['del_internal'],
        'Delete',
        key
      );

      const left = node.children[idx];
      const right = node.children[idx + 1];

      // Case 2a: Left child has at least t keys. Find predecessor
      if (left.keys.length >= t) {
        this.diskAccessCount++;
        this.recordStep(
          node.id,
          idx,
          [left.id],
          'delete_internal',
          `Case 2a: Left child ${left.id} has ${left.keys.length} keys (>= t=${t}). Finding predecessor of ${key} in this subtree...`,
          ['del_internal_pred'],
          'Delete',
          key
        );

        const pred = this.getPredecessor(left, key);
        node.keys[idx] = pred;

        this.recordStep(
          node.id,
          idx,
          [node.id],
          'delete_internal',
          `Predecessor key is ${pred}. Replacing target key ${key} with ${pred} at index ${idx}, then deleting ${pred} from left subtree.`,
          [],
          'Delete',
          key
        );

        this.deleteRecursive(left, pred);
      }
      // Case 2b: Right child has at least t keys. Find successor
      else if (right.keys.length >= t) {
        this.diskAccessCount++;
        this.recordStep(
          node.id,
          idx,
          [right.id],
          'delete_internal',
          `Case 2b: Left child had too few keys, but right child ${right.id} has ${right.keys.length} keys (>= t=${t}). Finding successor...`,
          ['del_internal_succ'],
          'Delete',
          key
        );

        const succ = this.getSuccessor(right, key);
        node.keys[idx] = succ;

        this.recordStep(
          node.id,
          idx,
          [node.id],
          'delete_internal',
          `Successor key is ${succ}. Replacing target key ${key} with ${succ} at index ${idx}, then deleting ${succ} from right subtree.`,
          [],
          'Delete',
          key
        );

        this.deleteRecursive(right, succ);
      }
      // Case 2c: Both children have t-1 keys. Merge key and right into left
      else {
        this.recordStep(
          node.id,
          idx,
          [left.id, right.id],
          'delete_merge',
          `Case 2c: Both immediate children ${left.id} and ${right.id} have only t-1 (${t-1}) keys. Merging key ${key} and sibling ${right.id} into ${left.id}.`,
          ['del_internal_merge'],
          'Delete',
          key
        );

        left.keys.push(key);
        left.keys.push(...right.keys);
        if (!left.isLeaf) {
          left.children.push(...right.children);
        }

        node.keys.splice(idx, 1);
        node.children.splice(idx + 1, 1);

        this.recordStep(
          node.id,
          null,
          [left.id],
          'delete_merge',
          `Merged completed. Node ${left.id} now contains [${left.keys.join(', ')}]. Parent lost key and sibling child reference. Deleting ${key} recursively.`,
          [],
          'Delete',
          key
        );

        this.deleteRecursive(left, key);
      }
    } else {
      // Key not in internal node, descend to appropriate child
      if (node.isLeaf) {
        this.recordStep(
          node.id,
          null,
          [],
          'error',
          `❌ Reached leaf node ${node.id} but key ${key} is not present in tree. Deletion failed.`,
          [],
          'Delete',
          key
        );
        return;
      }

      // Find child index
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) {
        i++;
      }

      const child = node.children[i];
      this.recordStep(
        node.id,
        null,
        [child.id],
        'delete_traverse',
        `Key ${key} belongs in subtree child ${child.id} at index ${i}. Checking rebalancing rules.`,
        ['del_descend', 'del_descend_check'],
        'Delete',
        key
      );

      if (child.keys.length === t - 1) {
        // Child has only t-1 keys! Must rebalance to have >= t keys
        this.recordStep(
          node.id,
          null,
          [child.id],
          'delete_rebalance',
          `Rebalance triggered! Child node ${child.id} has only t-1 (${t-1}) keys. We must borrow or merge to maintain B-Tree height invariant before descending.`,
          [],
          'Delete',
          key
        );

        const leftSibling = i > 0 ? node.children[i - 1] : null;
        const rightSibling = i < node.children.length - 1 ? node.children[i + 1] : null;

        // Case 3a: Sibling has >= t keys, borrow key
        if (leftSibling && leftSibling.keys.length >= t) {
          this.recordStep(
            node.id,
            null,
            [child.id, leftSibling.id],
            'delete_borrow',
            `Case 3a (Left Sibling Borrow): Left sibling ${leftSibling.id} has ${leftSibling.keys.length} keys (>= t). Borrowing key...`,
            ['del_borrow_left'],
            'Delete',
            key
          );

          // Shift keys in child
          child.keys.unshift(node.keys[i - 1]);
          if (!child.isLeaf) {
            child.children.unshift(leftSibling.children.pop()!);
          }
          node.keys[i - 1] = leftSibling.keys.pop()!;

          this.recordStep(
            node.id,
            i - 1,
            [node.id, child.id, leftSibling.id],
            'delete_borrow',
            `Borrow completed: Shifted parent key ${child.keys[0]} down to child, and promoted left sibling's largest key ${node.keys[i-1]} to parent.`,
            [],
            'Delete',
            key
          );

          this.deleteRecursive(child, key);
        } else if (rightSibling && rightSibling.keys.length >= t) {
          this.recordStep(
            node.id,
            null,
            [child.id, rightSibling.id],
            'delete_borrow',
            `Case 3a (Right Sibling Borrow): Right sibling ${rightSibling.id} has ${rightSibling.keys.length} keys (>= t). Borrowing key...`,
            ['del_borrow_right'],
            'Delete',
            key
          );

          // Shift keys in child
          child.keys.push(node.keys[i]);
          if (!child.isLeaf) {
            child.children.push(rightSibling.children.shift()!);
          }
          node.keys[i] = rightSibling.keys.shift()!;

          this.recordStep(
            node.id,
            i,
            [node.id, child.id, rightSibling.id],
            'delete_borrow',
            `Borrow completed: Shifted parent key ${child.keys[child.keys.length-1]} down to child, and promoted right sibling's smallest key ${node.keys[i]} to parent.`,
            [],
            'Delete',
            key
          );

          this.deleteRecursive(child, key);
        } else {
          // Case 3b: Both siblings have only t-1 keys. Merge child with one sibling
          if (leftSibling) {
            this.recordStep(
              node.id,
              null,
              [child.id, leftSibling.id],
              'delete_merge',
              `Case 3b: Immediate siblings have only t-1 keys. Merging child ${child.id} with left sibling ${leftSibling.id} and demoting parent key ${node.keys[i-1]}.`,
              ['del_merge_siblings'],
              'Delete',
              key
            );

            leftSibling.keys.push(node.keys[i - 1]);
            leftSibling.keys.push(...child.keys);
            if (!leftSibling.isLeaf) {
              leftSibling.children.push(...child.children);
            }

            node.keys.splice(i - 1, 1);
            node.children.splice(i, 1);

            this.recordStep(
              node.id,
              null,
              [leftSibling.id],
              'delete_merge',
              `Merge completed. Node ${leftSibling.id} contains merged keys. Parent lost a key and child reference. Continuing recursion down merged node.`,
              [],
              'Delete',
              key
            );

            this.deleteRecursive(leftSibling, key);
          } else if (rightSibling) {
            this.recordStep(
              node.id,
              null,
              [child.id, rightSibling.id],
              'delete_merge',
              `Case 3b: Immediate siblings have only t-1 keys. Merging child ${child.id} with right sibling ${rightSibling.id} and demoting parent key ${node.keys[i]}.`,
              ['del_merge_siblings'],
              'Delete',
              key
            );

            child.keys.push(node.keys[i]);
            child.keys.push(...rightSibling.keys);
            if (!child.isLeaf) {
              child.children.push(...rightSibling.children);
            }

            node.keys.splice(i, 1);
            node.children.splice(i + 1, 1);

            this.recordStep(
              node.id,
              null,
              [child.id],
              'delete_merge',
              `Merge completed. Node ${child.id} contains merged keys. Parent lost a key and right child reference. Continuing recursion down merged node.`,
              [],
              'Delete',
              key
            );

            this.deleteRecursive(child, key);
          }
        }
      } else {
        this.diskAccessCount++;
        this.deleteRecursive(child, key);
      }
    }
  }

  private getPredecessor(node: BTreeNode, targetKey: number): number {
    let curr = node;
    while (!curr.isLeaf) {
      this.diskAccessCount++;
      curr = curr.children[curr.children.length - 1];
      this.recordStep(
        curr.id,
        null,
        [curr.id],
        'delete_internal',
        `Traversing predecessor path. Visiting node ${curr.id}.`,
        [],
        'Delete',
        targetKey
      );
    }
    return curr.keys[curr.keys.length - 1];
  }

  private getSuccessor(node: BTreeNode, targetKey: number): number {
    let curr = node;
    while (!curr.isLeaf) {
      this.diskAccessCount++;
      curr = curr.children[0];
      this.recordStep(
        curr.id,
        null,
        [curr.id],
        'delete_internal',
        `Traversing successor path. Visiting node ${curr.id}.`,
        [],
        'Delete',
        targetKey
      );
    }
    return curr.keys[0];
  }
}

// Helper to generate a random tree with N nodes
export const generateRandomTree = (degree: number, count: number = 15): BTreeEngine => {
  const engine = new BTreeEngine(degree);
  
  // We generate unique random numbers
  const values: number[] = [];
  while (values.length < count) {
    const val = Math.floor(Math.random() * 150) + 1;
    if (!values.includes(val)) {
      values.push(val);
    }
  }

  // Insert each value
  values.forEach((v) => {
    engine.insert(v);
  });

  return engine;
};

// JSON Export / Import
export const exportTreeToJson = (root: BTreeNode | null): string => {
  return JSON.stringify(root, null, 2);
};

export const importTreeFromJson = (jsonString: string): BTreeNode | null => {
  try {
    const parsed = JSON.parse(jsonString);
    // Simple validation
    const validateNode = (node: any): boolean => {
      if (!node || typeof node !== 'object') return false;
      if (!Array.isArray(node.keys)) return false;
      if (typeof node.isLeaf !== 'boolean') return false;
      if (node.id === undefined) node.id = generateNodeId();
      if (!Array.isArray(node.children)) {
        node.children = [];
      } else {
        for (const child of node.children) {
          if (!validateNode(child)) return false;
        }
      }
      return true;
    };

    if (validateNode(parsed)) {
      return parsed as BTreeNode;
    }
    return null;
  } catch (e) {
    return null;
  }
};
