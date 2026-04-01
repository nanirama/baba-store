import type { CategoryRecord } from "@/types/cms";

export type CategoryTreeNode = CategoryRecord & { children: CategoryTreeNode[] };

function compareSortOrder(a: number, b: number): number {
  const aZeroOrUnset = a === 0;
  const bZeroOrUnset = b === 0;
  if (aZeroOrUnset && !bZeroOrUnset) return 1;
  if (!aZeroOrUnset && bZeroOrUnset) return -1;
  return a - b;
}

/** Build a forest from a flat list using `parent_id`. Orphans or missing parents become roots. */
export function buildCategoryTree(flat: CategoryRecord[]): CategoryTreeNode[] {
  const byCategoryId = new Map<number, CategoryTreeNode>();
  for (const c of flat) {
    byCategoryId.set(c.category_id, { ...c, children: [] });
  }
  const roots: CategoryTreeNode[] = [];
  for (const c of flat) {
    const node = byCategoryId.get(c.category_id)!;
    if (c.parent_id > 0 && byCategoryId.has(c.parent_id)) {
      byCategoryId.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // Parents: sort_order (0 goes bottom) then name.
  roots.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order) || a.name.localeCompare(b.name));

  // Children: regular alphabetical sort under each parent.
  function sortChildren(nodes: CategoryTreeNode[]) {
    for (const n of nodes) {
      n.children.sort((a, b) => a.name.localeCompare(b.name));
      if (n.children.length > 0) sortChildren(n.children);
    }
  }
  sortChildren(roots);
  return roots;
}

/** All descendant category_ids of `rootCategoryId` (excluding itself). */
export function getDescendantIds(flat: CategoryRecord[], rootCategoryId: number): Set<number> {
  const byParent = new Map<number, number[]>();
  for (const c of flat) {
    const p = c.parent_id;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(c.category_id);
  }
  const out = new Set<number>();
  const stack = [...(byParent.get(rootCategoryId) ?? [])];
  while (stack.length) {
    const cid = stack.pop()!;
    out.add(cid);
    for (const child of byParent.get(cid) ?? []) stack.push(child);
  }
  return out;
}

export function collectIdsWithChildren(nodes: CategoryTreeNode[], acc = new Set<string>()) {
  for (const n of nodes) {
    if (n.children.length) {
      acc.add(n.id);
      collectIdsWithChildren(n.children, acc);
    }
  }
  return acc;
}
