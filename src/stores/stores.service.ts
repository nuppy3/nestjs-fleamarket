import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store, Weekday } from './stores.model';

@Injectable()
export class StoresService {
  constructor(private readonly prismaService: PrismaService) {}

  // Storeオブジェクト配列（★DB開通後削除）
  // private stores: Store[] = [];

  async findAll(): Promise<Store[]> {
    // Store情報取得
    const resultStores = await this.prismaService.store.findMany();

    // prisma → domain
    // stores.map((strore) => {})
    const domains: Store[] = [];
    for (const store of resultStores) {
      const domain: Store = {
        // 本来はスプレッド構文(...store)で書きたいが、null / undefined変換問題があるので
        // スプレッド構文で、任意項目(?)を上書きというコードは型エラーが発生するため、
        // 「スプレッド + 上書き」は諦めて、全部明示的に書くのが一番安全で読みやすい
        // ...store,
        id: store.id,
        name: store.name,
        status: store.status,
        email: store.email,
        phoneNumber: store.phoneNumber,
        kanaName: store.kanaName ?? undefined,
        zipCode: store.zipCode ?? undefined,
        address: store.address ?? undefined,
        prefecture: store.prefecture ?? undefined,
        businessHours: store.businessHours ?? undefined,
        // 以下のキャストだと、store.holidaysがnullもしくはundefined時にキャストエラーになってしまう
        // holidays: (store.holidays as Weekday[]) ?? undefined,
        // store.holidaysがnull or undefinedじゃない且つ、殻配列でない場合
        holidays: store.holidays?.length
          ? (store.holidays as Weekday[])
          : undefined,
      };
      domains.push(domain);
    }

    return domains;
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

    // domain → primsaデータ

    // // Store[]に登録（本来はPrisma→DB登録。DB開通後削除）
    // this.stores.push(domainStore);

    // // DB（Prisma）→ Domain(DB連携なしのため、無理やり。。)
    // const savedStore: Store = {
    //   ...this.stores[this.stores.length - 1],
    // };

    return domainStore;
  }

  update(id: number, updateStoreDto: UpdateStoreDto) {
    return `This action updates a #${id} store`;
  }

  remove(id: number) {
    return `This action removes a #${id} store`;
  }
}
