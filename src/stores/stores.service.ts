import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateStoreDto } from './dto/store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './stores.model';

@Injectable()
export class StoresService {
  // Storeオブジェクト配列（★DB開通後削除）
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
    // dto → domain
    const domainStore: Store = {
      id: uuid(), // uuidのv4()をuuid()のエイリアスで使用
      ...createStoreDto,
    };

    // domain → prisma

    // Store[]に登録（本来はPrisma→DB登録。DB開通後削除）
    this.stores.push(domainStore);

    // DB（Prisma）→ Domain(DB連携なしのため、無理やり。。)
    const savedStore: Store = {
      ...this.stores[this.stores.length - 1],
    };

    return savedStore;
  }

  update(id: number, updateStoreDto: UpdateStoreDto) {
    return `This action updates a #${id} store`;
  }

  remove(id: number) {
    return `This action removes a #${id} store`;
  }
}
