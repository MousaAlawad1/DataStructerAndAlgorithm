// ================================================
// B-Tree Data Structure — Pure Logic (No React)
// ================================================

export interface BTreeNode {
  id: string;
  keys: number[];
  children: BTreeNode[];
  isLeaf: boolean;
}

export type HL =
  | 'active'
  | 'splitting'
  | 'merging'
  | 'found'
  | 'notFound'
  | 'underflow'
  | 'borrowing';

export interface Step {
  tree: BTreeNode | null;
  hl: Record<string, HL>;
  text: string;
  line: number;
  op: string;
  comparisons: number;
  splits: number;
  merges: number;
  borrows: number;
}

export interface VErr {
  nodeId: string;
  keys: number[];
  rule: string;
}

export interface VResult {
  valid: boolean;
  errors: VErr[];
}

// ---- Utility ----
let _nid = 0;
function nid(): string {
  return 'n' + _nid++;
}

export function cloneTree(n: BTreeNode | null): BTreeNode | null {
  if (!n) return null;
  return {
    id: n.id,
    keys: [...n.keys],
    children: n.children.map((c) => cloneTree(c)!),
    isLeaf: n.isLeaf,
  };
}

function mk(
  leaf: boolean,
  keys: number[] = [],
  children: BTreeNode[] = []
): BTreeNode {
  return {
    id: nid(),
    keys: [...keys],
    children: [...children],
    isLeaf: leaf,
  };
}

export function getAllKeys(root: BTreeNode | null): number[] {
  if (!root) return [];
  const r: number[] = [];
  const go = (n: BTreeNode) => {
    r.push(...n.keys);
    n.children.forEach(go);
  };
  go(root);
  return r.sort((a, b) => a - b);
}

// ================================================
// B-Tree Class
// ================================================
export class BTree {
  root: BTreeNode | null = null;
  order: number;

  private st: Step[] = [];
  private _c = 0;
  private _s = 0;
  private _m = 0;
  private _b = 0;
  private _op = '';

  constructor(order: number) {
    this.order = Math.max(3, Math.min(7, order));
  }

  get maxKeys() {
    return this.order - 1;
  }
  get minKeys() {
    return Math.ceil(this.order / 2) - 1;
  }

  // ---- Snapshot helper ----
  private snap(hl: Record<string, HL>, text: string, line: number) {
    this.st.push({
      tree: cloneTree(this.root),
      hl: { ...hl },
      text,
      line,
      op: this._op,
      comparisons: this._c,
      splits: this._s,
      merges: this._m,
      borrows: this._b,
    });
  }

  private init(op: string) {
    this.st = [];
    this._c = 0;
    this._s = 0;
    this._m = 0;
    this._b = 0;
    this._op = op;
  }

  // Find index where key would be (or is) in node keys
  private fi(n: BTreeNode, k: number): number {
    let i = 0;
    while (i < n.keys.length && k > n.keys[i]) {
      this._c++;
      i++;
    }
    return i;
  }

  // Check existence without counting comparisons
  private has(n: BTreeNode, k: number): boolean {
    let i = 0;
    while (i < n.keys.length && k > n.keys[i]) i++;
    if (i < n.keys.length && n.keys[i] === k) return true;
    if (n.isLeaf) return false;
    return this.has(n.children[i], k);
  }

  // ================================================
  // INSERT
  // ================================================
  insert(key: number): Step[] {
    this.init('insert');

    if (!this.root) {
      this.root = mk(true, [key]);
      this.snap(
        { [this.root.id]: 'active' },
        `Created root with key ${key}`,
        1
      );
      return this.st;
    }

    if (this.has(this.root, key)) {
      this.snap({}, `Key ${key} already exists in tree`, -1);
      return this.st;
    }

    // Find leaf, tracking path
    const path: { node: BTreeNode; ci: number }[] = [];
    let cur = this.root;
    this.snap(
      { [cur.id]: 'active' },
      `Start at root [${cur.keys.join(', ')}]`,
      2
    );

    while (!cur.isLeaf) {
      const i = this.fi(cur, key);
      path.push({ node: cur, ci: i });
      cur = cur.children[i];
      this.snap(
        { [cur.id]: 'active' },
        `Descend to node [${cur.keys.join(', ')}]`,
        2
      );
    }

    // Insert into leaf in sorted position
    const pos = this.fi(cur, key);
    cur.keys.splice(pos, 0, key);
    this.snap(
      { [cur.id]: 'active' },
      `Insert ${key} into leaf → [${cur.keys.join(', ')}]`,
      3
    );

    // Handle overflow — split upward
    while (cur.keys.length > this.maxKeys) {
      this._s++;
      const mid = Math.floor((cur.keys.length - 1) / 2);
      const med = cur.keys[mid];
      this.snap(
        { [cur.id]: 'splitting' },
        `Overflow! Splitting node at median ${med}`,
        7
      );

      const L = mk(cur.isLeaf, cur.keys.slice(0, mid));
      const R = mk(cur.isLeaf, cur.keys.slice(mid + 1));
      if (!cur.isLeaf) {
        L.children = cur.children.slice(0, mid + 1);
        R.children = cur.children.slice(mid + 1);
      }

      if (path.length === 0) {
        // Splitting the root
        this.root = mk(false, [med], [L, R]);
        this.snap(
          {
            [this.root.id]: 'active',
            [L.id]: 'active',
            [R.id]: 'active',
          },
          `New root created with key ${med}`,
          8
        );
        break;
      } else {
        const { node: p, ci } = path.pop()!;
        p.keys.splice(ci, 0, med);
        p.children.splice(ci, 1, L, R);
        this.snap(
          { [p.id]: 'active', [L.id]: 'active', [R.id]: 'active' },
          `Promoted ${med} to parent → [${p.keys.join(', ')}]`,
          8
        );
        cur = p;
      }
    }

    this.snap({}, `Insert of ${key} complete`, -1);
    return this.st;
  }

  // ================================================
  // DELETE
  // ================================================
  delete(key: number): Step[] {
    this.init('delete');
    if (!this.root) {
      this.snap({}, 'Tree is empty — nothing to delete', -1);
      return this.st;
    }

    this.snap(
      { [this.root.id]: 'active' },
      `Deleting key ${key}`,
      0
    );

    const found = this.delN(this.root, key);

    if (!found) {
      this.snap({}, `Key ${key} not found in tree`, -1);
      return this.st;
    }

    // Root shrinking
    if (this.root && this.root.keys.length === 0) {
      if (!this.root.isLeaf && this.root.children.length > 0) {
        this.root = this.root.children[0];
        this.snap(
          { [this.root.id]: 'active' },
          'Root was empty — tree height decreased',
          5
        );
      } else if (this.root.isLeaf) {
        this.root = null;
        this.snap({}, 'Tree is now empty', -1);
      }
    }

    this.snap({}, `Deletion of ${key} complete`, -1);
    return this.st;
  }

  private delN(n: BTreeNode, k: number): boolean {
    const i = this.fi(n, k);
    const found = i < n.keys.length && n.keys[i] === k;

    if (found) {
      this.snap(
        { [n.id]: 'found' },
        `Found key ${k} in node [${n.keys.join(', ')}]`,
        1
      );

      if (n.isLeaf) {
        // Case 1: leaf — simple removal
        n.keys.splice(i, 1);
        this.snap(
          { [n.id]: 'active' },
          `Removed ${k} from leaf → [${n.keys.join(', ')}]`,
          2
        );
        return true;
      }

      // Case 2: internal — replace with in-order predecessor
      let pn = n.children[i];
      while (!pn.isLeaf) pn = pn.children[pn.children.length - 1];
      const pk = pn.keys[pn.keys.length - 1];
      this.snap(
        { [pn.id]: 'active' },
        `In-order predecessor is ${pk}`,
        3
      );

      n.keys[i] = pk;
      this.snap(
        { [n.id]: 'active' },
        `Replaced ${k} with predecessor ${pk}`,
        4
      );

      // Recursively delete predecessor from left subtree
      this.delN(n.children[i], pk);
      if (
        n.children[i] &&
        n.children[i].keys.length < this.minKeys
      ) {
        this.fix(n, i);
      }
      return true;
    }

    // Key not in this node
    if (n.isLeaf) {
      this.snap(
        { [n.id]: 'notFound' },
        `Key ${k} not found in leaf [${n.keys.join(', ')}]`,
        1
      );
      return false;
    }

    this.snap(
      { [n.id]: 'active' },
      `Key ${k} not here — descend to child ${i}`,
      1
    );

    const ch = n.children[i];
    if (ch) {
      this.snap(
        { [ch.id]: 'active' },
        `Searching node [${ch.keys.join(', ')}]`,
        1
      );
    }

    const r = this.delN(n.children[i], k);
    if (
      r &&
      n.children[i] &&
      n.children[i].keys.length < this.minKeys
    ) {
      this.fix(n, i);
    }
    return r;
  }

  private fix(p: BTreeNode, ci: number) {
    const c = p.children[ci];
    if (!c || c.keys.length >= this.minKeys) return;

    this.snap(
      { [c.id]: 'underflow' },
      `Underflow in [${c.keys.join(', ')}]: ${c.keys.length} key(s) < min ${this.minKeys}`,
      5
    );

    // Try borrow from left sibling
    if (ci > 0) {
      const ls = p.children[ci - 1];
      if (ls.keys.length > this.minKeys) {
        this._b++;
        c.keys.unshift(p.keys[ci - 1]);
        p.keys[ci - 1] = ls.keys.pop()!;
        if (!c.isLeaf) c.children.unshift(ls.children.pop()!);
        this.snap(
          {
            [c.id]: 'borrowing',
            [ls.id]: 'borrowing',
            [p.id]: 'active',
          },
          'Borrowed key from left sibling via parent rotation',
          8
        );
        return;
      }
    }

    // Try borrow from right sibling
    if (ci < p.children.length - 1) {
      const rs = p.children[ci + 1];
      if (rs.keys.length > this.minKeys) {
        this._b++;
        c.keys.push(p.keys[ci]);
        p.keys[ci] = rs.keys.shift()!;
        if (!c.isLeaf) c.children.push(rs.children.shift()!);
        this.snap(
          {
            [c.id]: 'borrowing',
            [rs.id]: 'borrowing',
            [p.id]: 'active',
          },
          'Borrowed key from right sibling via parent rotation',
          9
        );
        return;
      }
    }

    // Merge
    this._m++;
    if (ci > 0) {
      // Merge with left sibling
      const ls = p.children[ci - 1];
      const sep = p.keys[ci - 1];
      ls.keys.push(sep, ...c.keys);
      ls.children.push(...c.children);
      p.keys.splice(ci - 1, 1);
      p.children.splice(ci, 1);
      this.snap(
        { [ls.id]: 'merging' },
        `Merged with left sibling using separator ${sep}`,
        10
      );
    } else {
      // Merge with right sibling
      const rs = p.children[ci + 1];
      const sep = p.keys[ci];
      c.keys.push(sep, ...rs.keys);
      c.children.push(...rs.children);
      p.keys.splice(ci, 1);
      p.children.splice(ci + 1, 1);
      this.snap(
        { [c.id]: 'merging' },
        `Merged with right sibling using separator ${sep}`,
        10
      );
    }
  }

  // ================================================
  // SEARCH
  // ================================================
  search(key: number): Step[] {
    this.init('search');
    if (!this.root) {
      this.snap({}, 'Tree is empty', -1);
      return this.st;
    }

    let node: BTreeNode | null = this.root;
    let depth = 0;

    while (node) {
      this.snap(
        { [node.id]: 'active' },
        `Searching node [${node.keys.join(', ')}] at depth ${depth}`,
        2
      );

      const i = this.fi(node, key);

      if (i < node.keys.length && node.keys[i] === key) {
        this._c++;
        this.snap(
          { [node.id]: 'found' },
          `✓ Found key ${key} at depth ${depth}, index ${i}. ${this._c} comparison(s) made.`,
          3
        );
        return this.st;
      }
      this._c++;

      if (node.isLeaf) {
        this.snap(
          { [node.id]: 'notFound' },
          `✗ Key ${key} not found. Reached leaf after ${this._c} comparison(s).`,
          5
        );
        return this.st;
      }

      this.snap(
        { [node.id]: 'active' },
        `Key not in this node — descend to child ${i}`,
        4
      );
      node = node.children[i];
      depth++;
    }

    this.snap({}, `Key ${key} not found`, 5);
    return this.st;
  }

  // ================================================
  // TRAVERSALS
  // ================================================
  inorder(): Step[] {
    this.init('traverse');
    const r: number[] = [];
    if (this.root) this._ino(this.root, r);
    this.snap({}, `Inorder complete: [${r.join(', ')}]`, -1);
    return this.st;
  }
  private _ino(n: BTreeNode, r: number[]) {
    for (let i = 0; i < n.keys.length; i++) {
      if (!n.isLeaf) this._ino(n.children[i], r);
      r.push(n.keys[i]);
      this.snap(
        { [n.id]: 'active' },
        `Visit ${n.keys[i]} → [${r.join(', ')}]`,
        -1
      );
    }
    if (!n.isLeaf && n.children.length > n.keys.length)
      this._ino(n.children[n.keys.length], r);
  }

  preorder(): Step[] {
    this.init('traverse');
    const r: number[] = [];
    if (this.root) this._pre(this.root, r);
    this.snap({}, `Preorder complete: [${r.join(', ')}]`, -1);
    return this.st;
  }
  private _pre(n: BTreeNode, r: number[]) {
    for (const k of n.keys) r.push(k);
    this.snap(
      { [n.id]: 'active' },
      `Visit node [${n.keys.join(', ')}] → [${r.join(', ')}]`,
      -1
    );
    if (!n.isLeaf) for (const c of n.children) this._pre(c, r);
  }

  postorder(): Step[] {
    this.init('traverse');
    const r: number[] = [];
    if (this.root) this._post(this.root, r);
    this.snap({}, `Postorder complete: [${r.join(', ')}]`, -1);
    return this.st;
  }
  private _post(n: BTreeNode, r: number[]) {
    if (!n.isLeaf) for (const c of n.children) this._post(c, r);
    for (const k of n.keys) r.push(k);
    this.snap(
      { [n.id]: 'active' },
      `Visit node [${n.keys.join(', ')}] → [${r.join(', ')}]`,
      -1
    );
  }

  levelOrder(): Step[] {
    this.init('traverse');
    const r: number[] = [];
    if (!this.root) {
      this.snap({}, 'Tree is empty', -1);
      return this.st;
    }
    const q: BTreeNode[] = [this.root];
    while (q.length) {
      const n = q.shift()!;
      for (const k of n.keys) r.push(k);
      this.snap(
        { [n.id]: 'active' },
        `Visit node [${n.keys.join(', ')}] → [${r.join(', ')}]`,
        -1
      );
      for (const c of n.children) q.push(c);
    }
    this.snap({}, `Level-order complete: [${r.join(', ')}]`, -1);
    return this.st;
  }

  // ================================================
  // VALIDATION
  // ================================================
  validate(): VResult {
    const e: VErr[] = [];
    if (!this.root) return { valid: true, errors: [] };

    if (this.root.keys.length > this.maxKeys)
      e.push({
        nodeId: this.root.id,
        keys: [...this.root.keys],
        rule: `Root has ${this.root.keys.length} keys > maxKeys (${this.maxKeys})`,
      });

    const ld: number[] = [];
    this.valN(this.root, 0, true, e, ld);

    if (ld.length > 0 && !ld.every((d) => d === ld[0]))
      e.push({
        nodeId: '',
        keys: [],
        rule: `Leaves at different depths: ${[...new Set(ld)].join(', ')}`,
      });

    return { valid: e.length === 0, errors: e };
  }

  private valN(
    n: BTreeNode,
    d: number,
    isRoot: boolean,
    e: VErr[],
    ld: number[]
  ) {
    // Keys sorted
    for (let i = 1; i < n.keys.length; i++)
      if (n.keys[i] <= n.keys[i - 1])
        e.push({
          nodeId: n.id,
          keys: [...n.keys],
          rule: `Keys not sorted: ${n.keys[i - 1]} ≥ ${n.keys[i]}`,
        });

    // Key count bounds
    if (!isRoot) {
      if (n.keys.length < this.minKeys)
        e.push({
          nodeId: n.id,
          keys: [...n.keys],
          rule: `Node has ${n.keys.length} key(s) < minKeys (${this.minKeys})`,
        });
      if (n.keys.length > this.maxKeys)
        e.push({
          nodeId: n.id,
          keys: [...n.keys],
          rule: `Node has ${n.keys.length} key(s) > maxKeys (${this.maxKeys})`,
        });
    }

    if (n.isLeaf) {
      ld.push(d);
    } else {
      // Children count
      if (n.children.length !== n.keys.length + 1)
        e.push({
          nodeId: n.id,
          keys: [...n.keys],
          rule: `${n.keys.length} key(s) but ${n.children.length} children (expected ${n.keys.length + 1})`,
        });
      for (const c of n.children) this.valN(c, d + 1, false, e, ld);
    }
  }

  // ================================================
  // UTILITY
  // ================================================
  getHeight(): number {
    if (!this.root) return 0;
    let h = 1;
    let n = this.root;
    while (!n.isLeaf && n.children.length > 0) {
      h++;
      n = n.children[0];
    }
    return h;
  }

  getNodeCount(): number {
    if (!this.root) return 0;
    let c = 0;
    const go = (n: BTreeNode) => {
      c++;
      n.children.forEach(go);
    };
    go(this.root);
    return c;
  }

  getKeyCount(): number {
    if (!this.root) return 0;
    let c = 0;
    const go = (n: BTreeNode) => {
      c += n.keys.length;
      n.children.forEach(go);
    };
    go(this.root);
    return c;
  }

  snapshot(): BTreeNode | null {
    return cloneTree(this.root);
  }
  restore(s: BTreeNode | null) {
    this.root = cloneTree(s);
  }
}
