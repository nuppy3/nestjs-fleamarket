import { Injectable } from '@nestjs/common';
// uuidはDBでデフォルト登録するため不要
// import { v4 as uuid } from 'uuid';
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
   * @returns Storeドメイン + id（DB取得情報をdomein+idオブジェクトに詰め替え）
   */
  async findAll(): Promise<(Store & { id: string })[]> {
    // Store情報取得
    const resultStores = await this.prismaService.store.findMany({
      where: { status: 'published' },
    });

    // prisma → domain
    // stores.map((strore) => {})
    const domains: (Store & { id: string })[] = [];
    for (const prismaStore of resultStores) {
      const domain: Store & { id: string } = {
        // 本来はスプレッド構文(...store)で書きたいが、null / undefined変換問題があるので
        // スプレッド構文で、任意項目(?)を上書きというコードは型エラーが発生するため、
        // 「スプレッド + 上書き」は諦めて、全部明示的に書くのが一番安全で読みやすい
        // ...store,
        id: prismaStore.id,
        name: prismaStore.name,
        status: prismaStore.status,
        email: prismaStore.email,
        phoneNumber: prismaStore.phoneNumber,
        kanaName: prismaStore.kanaName ?? undefined,
        zipCode: prismaStore.zipCode ?? undefined,
        address: prismaStore.address ?? undefined,
        // Store modelからprefectureを削除↓
        // prefecture: prismaStore.prefecture ?? undefined,
        businessHours: prismaStore.businessHours ?? undefined,
        // 以下のキャストだと、store.holidaysがnullもしくはundefined時にキャストエラーになってしまう
        // holidays: (store.holidays as Weekday[]) ?? undefined,
        // store.holidaysがnull or undefinedじゃない且つ、空配列でない場合
        holidays: prismaStore.holidays?.length
          ? (prismaStore.holidays as Weekday[])
          : undefined,
        createdAt: prismaStore.createdAt,
        updatedAt: prismaStore.updatedAt,
        userId: prismaStore.userId,
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
   * @returns 店舗情報(domain+id)
   */
  async create(
    createStoreDto: CreateStoreDto,
    userId: string,
  ): Promise<Store & { id: string }> {
    // 分割代入で必要な項目のみを取得：これがベスト(理由は以下の超重要!!を参照)
    const {
      name,
      kanaName,
      status,
      zipCode,
      email,
      address,
      phoneNumber,
      businessHours,
      holidays,
    } = createStoreDto;

    // dto → domain
    // const domainStore: Store = {
    //   // uuidはDBでデフォルト登録するため不要 且つ、v4の超有名な「uuid + ESM + Jest」の罠画あるため
    //   // id: uuid(), // uuidのv4()をuuid()のエイリアスで使用
    //   ...createStoreDto,
    // };

    // dto → domain - {createAt/updatedAt}
    // ※StoreドメインからcreatedAt/updatedAtを抜いたオブジェクト
    // dto(リクエストパラメータ)には当然ながらcreatedAt/updatedAtが存在しないため。
    // 直接、DTO → primsaデータ すればいいのだが、厳密なDDD/CAを実装してみた。
    const domainStore: Omit<Store, 'prefecture' | 'createdAt' | 'updatedAt'> = {
      // 超重要!!：以下のようにスプレッド構文だと、createStoreDtoに予期せぬパラメータが入ってきても
      // domainStoreにセットされてしまう。いくらOmitで型制御しても、コンパイルは通るが実際は
      // 予期せぬパラメータ（prefectureもcreateAtも、それこそ hogehogeとかも）入ってくる。
      // → 分割代入で取得後に明示的に代入がベストプラクティス！
      // ...createStoreDto,
      name,
      kanaName,
      status,
      zipCode,
      email,
      address,
      phoneNumber,
      businessHours,
      holidays,
      userId, // Userとのリレーション
    };

    // domain → primsaデータ
    const prismaInput = {
      ...domainStore,
    };

    // prisma：Store情報をDB登録
    const created = await this.prismaService.store.create({
      data: prismaInput,
    });

    // prisma → domain
    const savedStore: Store & { id: string } = {
      id: created.id,
      name: created.name,
      status: created.status,
      email: created.email,
      phoneNumber: created.phoneNumber,
      kanaName: created.kanaName ?? undefined,
      zipCode: created.zipCode ?? undefined,
      address: created.address ?? undefined,
      // Store modelから、prefectureを削除
      // prefecture: created.prefecture ?? undefined,
      businessHours: created.businessHours ?? undefined,
      // string[] → union 変換
      holidays: created.holidays?.length
        ? (created.holidays as Weekday[])
        : undefined,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      // 警告が出る理由：外部キーの特殊性のため、Unsafe assignment of an error typed value.」エラー
      // 回避のため、as stringを追加
      userId: created.userId,
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
