import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store, Weekday } from './stores.model';

@Injectable()
export class StoresService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * findAll()：Store情報をDBから取得し、返却します。
   *
   * @returns Storeドメイン（DB取得情報をdomeinに詰め替え）
   */
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
   * create(): 店舗情報を作成し、DB登録します。
   *
   * @param createStoreDto 店舗情報作成用DTO
   * @returns 店舗情報(domain)
   */
  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    // dto → domain
    const domainStore: Store = {
      id: uuid(), // uuidのv4()をuuid()のエイリアスで使用
      ...createStoreDto,
    };

    console.log('process.env.JWT_SECRET:' + process.env.JWT_SECRET);
    // domain → primsaデータ
    const prismaInput = {
      ...domainStore,
    };

    // prisma：Store情報をDB登録
    const created = await this.prismaService.store.create({
      data: prismaInput,
    });

    // prisma → domain
    const savedStore: Store = {
      id: created.id,
      name: created.name,
      status: created.status,
      email: created.email,
      phoneNumber: created.phoneNumber,
      kanaName: created.kanaName ?? undefined,
      zipCode: created.zipCode ?? undefined,
      address: created.address ?? undefined,
      prefecture: created.prefecture ?? undefined,
      businessHours: created.businessHours ?? undefined,
      // string[] → union 変換
      holidays: created.holidays?.length
        ? (created.holidays as Weekday[])
        : undefined,
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
