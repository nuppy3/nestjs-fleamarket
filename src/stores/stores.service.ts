import { Injectable, NotFoundException } from '@nestjs/common';
import { Prefecture } from './../prefectures/prefectures.model';

// uuidはDBでデフォルト登録するため不要
// import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Prisma } from 'generated/prisma';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { PrefecturesService } from '../prefectures/prefectures.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SortOrder, Store, StoreFilter, Weekday } from './stores.model';

@Injectable()
export class StoresService {
  constructor(
    private readonly configService: ConfigService,
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
   * @returns ページネーションされた情報：
   *          1. Storeドメイン + id（DB取得情報をdomein+idオブジェクトに詰め替え）
   *          2. meta情報(Store情報のそう件数)
   */
  async findAll(
    // filtersが存在しない(filters === undefined のとき)場合は{}で初期化
    // memo: filtersがnullの際は{}で初期化されない。が、nullを渡そうとしても
    // 「型 'null' の引数を型 'StoreFilter | undefined' のパラメーターに割り当てることはできません。」
    // で、tslint？が弾いてくれる。
    // また、リクエストパラメータで?name=nullというパラメータがリクエストされたとしても、
    // controllerはname='null'という文字列で受け取るためserviceにnullが渡ってくることはない。
    filters: StoreFilter = {},
  ): Promise<PaginatedResult<Store & { id: string }>> {
    console.log('*** service ***');
    console.log('filters: ');
    console.log(filters);

    // order〜by句の構築
    const orderBy = this.buildStoreOrderBy(filters);

    // where句の構築（共通）
    const commonWhere = this.buildWhere(filters);

    // ページネーション計算
    // size指定が無けれのデフォルト設定 (また、size〜100までに制限、マイナスの場合はdefaultに置換)
    // マイナスを１に置換：Math.max(1, filters.size) そのまえに、undefindの場合は
    // 20に置換（filters.size ?? 20）
    const defaultSize =
      this.configService.get<number>('STORE_DEFAULT_PAGE_SIZE') ?? 20;
    const size = Math.min(100, Math.max(1, filters.size ?? defaultSize));

    // page指定が無ければデフォルト設定(上限値:10000)
    const defaultPage =
      this.configService.get<number>('STORE_DEFAULT_PAGE') ?? 1;
    filters.page = Math.min(10000, Math.max(1, filters.page ?? defaultPage));
    const skip = (filters.page - 1) * size;

    // Store情報取得
    // 「Promise.all」を使って複数の非同期処理(findMany()とcount())を並列実行
    // Promise.all は結果を [dataの結果, countの結果] という配列で返すので分割代入で
    // 一発取得するとシンプル（const [resultStores, count] = ・・・）
    const [resultStores, count] = await Promise.all([
      // findMany()
      this.prismaService.store.findMany({
        include: {
          prefecture: true,
        },
        where: commonWhere,
        // Limit
        take: size,
        // Offset (最初のXX件を飛ばす)
        skip: skip,

        // order byの指定が複雑化してきたのでメソッド化し、以下をコメント
        // ...(filters.sortOrder && {
        //   orderBy: { kanaName: filters.sortOrder },
        // }),
        orderBy,
      }),

      // count(): 店舗情報一覧の総件数
      this.prismaService.store.count({
        // count() はレコードの存在数だけを数えるので、リレーション（prefecture）を読み込む必要がない
        // include: {
        //   prefecture: true,
        // },

        where: commonWhere,
      }),
    ]);

    // Stroe一覧の件数取得は上記のように「Promise.all」を使って複数の非同期処理を並列実行
    // await this.prismaService.store.count(・・・・);

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
        code: prismaStore.code ?? undefined,
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

    // 返却オブジェクト: ページネーションされたStoreドメイン情報
    const paginated: PaginatedResult<Store & { id: string }> = {
      data: domains,
      meta: {
        totalCount: count,
        page: filters.page,
        size: size,
      },
    };

    return paginated;
  }

  findOne(id: number) {
    return `This action returns a #${id} store`;
  }

  findByCodeOrFail(code: string) {
    return `This action returns a #${code} store`;
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
      code: created.code ?? undefined,
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

  /**
   * Storeの Order By 条件の構築
   *
   * default:
   *  kanaNameのASC(昇順)
   */
  private buildStoreOrderBy(
    filters: StoreFilter,
  ): Prisma.StoreOrderByWithRelationInput[] {
    // Order By 条件の構築
    // StoreOrderByWithRelationInput: Prismaが自動生成する型で、「Storeモデルを
    // ソート（orderBy）するときに使える条件の型」
    // Prismaの findMany や findFirst などで orderBy を指定するときに使う、型安全なソートオプションの型です。
    const orderBy: Prisma.StoreOrderByWithRelationInput[] = [];

    // 以下のif文(sortByが指定されている場合以降）を正規化
    // sortBy、sortOrderの指定がない場合、defaultのソートを指定
    // keyof Store を使うと、存在しないフィールド名を指定するとコンパイルエラーになる(型安全にデフォルトフィールドを指定)
    // そこまでやる必要はないが、型安全実装をしてみた。
    const defaultSortField: keyof Store = 'kanaName';
    const sortField = filters.sortBy ?? defaultSortField;
    const sortDirection = filters.sortOrder ?? SortOrder.ASC;
    // orderByを構築
    orderBy.push({
      [sortField]: sortDirection,
    });

    // sortByが指定されている場合
    // if (filters.sortBy) {
    //   if (filters.sortOrder) {
    //     orderBy.push({
    //       [filters.sortBy]: filters.sortOrder,
    //     });
    //     // defaultのソート
    //   } else {
    //     orderBy.push({
    //       [filters.sortBy]: SortOrder.ASC,
    //     });
    //   }
    // } else {
    //   // sortOrderのみ指定されていた場合、kanaName(default)でソート
    //   if (filters.sortOrder) {
    //     orderBy.push({
    //       kanaName: filters.sortOrder,
    //     });
    //   }
    // }

    return orderBy;
  }

  /**
   * findAllのWhere句を作成します。（共通部分）
   *
   * where → 基本はオブジェクト（AND条件）: Prisma.StoreWhereInput
   * 複数条件をORで結合したいときだけ : Prisma.StoreWhereInput[]
   * { OR: [...] } や配列をORキーに入れる。
   *
   * @param filters 検索条件
   * @returns where句（共通部分)
   */
  private buildWhere(filters: StoreFilter): Prisma.StoreWhereInput {
    // 以下でもいいが、「...(条件 && { 追加したいオブジェクト }) が非常にエレガント!!」であり
    // Prismaのwhere句の実装では有益！！
    //  where: filters.prefectureCode
    //   ? { prefecture: { code: filters.prefectureCode } }
    //   : {},

    // エレガントコード！：「条件が満たされたら、このオブジェクトを展開して追加してね」
    // filters.prefectureCodeがtruthy(null/undefined/''/数値の0/false 以外)の場合、
    // ...(スプレッド構文)で、prefectureオプジェクトを転換して追加。

    // where句はOrder byのように配列ではなく、オブジェクトで作成することが多い。
    // where句は基本的にはAND条件になるので。ORの条件がある場合は、配列にする。
    // const where: Prisma.StoreWhereInput[] = [];
    const where: Prisma.StoreWhereInput = {
      // Prisma仕様：値が undefined のプロパティは、クエリ（Where句）から自動的に除外されるという
      // 非常に便利な性質があります。
      // filters.status がundefinedの場合、Prismaはその検索条件を無視してくれる！
      // 以下のnameなどと同様に...(filters.name && {をカマしても同様のクエリが作成されるが
      // statusのケースのように単純な条件の場合は以下がBP。
      status: filters.status,
      // ...(filters.name && { をカマさず、上記のstatusと同様に「name: { contains: filters.name }」
      // と実装してしまうと、注意が必要 → もし filters.name が undefined だった場合、
      // Prismaは { name: { contains: undefined } } と解釈しようとして、エラーを投げるか
      // 意図しない挙動になるバージョンがあります
      ...(filters.name && {
        name: { contains: filters.name },
      }),
      ...((filters.prefectureCode || filters.regionCode) && {
        prefecture: {
          ...(filters.prefectureCode && { code: filters.prefectureCode }),
          ...(filters.regionCode && {
            region: { code: filters.regionCode },
          }),
        },
      }),

      // [重要] 以下は削除：prefectureCodeとregionCodeをANDで指定するためには、以下だとprefecture:
      // に対するQueryが重複してしまい、後がち（上書き）されてしまうので、上記のようにprefecture:
      // のコードの中に含める必要がある。
      // ...(filters.regionCode && {
      //   prefecture: {
      //     region: {
      //       code: filters.regionCode,
      //     },
      //   },
      // }),
    };

    return where;
  }
}
