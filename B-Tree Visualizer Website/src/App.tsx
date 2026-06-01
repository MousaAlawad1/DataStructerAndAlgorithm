import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  BTree,
  type BTreeNode,
  type Step,
  type VResult,
  type HL,
  cloneTree,
  getAllKeys,
} from './btree';

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════
const CELL_W = 46;
const NODE_H = 38;
const LEVEL_H = 94;
const GAP = 28;
const RAD = 7;

const NC: Record<string, { fill: string; stroke: string }> = {
  default: { fill: '#1e2235', stroke: '#3b4a6b' },
  active: { fill: '#1a3a5c', stroke: '#4a9eff' },
  splitting: { fill: '#3a1a2c', stroke: '#ff4a8e' },
  merging: { fill: '#1a3a2c', stroke: '#4aff9e' },
  found: { fill: '#2a3a1a', stroke: '#9eff4a' },
  notFound: { fill: '#3a1a1a', stroke: '#ff4a4a' },
  underflow: { fill: '#3a2a1a', stroke: '#ffaa4a' },
  borrowing: { fill: '#2a2a3a', stroke: '#aa8aff' },
};

const PSEUDO: Record<string, string[]> = {
  insert: [
    'INSERT(tree, key):',
    '  if tree is empty → create root with key',
    '  leaf ← FIND_LEAF(root, key)',
    '  INSERT_INTO_NODE(leaf, key)',
    '  if leaf.keys > maxKeys → SPLIT(leaf)',
    '',
    'SPLIT(node):',
    '  mid ← floor(keys.length / 2)',
    '  promote keys[mid] to parent',
    '  left ← keys[0..mid-1]',
    '  right ← keys[mid+1..]',
    '  if parent overflows → SPLIT(parent)',
  ],
  delete: [
    'DELETE(tree, key):',
    '  node ← FIND(root, key)',
    '  if node is leaf → REMOVE(node, key)',
    '  else → replace with PREDECESSOR',
    '         DELETE(leaf, replacement)',
    '  if node.keys < minKeys → REBALANCE(node)',
    '',
    'REBALANCE(node):',
    '  if left sibling can lend → BORROW_LEFT',
    '  elif right sibling can lend → BORROW_RIGHT',
    '  else → MERGE with sibling',
    '  if parent.keys < minKeys → REBALANCE(parent)',
  ],
  search: [
    'SEARCH(tree, key):',
    '  node ← root',
    '  while node is not null:',
    '    if key in node.keys → FOUND',
    '    descend to appropriate child',
    '  return NOT_FOUND',
  ],
  traverse: [
    'TRAVERSE(node):',
    '  for each key/child:',
    '    recurse on child subtree',
    '    visit key',
  ],
};

// ═══════════════════════════════════════════════
// LAYOUT ALGORITHM
// ═══════════════════════════════════════════════
interface LN {
  id: string;
  keys: number[];
  cx: number;
  y: number;
  w: number;
  leaf: boolean;
}
interface LE {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pid: string;
  cid: string;
}

function nodeW(n: BTreeNode): number {
  return Math.max(n.keys.length, 1) * CELL_W;
}

function subW(n: BTreeNode): number {
  if (n.isLeaf || n.children.length === 0) return nodeW(n);
  let w = 0;
  for (const c of n.children) w += subW(c);
  w += (n.children.length - 1) * GAP;
  return Math.max(nodeW(n), w);
}

function doLayout(root: BTreeNode | null): { nodes: LN[]; edges: LE[] } {
  if (!root) return { nodes: [], edges: [] };
  const nodes: LN[] = [];
  const edges: LE[] = [];

  function lay(n: BTreeNode, cx: number, y: number) {
    const w = nodeW(n);
    nodes.push({
      id: n.id,
      keys: [...n.keys],
      cx,
      y,
      w,
      leaf: n.isLeaf,
    });

    if (!n.isLeaf && n.children.length > 0) {
      const cws = n.children.map((c) => subW(c));
      const total =
        cws.reduce((a, b) => a + b, 0) +
        (n.children.length - 1) * GAP;
      let sx = cx - total / 2;

      for (let i = 0; i < n.children.length; i++) {
        const ccx = sx + cws[i] / 2;
        const nl = cx - w / 2;
        // Connect from cell boundary on parent
        const nk = n.keys.length;
        let px: number;
        if (nk > 0) {
          px = nl + Math.min(i, nk) * CELL_W;
          px = Math.max(nl + 4, Math.min(nl + w - 4, px));
        } else {
          px = cx;
        }
        edges.push({
          pid: n.id,
          cid: n.children[i].id,
          x1: px,
          y1: y + NODE_H,
          x2: ccx,
          y2: y + LEVEL_H,
        });
        lay(n.children[i], ccx, y + LEVEL_H);
        sx += cws[i] + GAP;
      }
    }
  }

  lay(root, 0, 0);
  return { nodes, edges };
}

// ═══════════════════════════════════════════════
// REUSABLE STYLES
// ═══════════════════════════════════════════════
const sidebarBg = '#0d0d14';
const borderCol = '#1a1e2e';
const surfaceBg = '#12121e';
const inputBg = '#151522';

const inputS: CSSProperties = {
  background: inputBg,
  border: `1px solid ${borderCol}`,
  borderRadius: 6,
  padding: '7px 10px',
  color: '#e0e4ea',
  fontSize: 13,
  outline: 'none',
  width: '100%',
};

const labelS: CSSProperties = {
  fontSize: 10,
  color: '#6b7280',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: 6,
  display: 'block',
};

const sectionS: CSSProperties = {
  padding: '14px 16px',
  borderBottom: `1px solid ${borderCol}`,
};

function Btn({
  children,
  onClick,
  bg = '#1e2235',
  color = '#c8cad0',
  disabled = false,
  flex,
  small,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  bg?: string;
  color?: string;
  disabled?: boolean;
  flex?: boolean;
  small?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: disabled ? '#151520' : bg,
        color: disabled ? '#3b4a6b' : color,
        border: 'none',
        borderRadius: 6,
        padding: small ? '4px 8px' : '7px 14px',
        fontSize: small ? 11 : 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        flex: flex ? 1 : undefined,
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  // ---- B-Tree instance ----
  const btreeRef = useRef(new BTree(3));

  // ---- Core state ----
  const [order, setOrder] = useState(3);
  const [treeSnap, setTreeSnap] = useState<BTreeNode | null>(null);

  // ---- Animation ----
  const [steps, setSteps] = useState<Step[]>([]);
  const [si, setSi] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5); // 1=slow, 10=fast

  // ---- History (undo/redo) ----
  const [snaps, setSnaps] = useState<(BTreeNode | null)[]>([null]);
  const [snapIdx, setSnapIdx] = useState(0);

  // ---- Log ----
  const [log, setLog] = useState<string[]>([]);

  // ---- Validation ----
  const [vr, setVr] = useState<VResult>({ valid: true, errors: [] });

  // ---- View ----
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // ---- Inputs ----
  const [insertVal, setInsertVal] = useState('');
  const [deleteVal, setDeleteVal] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [rCount, setRCount] = useState(10);
  const [rMin, setRMin] = useState(1);
  const [rMax, setRMax] = useState(99);
  const [rUnique, setRUnique] = useState(true);

  // ---- SVG ----
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });

  // Speed mapping: level 1-10 → delay in ms
  const delay = useMemo(() => {
    const d = 1400 - speed * 130;
    return Math.max(50, d);
  }, [speed]);

  // ---- Derived state ----
  const currentStep = si >= 0 && si < steps.length ? steps[si] : null;
  const displayTree = currentStep ? currentStep.tree : treeSnap;
  const highlights: Record<string, HL> = currentStep ? currentStep.hl : {};
  const activeOp = currentStep ? currentStep.op : steps.length > 0 ? steps[0].op : '';
  const explanation = currentStep ? currentStep.text : '';
  const pseudoLine = currentStep ? currentStep.line : -1;

  const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const currentStats = currentStep
    ? {
        comparisons: currentStep.comparisons,
        splits: currentStep.splits,
        merges: currentStep.merges,
        borrows: currentStep.borrows,
      }
    : lastStep
    ? {
        comparisons: lastStep.comparisons,
        splits: lastStep.splits,
        merges: lastStep.merges,
        borrows: lastStep.borrows,
      }
    : { comparisons: 0, splits: 0, merges: 0, borrows: 0 };

  const layout = useMemo(() => doLayout(displayTree), [displayTree]);

  // Tree stats
  const height = btreeRef.current.getHeight();
  const nodeCount = btreeRef.current.getNodeCount();
  const keyCount = btreeRef.current.getKeyCount();
  const minKeys = Math.ceil(order / 2) - 1;
  const maxKeys = order - 1;

  // ---- SVG resize ----
  useEffect(() => {
    const el = svgContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        setSvgSize({
          w: e.contentRect.width,
          h: e.contentRect.height,
        });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ---- Auto-play ----
  useEffect(() => {
    if (!playing || si >= steps.length - 1) {
      if (playing) setPlaying(false);
      return;
    }
    const t = setTimeout(() => setSi((p) => p + 1), delay);
    return () => clearTimeout(t);
  }, [playing, si, steps.length, delay]);

  // ---- Operation executor ----
  const exec = useCallback(
    (op: () => Step[], label: string) => {
      // Stop any running animation
      setPlaying(false);
      // Save for undo
      const newSnaps = [
        ...snaps.slice(0, snapIdx + 1),
        btreeRef.current.snapshot(),
      ];
      setSnaps(newSnaps);
      setSnapIdx(newSnaps.length - 1);
      // Execute
      const newSteps = op();
      setTreeSnap(btreeRef.current.snapshot());
      setVr(btreeRef.current.validate());
      setLog((prev) => [label, ...prev].slice(0, 200));
      setSteps(newSteps);
      setSi(0);
      setPlaying(true);
    },
    [snaps, snapIdx]
  );

  // ---- Handlers ----
  const handleInsert = useCallback(() => {
    const v = parseInt(insertVal);
    if (isNaN(v)) return;
    exec(() => btreeRef.current.insert(v), `Insert ${v}`);
    setInsertVal('');
  }, [insertVal, exec]);

  const handleDelete = useCallback(() => {
    const v = parseInt(deleteVal);
    if (isNaN(v)) return;
    exec(() => btreeRef.current.delete(v), `Delete ${v}`);
    setDeleteVal('');
  }, [deleteVal, exec]);

  const handleSearch = useCallback(() => {
    const v = parseInt(searchVal);
    if (isNaN(v)) return;
    setPlaying(false);
    const newSteps = btreeRef.current.search(v);
    setLog((prev) => [`Search ${v}`, ...prev].slice(0, 200));
    setSteps(newSteps);
    setSi(0);
    setPlaying(true);
    setSearchVal('');
  }, [searchVal]);

  const handleRandom = useCallback(() => {
    const range = rMax - rMin + 1;
    if (rUnique && rCount > range) return;
    const vals: number[] = [];
    const used = new Set<number>();
    while (vals.length < rCount) {
      const v = Math.floor(Math.random() * range) + rMin;
      if (rUnique && used.has(v)) continue;
      used.add(v);
      vals.push(v);
    }
    setPlaying(false);
    const newSnaps = [
      ...snaps.slice(0, snapIdx + 1),
      btreeRef.current.snapshot(),
    ];
    setSnaps(newSnaps);
    setSnapIdx(newSnaps.length - 1);
    for (const v of vals) btreeRef.current.insert(v);
    setTreeSnap(btreeRef.current.snapshot());
    setVr(btreeRef.current.validate());
    setLog((prev) =>
      [`Batch insert [${vals.join(', ')}]`, ...prev].slice(0, 200)
    );
    setSteps([]);
    setSi(-1);
  }, [rCount, rMin, rMax, rUnique, snaps, snapIdx]);

  const handleClear = useCallback(() => {
    setPlaying(false);
    const newSnaps = [
      ...snaps.slice(0, snapIdx + 1),
      btreeRef.current.snapshot(),
    ];
    setSnaps(newSnaps);
    setSnapIdx(newSnaps.length - 1);
    btreeRef.current = new BTree(order);
    setTreeSnap(null);
    setVr({ valid: true, errors: [] });
    setSteps([]);
    setSi(-1);
    setLog((prev) => ['Clear tree', ...prev].slice(0, 200));
  }, [order, snaps, snapIdx]);

  const handleUndo = useCallback(() => {
    if (snapIdx <= 0) return;
    const ni = snapIdx - 1;
    btreeRef.current.restore(snaps[ni]);
    setSnapIdx(ni);
    setTreeSnap(cloneTree(snaps[ni]));
    setVr(btreeRef.current.validate());
    setSteps([]);
    setSi(-1);
    setPlaying(false);
    setLog((prev) => ['Undo', ...prev].slice(0, 200));
  }, [snapIdx, snaps]);

  const handleRedo = useCallback(() => {
    if (snapIdx >= snaps.length - 1) return;
    const ni = snapIdx + 1;
    btreeRef.current.restore(snaps[ni]);
    setSnapIdx(ni);
    setTreeSnap(cloneTree(snaps[ni]));
    setVr(btreeRef.current.validate());
    setSteps([]);
    setSi(-1);
    setPlaying(false);
    setLog((prev) => ['Redo', ...prev].slice(0, 200));
  }, [snapIdx, snaps]);

  const handleOrderChange = useCallback(
    (newOrder: number) => {
      const keys = getAllKeys(btreeRef.current.root);
      btreeRef.current = new BTree(newOrder);
      for (const k of keys) btreeRef.current.insert(k);
      setOrder(newOrder);
      setTreeSnap(btreeRef.current.snapshot());
      setVr(btreeRef.current.validate());
      setSteps([]);
      setSi(-1);
      setPlaying(false);
      setLog((prev) => [`Order → ${newOrder}`, ...prev].slice(0, 200));
      setSnaps([btreeRef.current.snapshot()]);
      setSnapIdx(0);
    },
    []
  );

  const handleTraversal = useCallback(
    (type: 'inorder' | 'preorder' | 'postorder' | 'levelOrder') => {
      setPlaying(false);
      let newSteps: Step[];
      switch (type) {
        case 'inorder':
          newSteps = btreeRef.current.inorder();
          break;
        case 'preorder':
          newSteps = btreeRef.current.preorder();
          break;
        case 'postorder':
          newSteps = btreeRef.current.postorder();
          break;
        case 'levelOrder':
          newSteps = btreeRef.current.levelOrder();
          break;
      }
      setLog((prev) => [`${type} traversal`, ...prev].slice(0, 200));
      setSteps(newSteps);
      setSi(0);
      setPlaying(true);
    },
    []
  );

  // ---- Zoom / Pan ----
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom((z) => Math.max(0.15, Math.min(4, z * factor)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setPan({
        x: panStart.current.x + (e.clientX - dragStart.current.x),
        y: panStart.current.y + (e.clientY - dragStart.current.y),
      });
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  // ---- Step controls ----
  const stepPrev = () => {
    setPlaying(false);
    setSi((p) => Math.max(0, p - 1));
  };
  const stepNext = () => {
    setPlaying(false);
    setSi((p) => Math.min(steps.length - 1, p + 1));
  };
  const stepToggle = () => setPlaying((p) => !p);
  const stepSkip = () => {
    setSi(steps.length - 1);
    setPlaying(false);
  };
  const stepDone = () => {
    setSteps([]);
    setSi(-1);
    setPlaying(false);
  };

  // Keyboard handler for inputs
  const onKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
    handler: () => void
  ) => {
    if (e.key === 'Enter') handler();
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        background: '#0a0a0f',
        color: '#c8cad0',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        fontSize: 13,
        overflow: 'hidden',
      }}
    >
      {/* ═══════ LEFT SIDEBAR ═══════ */}
      <div
        style={{
          width: 272,
          minWidth: 272,
          background: sidebarBg,
          borderRight: `1px solid ${borderCol}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Title */}
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: `1px solid ${borderCol}`,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: '-0.3px',
              color: '#e0e4ea',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>🌳</span> B-Tree Simulator
          </div>
        </div>

        {/* Order */}
        <div style={sectionS}>
          <span style={labelS}>Order (m)</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[3, 4, 5, 6, 7].map((o) => (
              <button
                key={o}
                onClick={() => handleOrderChange(o)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 6,
                  border: `1.5px solid ${o === order ? '#4a9eff' : borderCol}`,
                  background: o === order ? '#1a3a5c' : inputBg,
                  color: o === order ? '#4a9eff' : '#8890a0',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {o}
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: '#5a6270',
              fontFamily: 'monospace',
            }}
          >
            minKeys = {minKeys} &nbsp;|&nbsp; maxKeys = {maxKeys}
          </div>
        </div>

        {/* Insert */}
        <div style={sectionS}>
          <span style={labelS}>Insert</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              placeholder="Key…"
              value={insertVal}
              onChange={(e) => setInsertVal(e.target.value)}
              onKeyDown={(e) => onKey(e, handleInsert)}
              style={{ ...inputS, flex: 1 }}
            />
            <Btn onClick={handleInsert} bg="#1a3a5c" color="#4a9eff">
              ＋
            </Btn>
          </div>
        </div>

        {/* Delete */}
        <div style={sectionS}>
          <span style={labelS}>Delete</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              placeholder="Key…"
              value={deleteVal}
              onChange={(e) => setDeleteVal(e.target.value)}
              onKeyDown={(e) => onKey(e, handleDelete)}
              style={{ ...inputS, flex: 1 }}
            />
            <Btn onClick={handleDelete} bg="#3a1a1a" color="#ff6a6a">
              ✕
            </Btn>
          </div>
        </div>

        {/* Search */}
        <div style={sectionS}>
          <span style={labelS}>Search</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="number"
              placeholder="Key…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => onKey(e, handleSearch)}
              style={{ ...inputS, flex: 1 }}
            />
            <Btn onClick={handleSearch} bg="#1a2a1a" color="#6adf6a">
              🔍
            </Btn>
          </div>
        </div>

        {/* Random */}
        <div style={sectionS}>
          <span style={labelS}>Random Generator</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              marginBottom: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>
                Count
              </div>
              <input
                type="number"
                value={rCount}
                min={1}
                max={200}
                onChange={(e) =>
                  setRCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                style={inputS}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>
                Unique
              </div>
              <button
                onClick={() => setRUnique(!rUnique)}
                style={{
                  ...inputS,
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: rUnique ? '#4a9eff' : '#666',
                  background: rUnique ? '#1a2a3c' : inputBg,
                  border: `1px solid ${rUnique ? '#2a4a6c' : borderCol}`,
                }}
              >
                {rUnique ? '✓ Yes' : '✗ No'}
              </button>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>
                Min
              </div>
              <input
                type="number"
                value={rMin}
                onChange={(e) => setRMin(parseInt(e.target.value) || 0)}
                style={inputS}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>
                Max
              </div>
              <input
                type="number"
                value={rMax}
                onChange={(e) => setRMax(parseInt(e.target.value) || 99)}
                style={inputS}
              />
            </div>
          </div>
          <Btn onClick={handleRandom} bg="#1e2a3e" color="#7ab8ff">
            ⚡ Generate &amp; Insert
          </Btn>
        </div>

        {/* Traversals */}
        <div style={sectionS}>
          <span style={labelS}>Traversals</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
            }}
          >
            <Btn
              onClick={() => handleTraversal('inorder')}
              bg="#1a1e2e"
              color="#8890a0"
            >
              Inorder
            </Btn>
            <Btn
              onClick={() => handleTraversal('preorder')}
              bg="#1a1e2e"
              color="#8890a0"
            >
              Preorder
            </Btn>
            <Btn
              onClick={() => handleTraversal('postorder')}
              bg="#1a1e2e"
              color="#8890a0"
            >
              Postorder
            </Btn>
            <Btn
              onClick={() => handleTraversal('levelOrder')}
              bg="#1a1e2e"
              color="#8890a0"
            >
              Level-order
            </Btn>
          </div>
        </div>

        {/* Speed */}
        <div style={sectionS}>
          <span style={labelS}>Animation Speed</span>
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: '#555',
              marginTop: 2,
            }}
          >
            <span>Slow</span>
            <span>{delay}ms</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Actions */}
        <div style={sectionS}>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn
              onClick={handleUndo}
              bg="#1e1e2e"
              color="#8890a0"
              disabled={snapIdx <= 0}
              flex
              title="Undo"
            >
              ↩ Undo
            </Btn>
            <Btn
              onClick={handleRedo}
              bg="#1e1e2e"
              color="#8890a0"
              disabled={snapIdx >= snaps.length - 1}
              flex
              title="Redo"
            >
              Redo ↪
            </Btn>
          </div>
          <div style={{ marginTop: 6 }}>
            <Btn onClick={handleClear} bg="#2a1a1a" color="#ff6a6a">
              🗑 Clear Tree
            </Btn>
          </div>
        </div>

        <div style={{ flex: 1 }} />
      </div>

      {/* ═══════ CENTER CANVAS ═══════ */}
      <div
        ref={svgContainerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: '#0a0a0f',
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          <defs>
            <pattern
              id="grid"
              width={50}
              height={50}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={25} cy={25} r={0.6} fill="#161622" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g
            transform={`translate(${svgSize.w / 2 + pan.x}, ${
              70 + pan.y
            }) scale(${zoom})`}
          >
            {/* Edges */}
            {layout.edges.map((e, i) => (
              <line
                key={`e${i}`}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={
                  highlights[e.pid]
                    ? NC[highlights[e.pid]]?.stroke || '#2a3045'
                    : '#222840'
                }
                strokeWidth={1.5}
                opacity={0.7}
                style={{ transition: 'stroke 0.3s' }}
              />
            ))}

            {/* Nodes */}
            {layout.nodes.map((n) => {
              const hl = highlights[n.id] as string | undefined;
              const c = hl && NC[hl] ? NC[hl] : NC.default;
              const nl = n.cx - n.w / 2;

              return (
                <g key={n.id}>
                  {/* Shadow */}
                  <rect
                    x={nl + 2}
                    y={n.y + 3}
                    width={n.w}
                    height={NODE_H}
                    rx={RAD}
                    fill="rgba(0,0,0,0.25)"
                  />
                  {/* Background */}
                  <rect
                    x={nl}
                    y={n.y}
                    width={n.w}
                    height={NODE_H}
                    rx={RAD}
                    fill={c.fill}
                    stroke={c.stroke}
                    strokeWidth={2}
                    style={{ transition: 'fill 0.3s, stroke 0.3s' }}
                  />
                  {/* Key dividers */}
                  {n.keys.map(
                    (_, ki) =>
                      ki > 0 && (
                        <line
                          key={ki}
                          x1={nl + ki * CELL_W}
                          y1={n.y + 7}
                          x2={nl + ki * CELL_W}
                          y2={n.y + NODE_H - 7}
                          stroke={c.stroke}
                          strokeWidth={1}
                          opacity={0.4}
                          style={{ transition: 'stroke 0.3s' }}
                        />
                      )
                  )}
                  {/* Key texts */}
                  {n.keys.map((k, ki) => (
                    <text
                      key={ki}
                      x={nl + ki * CELL_W + CELL_W / 2}
                      y={n.y + NODE_H / 2 + 5}
                      textAnchor="middle"
                      fill="#e0e4ea"
                      fontSize={14}
                      fontWeight={700}
                      fontFamily="'Inter', monospace"
                      style={{ userSelect: 'none' }}
                    >
                      {k}
                    </text>
                  ))}
                  {/* Empty node placeholder */}
                  {n.keys.length === 0 && (
                    <text
                      x={n.cx}
                      y={n.y + NODE_H / 2 + 4}
                      textAnchor="middle"
                      fill="#444"
                      fontSize={11}
                    >
                      ∅
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Empty state */}
        {!displayTree && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12,
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 48, opacity: 0.15 }}>🌳</div>
            <div style={{ color: '#3b4a6b', fontSize: 15, fontWeight: 600 }}>
              Insert values to build a B-Tree
            </div>
            <div style={{ color: '#2a3045', fontSize: 12 }}>
              Use the controls on the left or generate random values
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            gap: 4,
          }}
        >
          {[
            {
              label: '+',
              action: () => setZoom((z) => Math.min(4, z * 1.25)),
            },
            {
              label: '−',
              action: () => setZoom((z) => Math.max(0.15, z / 1.25)),
            },
            {
              label: '⊙',
              action: () => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              },
            },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: `1px solid ${borderCol}`,
                background: surfaceBg,
                color: '#8890a0',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {label}
            </button>
          ))}
          <span
            style={{
              fontSize: 10,
              color: '#444',
              alignSelf: 'center',
              marginLeft: 4,
            }}
          >
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Step controls */}
        {steps.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(13,13,20,0.92)',
              borderRadius: 10,
              padding: '6px 12px',
              border: `1px solid ${borderCol}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Btn onClick={() => setSi(0)} bg="transparent" color="#8890a0" small>
              ⏮
            </Btn>
            <Btn onClick={stepPrev} bg="transparent" color="#8890a0" small disabled={si <= 0}>
              ◀
            </Btn>
            <Btn
              onClick={stepToggle}
              bg={playing ? '#3a1a1a' : '#1a3a1a'}
              color={playing ? '#ff6a6a' : '#6adf6a'}
              small
            >
              {playing ? '⏸' : '▶'}
            </Btn>
            <Btn
              onClick={stepNext}
              bg="transparent"
              color="#8890a0"
              small
              disabled={si >= steps.length - 1}
            >
              ▶
            </Btn>
            <Btn onClick={stepSkip} bg="transparent" color="#8890a0" small>
              ⏭
            </Btn>
            <span
              style={{
                fontSize: 11,
                color: '#6b7280',
                padding: '0 8px',
                whiteSpace: 'nowrap',
              }}
            >
              Step {si + 1} / {steps.length}
            </span>
            <Btn onClick={stepDone} bg="#1e1e2e" color="#8890a0" small>
              Done
            </Btn>
          </div>
        )}

        {/* Explanation overlay */}
        {explanation && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(13,13,20,0.88)',
              borderRadius: 10,
              padding: '10px 20px',
              border: `1px solid ${borderCol}`,
              color: '#c8cad0',
              fontSize: 13,
              fontWeight: 500,
              maxWidth: '60%',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {explanation}
          </div>
        )}
      </div>

      {/* ═══════ RIGHT SIDEBAR ═══════ */}
      <div
        style={{
          width: 300,
          minWidth: 300,
          background: sidebarBg,
          borderLeft: `1px solid ${borderCol}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Pseudocode */}
        <div style={sectionS}>
          <span style={labelS}>Pseudocode</span>
          <div
            style={{
              background: surfaceBg,
              borderRadius: 8,
              padding: '8px 0',
              fontFamily: "'Fira Code', 'Consolas', monospace",
              fontSize: 11,
              lineHeight: 1.7,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {(
              PSEUDO[activeOp as keyof typeof PSEUDO] ||
              PSEUDO.insert
            ).map((line, i) => {
              const isActive = pseudoLine === i;
              return (
                <div
                  key={i}
                  style={{
                    padding: '1px 12px',
                    background: isActive
                      ? 'rgba(74,158,255,0.12)'
                      : 'transparent',
                    borderLeft: isActive
                      ? '3px solid #4a9eff'
                      : '3px solid transparent',
                    color: isActive ? '#b0d4ff' : '#5a6270',
                    transition: 'all 0.2s',
                    whiteSpace: 'pre',
                  }}
                >
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Complexity / Stats */}
        <div style={sectionS}>
          <span style={labelS}>Tree Metrics</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px 12px',
            }}
          >
            {[
              { label: 'Height', value: height, color: '#4a9eff' },
              { label: 'Nodes', value: nodeCount, color: '#aa8aff' },
              { label: 'Keys', value: keyCount, color: '#4aff9e' },
              {
                label: 'Comparisons',
                value: currentStats.comparisons,
                color: '#ffaa4a',
              },
              {
                label: 'Splits',
                value: currentStats.splits,
                color: '#ff4a8e',
              },
              {
                label: 'Merges',
                value: currentStats.merges,
                color: '#4aff9e',
              },
              {
                label: 'Borrows',
                value: currentStats.borrows,
                color: '#aa8aff',
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  background: surfaceBg,
                  borderRadius: 6,
                  padding: '6px 10px',
                }}
              >
                <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color,
                    fontFamily: 'monospace',
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: '#5a6270',
              background: surfaceBg,
              borderRadius: 6,
              padding: '6px 10px',
              fontFamily: 'monospace',
            }}
          >
            Time: O(log<sub>m</sub> n) &nbsp;|&nbsp; Space: O(n)
          </div>
        </div>

        {/* Validation */}
        <div style={sectionS}>
          <span style={labelS}>Validation</span>
          {vr.valid ? (
            <div
              style={{
                background: '#0d1a12',
                border: '1px solid #1a3a2c',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: '#4aff9e', fontSize: 18 }}>✓</span>
              <span style={{ color: '#6adf6a', fontSize: 12 }}>
                All B-Tree properties satisfied
              </span>
            </div>
          ) : (
            <div
              style={{
                background: '#1a0d0d',
                border: '1px solid #3a1a1a',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              <div
                style={{
                  color: '#ff6a6a',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>⚠</span>
                {vr.errors.length} violation(s) found
              </div>
              {vr.errors.slice(0, 5).map((err, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    color: '#cc8888',
                    padding: '2px 0',
                    borderTop: i > 0 ? '1px solid #2a1515' : undefined,
                  }}
                >
                  {err.keys.length > 0 && (
                    <span style={{ color: '#886666' }}>
                      [{err.keys.join(', ')}]{' '}
                    </span>
                  )}
                  {err.rule}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={sectionS}>
          <span style={labelS}>Node States</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {[
              { label: 'Default', key: 'default' },
              { label: 'Active', key: 'active' },
              { label: 'Split', key: 'splitting' },
              { label: 'Merge', key: 'merging' },
              { label: 'Found', key: 'found' },
              { label: 'Not Found', key: 'notFound' },
              { label: 'Underflow', key: 'underflow' },
              { label: 'Borrow', key: 'borrowing' },
            ].map(({ label, key }) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  color: '#6b7280',
                  padding: '2px 6px',
                  background: surfaceBg,
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: NC[key].fill,
                    border: `1.5px solid ${NC[key].stroke}`,
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* History Log */}
        <div style={{ ...sectionS, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <span style={labelS}>Operation History</span>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: surfaceBg,
              borderRadius: 8,
              padding: '6px 0',
              maxHeight: 260,
            }}
          >
            {log.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#333',
                  padding: 16,
                  fontSize: 12,
                }}
              >
                No operations yet
              </div>
            ) : (
              log.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: '3px 12px',
                    fontSize: 11,
                    color: i === 0 ? '#8890a0' : '#444',
                    borderBottom: '1px solid #1a1a24',
                    fontFamily: 'monospace',
                  }}
                >
                  <span style={{ color: '#333', marginRight: 6 }}>
                    {log.length - i}.
                  </span>
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
