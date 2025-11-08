export type Store = {
  id: string;
  name: string;
  status: StoreStatus;
};

export enum StoreStatus {
  PUBLISHED = 'published', // 掲載中
  EDITING = 'editing', // 編集中
  SUSPENDED = 'suspended', // 停止中
}

// 上記のenumと以下のunionどっちにしようかな問題
// export type StoreStatusUnion = 'published' | 'editing' | 'suspended';
