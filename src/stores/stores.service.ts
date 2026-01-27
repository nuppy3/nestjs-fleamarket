import { Injectable, NotFoundException } from '@nestjs/common';

// uuidはDBでデフォルト登録するため不要
// import { v4 as uuid } from 'uuid';
import { Prefecture } from '../prefectures/prefectures.model';
import { PrefecturesService } from '../prefectures/prefectures.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store, StoreFilter, Weekday } from './stores.model';

@Injectable()
export class StoresService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly prefectureService: PrefecturesService,
  ) {}

  /**
   * findAll()：Store情報をDBから取得し、返却します。
   *
   * @param filters - 検索条件（すべて省略可能）
   *                  - `prefectureCode`: 都道府県コード（例: "13" = 東京都）を指定すると、その都道府県に所属する店舗のみを返します
   *                  - 指定がない場合は全店舗を対象とします
   * @example
   * ```ts
   * // 東京都の店舗のみ取得
   * await storesService.findAll({ prefectureCode: "13" });
   *
   * // 全店舗を取得（フィルタなし）
   * await storesService.findAll();
   * ```
   * @returns Storeドメイン + id（DB取得情報をdomein+idオブジェクトに詰め替え）
   */
  async findAll(
    // filtersが存在しない場合は{}で初期化
    filters: StoreFilter = {},
  ): Promise<(Store & { id: string })[]> {
    console.log('*** service ***');
    console.log('filters: ');
    console.log(filters);

    // Store情報取得
    const resultStores = await this.prismaService.store.findMany({
      include: {
        prefecture: true,
      },

      // 以下でもいいが、「...(条件 && { 追加したいオブジェクト }) が非常にエレガント!!」であり
      // Prismaのwhere句の実装では有益！！
      //  where: filters.prefectureCode
      //   ? { prefecture: { code: filters.prefectureCode } }
      //   : {},

      // エレガントコード！：「条件が満たされたら、このオブジェクトを展開して追加してね」
      // filters.prefectureCodeがtruthy(null/undefined/''/数値の0/false 以外)の場合、
      // ...(スプレッド構文)で、prefectureオプジェクトを転換して追加。
      where: {
        // Prisma仕様：値が undefined のプロパティは、クエリ（Where句）から自動的に除外されるという
        // 非常に便利な性質があります。
        // filters.status がundefinedの場合、Prismaはその検索条件を無視してくれる！
        status: filters.status,
        ...(filters.prefectureCode && {
          prefecture: {
            code: filters.prefectureCode,
          },
        }),
      },
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
        // prismaStore.prefectureがnull/undefinedでなければ必要なプロパティをセットした
        // オブジェクトをprefecture(値オブジェクト ≒ prefectureドメイン)にセット
        prefecture: prismaStore.prefecture
          ? {
              name: prismaStore.prefecture?.name,
              code: prismaStore.prefecture?.code,
              kanaName: prismaStore.prefecture?.kanaName,
              status: prismaStore.prefecture?.status,
              kanaEn: prismaStore.prefecture?.kanaEn,
              createdAt: prismaStore.prefecture?.createdAt,
              updatedAt: prismaStore.prefecture?.updatedAt,
            }
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
      prefectureCode,
      phoneNumber,
      businessHours,
      holidays,
    } = createStoreDto;

    // prefectureCodeの妥当性チェック
    let prefecture: (Prefecture & { id: string }) | undefined = undefined;
    if (prefectureCode) {
      try {
        prefecture =
          await this.prefectureService.findByCodeOrFail(prefectureCode);
      } catch (e: unknown) {
        if (e instanceof NotFoundException) {
          // codeに紐づくprefectureが存在しない場合はエラー
          throw new NotFoundException(
            `prefectureCodeに該当する都道府県情報が存在しません。 prefectureCode: ${prefectureCode}`,
          );
        }
      }
    }

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
    const domainStore: Omit<
      Store,
      'prefectureCode' | 'createdAt' | 'updatedAt'
    > = {
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
      prefecture,
    };

    // domain → primsaデータ
    const prismaInput = {
      name: domainStore.name,
      kanaName: domainStore.kanaName,
      status: domainStore.status,
      zipCode: domainStore.zipCode,
      email: domainStore.email,
      address: domainStore.address,
      phoneNumber: domainStore.phoneNumber,
      businessHours: domainStore.businessHours,
      holidays: domainStore.holidays,
      userId: domainStore.userId,
      prefectureId: prefecture?.id,
    };

    // prisma：Store情報をDB登録
    const created = await this.prismaService.store.create({
      data: prismaInput,
      include: {
        prefecture: {
          select: {
            code: true,
            name: true,
            kanaName: true,
            kanaEn: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
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
      // prefecture(値オブジェクト)
      prefecture: created.prefecture ?? undefined,
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
