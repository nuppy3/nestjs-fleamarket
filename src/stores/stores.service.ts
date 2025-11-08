import { Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store, StoreStatus } from './stores.model';

@Injectable()
export class StoresService {
  // Storeオブジェクト配列
  private stores: Store[] = [];

  findAll(): Store[] {
    this.stores = [
      { id: '001', name: '001店舗', status: StoreStatus.EDITING },
      { id: '002', name: '002店舗', status: StoreStatus.EDITING },
      { id: '003', name: '003店舗', status: StoreStatus.EDITING },
    ];
    return this.stores;
  }

  findOne(id: number) {
    return `This action returns a #${id} store`;
  }

  create(createStoreDto: CreateStoreDto) {
    return 'This action adds a new store';
  }

  update(id: number, updateStoreDto: UpdateStoreDto) {
    return `This action updates a #${id} store`;
  }

  remove(id: number) {
    return `This action removes a #${id} store`;
  }
}
