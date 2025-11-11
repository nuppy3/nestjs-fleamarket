import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './stores.model';

@Injectable()
export class StoresService {
  // Storeオブジェクト配列
  private stores: Store[] = [];

  findAll(): Store[] {
    return this.stores;
  }

  findOne(id: number) {
    return `This action returns a #${id} store`;
  }

  /**
   * create()
   *
   * @param createStoreDto
   * @returns
   */
  create(createStoreDto: CreateStoreDto): Store {
    // DTO→Storeオブジェクト、からのStore[]にpush
    const store: Store = {
      id: uuid(), // uuidのv4()をuuid()のエイリアスで使用
      ...createStoreDto,
    };
    this.stores.push(store);

    return store;
  }

  update(id: number, updateStoreDto: UpdateStoreDto) {
    return `This action updates a #${id} store`;
  }

  remove(id: number) {
    return `This action removes a #${id} store`;
  }
}
