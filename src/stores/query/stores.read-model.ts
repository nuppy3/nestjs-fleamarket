import { StoreStatus } from 'generated/prisma';
import { PrefectureStatus } from '../../prefectures/prefectures.model';
import { Weekday } from '../stores.model';

/**
 * 店舗情報参照専用モデル
 *
 * 揮発性の高い、UI/APIなどの要件変更の際、都度修正します。
 */
export type StoreReadModel = {
  id: string;
  code?: string;
  name: string;
  kanaName?: string;
  status: StoreStatus;
  zipCode?: string;
  email: string;
  address?: string;
  phoneNumber: string;
  businessHours?: string;
  holidays?: Weekday[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  prefecture?: {
    code: string;
    name: string;
    kanaName: string;
    status: PrefectureStatus;
  };
};
