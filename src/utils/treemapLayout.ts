/** Normalized rectangle in 0–1 space (fractions of container width / height). */
export type TreemapRect = { x: number; y: number; w: number; h: number };

export type TreemapLeaf = { id: string; weight: number };

/**
 * Slice-and-dice treemap: largest item first, strip along the longer container edge.
 * Areas partition the unit square; each tile's area ∝ its weight / sum(weights).
 */
export function layoutSliceDice(
  leaves: TreemapLeaf[],
  x: number,
  y: number,
  w: number,
  h: number
): { id: string; rect: TreemapRect }[] {
  if (leaves.length === 0) return [];
  const sorted = [...leaves].sort((a, b) => b.weight - a.weight);
  const sum = sorted.reduce((s, n) => s + n.weight, 0);
  if (sum <= 0) {
    const n = sorted.length;
    return sorted.map((leaf, i) => ({
      id: leaf.id,
      rect: {
        x: x + (w * i) / n,
        y,
        w: w / n,
        h,
      },
    }));
  }

  function go(
    nodes: TreemapLeaf[],
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): { id: string; rect: TreemapRect }[] {
    if (nodes.length === 0) return [];
    if (nodes.length === 1) {
      return [{ id: nodes[0].id, rect: { x: rx, y: ry, w: rw, h: rh } }];
    }
    const nodeSum = nodes.reduce((s, n) => s + n.weight, 0);
    const first = nodes[0];
    const frac = first.weight / nodeSum;
    const horizontal = rw >= rh;
    if (horizontal) {
      const sliceW = rw * frac;
      return [
        { id: first.id, rect: { x: rx, y: ry, w: sliceW, h: rh } },
        ...go(nodes.slice(1), rx + sliceW, ry, rw - sliceW, rh),
      ];
    }
    const sliceH = rh * frac;
    return [
      { id: first.id, rect: { x: rx, y: ry, w: rw, h: sliceH } },
      ...go(nodes.slice(1), rx, ry + sliceH, rw, rh - sliceH),
    ];
  }

  return go(sorted, x, y, w, h);
}
