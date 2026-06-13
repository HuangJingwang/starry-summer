export interface AdminContentSelectionState {
  selectedIds: string[];
  selectedCount: number;
  allSelected: boolean;
  partiallySelected: boolean;
}

export function buildAdminContentSelectionState(
  visibleRows: Array<{ id: string }>,
  selectedIds: string[],
): AdminContentSelectionState {
  const visibleIds = new Set(visibleRows.map((item) => item.id));
  const visibleSelectedIds = selectedIds.filter((id) => visibleIds.has(id));
  const visibleSelected = new Set(visibleSelectedIds);
  const allSelected = visibleRows.length > 0 && visibleRows.every((item) => visibleSelected.has(item.id));

  return {
    selectedIds: visibleSelectedIds,
    selectedCount: visibleSelectedIds.length,
    allSelected,
    partiallySelected: visibleSelectedIds.length > 0 && !allSelected,
  };
}
