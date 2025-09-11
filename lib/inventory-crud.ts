export type PackagingItem = {
  id: string;
  qrCode: string;
  type: string;
  size: string;
  material: string;
  status: "available" | "borrowed" | "overdue" | "washing" | "retired";
  storeId: string;
  condition: "good" | "damaged" | "retired";
  maxReuses?: number;
  currentReuses?: number;
};

const items: PackagingItem[] = [];

export const packagingItemCrud = {
  getByStoreId: (storeId: string): PackagingItem[] => items.filter((i) => i.storeId === storeId),
  getById: (id: string): PackagingItem | undefined => items.find((i) => i.id === id),
  getByQrCode: (qrCode: string): PackagingItem | undefined => items.find((i) => i.qrCode === qrCode),
  createMultiple: (
    type: string,
    quantity: number,
    data: Omit<PackagingItem, "id" | "qrCode" | "type">,
  ): PackagingItem[] => {
    const created: PackagingItem[] = [];
    for (let i = 0; i < quantity; i++) {
      const ts = Date.now() + i;
      const item: PackagingItem = { id: `item_${ts}`, qrCode: `QR${ts}`, type, ...data } as PackagingItem;
      items.push(item);
      created.push(item);
    }
    return created;
  },
  update: (id: string, data: Partial<PackagingItem>): PackagingItem | null => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data };
    return items[idx];
  },
  delete: (id: string): boolean => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    return true;
  },
};


