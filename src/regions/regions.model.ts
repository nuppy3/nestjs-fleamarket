export class Region {
  code: string;
  name: string;
  kanaName: string;
  status: RegionStatus;
  kanaEn: string;
  createdAt: Date;
  updatedAt: Date;
}

export const RegionStatus = {
  PUBLISHED: 'published', // 掲載中
  SUSPENDED: 'suspended', // 停止中
} as const;

// RegionStatus Type
export type RegionStatus = (typeof RegionStatus)[keyof typeof RegionStatus];
