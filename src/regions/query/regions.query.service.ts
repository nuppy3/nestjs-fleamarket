import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import type { RegionRepositoryPort } from '../domain/region.repository.port';
import { REGION_REPOSITORY_PORT } from '../domain/region.repository.port';
import { Region } from '../domain/regions.model';
import { RegionDetailReadModel } from './region-detail.read-model';
import { RegionListReadModel } from './region-list.read-model';

/**
 * RegionsQueryServiceService: 参照・表示用のQuery Service
 *
 * ＜ CQRS（コマンドクエリ責務分離） という考え方に基づき、参照・表示用のServiceを分ける＞
 * 役割： 画面が必要なデータを最速で取得します。
 * 特徴： ドメインモデルを介さず、直接PrismaやSQLを使用し画面専用のDTOを返却します。
 *       画面が必要な形に合わせて、複数のテーブルをjoin、カウントしたりして、DTOを返却します。
 */
@Injectable()
export class RegionsQueryService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(REGION_REPOSITORY_PORT)
    private readonly regionRepository: RegionRepositoryPort,
  ) {}

  /**
   * エリア情報リスト取得（全て）
   *
   * @returns エリア情報一覧
   */
  async findAll(): Promise<PaginatedResult<RegionListReadModel>> {
    // prisma経由でRegion情報配列と件数を取得
    // 「Promise.all」を使って複数の非同期処理(findMany()とcount())を並列実行
    // Promise.allは結果を[findMany()の結果, count()の結果]というタプル型(配列)で返すので
    // 分割代入で一発取得するとシンプル
    const [prismaRegions, count] = await Promise.all([
      // エリア情報取得
      this.prismaService.region.findMany({
        include: { _count: { select: { prefectures: true } } },
        orderBy: { code: 'asc' },
      }),
      this.prismaService.region.count(),
    ]);

    // // エリア情報取得
    // const regions = await this.prismaService.region.findMany({
    //   include: { _count: { select: { prefectures: true } } },
    //   orderBy: { code: 'asc' },
    // });

    // // エリア情報の件数
    // const count = await this.prismaService.region.count();

    // prisma → domain
    // .map()は、regionsが空配列の場合も正常に動作し空配列を返却する仕様
    //   const domains: (Region & { id: string })[] = regions.map((region) => ({
    //     id: region.id,
    //     code: region.code,
    //     name: region.name,
    //     kanaName: region.kanaName,
    //     status: region.status,
    //     kanaEn: region.kanaEn,
    //     createdAt: region.createdAt,
    //     updatedAt: region.updatedAt,
    //   }));
    //   return domains;
    // }

    // 20270801: prisma[] → Read Model[] 変換対応のため、以下、コメント
    // // prisma[] → dto[] の 変換ロジック
    // // ⭐️UIを意識して、データ変換などが必要になった際は以下のようなロジックがいい感じ
    // const dtos = regions.map((prismaRegion) => {
    //   // データ変換
    //   const plainObj = {
    //     id: prismaRegion.id,
    //     name: prismaRegion.name,
    //     code: prismaRegion.code,
    //     // kanaName: prismaRegion.kanaName ?? undefined, // 例: nullならundefined
    //     kanaName: prismaRegion.kanaName,
    //     status: prismaRegion.status,
    //     kanaEn: prismaRegion.kanaEn,
    //     prefectureCount: prismaRegion._count.prefectures,
    //     // sortOrder: index + 1, // 例: 連番を画面用に付与
    //   } satisfies Partial<RegionResponseDto>;

    //   // prisma[] → dto[]
    //   return instanceToPlain(
    //     plainToInstance(RegionResponseDto, plainObj, {
    //       // @Expose() がないプロパティは全部消える
    //       // 値が undefined or null の場合、キーごと消える
    //       excludeExtraneousValues: true,
    //     }),
    //   ) as RegionResponseDto;
    // });
    //
    // return dtos;

    // prisma[] → Read Model[]の変換
    const readModels = prismaRegions.map((prismaRegion) => {
      // データ変換
      const readModel = {
        id: prismaRegion.id,
        name: prismaRegion.name,
        code: prismaRegion.code,
        // kanaName: prismaRegion.kanaName ?? undefined, // 例: nullならundefined
        kanaName: prismaRegion.kanaName,
        status: prismaRegion.status,
        kanaEn: prismaRegion.kanaEn,
        prefectureCount: prismaRegion._count.prefectures,
        // sortOrder: index + 1, // 例: 連番を画面用に付与
      } satisfies RegionListReadModel;

      return readModel;
    });

    // ReadModelをページネーション化
    const paginated = {
      data: readModels,
      meta: {
        totalCount: count,
        page: 1,
        size: 20,
      },
    } satisfies PaginatedResult<RegionListReadModel>;

    return paginated;
  }

  /**
   * ※未公開のメソッド。
   * 詳細情報の取得はQuery ServiceのgetDettailByIdOrThrow()を参照。
   *
   * findOne: 指定されたIDのエリア情報(Domain(Entity))を取得します。
   *
   * 指定されたIDのRegionが存在しない場合は `NotFoundException` をスローします。
   *
   * @param id - 取得対象のRegion ID
   * @returns Regionドメインオブジェクト（id付き）
   * @throws {NotFoundException} 指定されたIDのRegionが存在しない場合
   */
  async findOne(id: string): Promise<Region & { id: string }> {
    // DBから更新対象のRegionを取得(なければ404) ---
    // Region取得(DB) → domain (reconstitute)
    return await this.regionRepository.findByIdOrFail(id);
  }

  /**
   * ※未公開のメソッド。
   * findByCodeOrFail(): 指定されたcodeに関連するエリア情報をDBから取得し、返却します。
   *                     指定されたcodeに関連する店舗情報が存在しない場合はNotFoundExceptionとします。
   *
   * @param code エリアコード
   * @returns エリア情報
   */
  async findByCodeOrFail(code: string): Promise<Region & { id: string }> {
    // エリア情報取得 : 以下をRepositoryへ移管
    // const prismaRegion = await this.prismaService.region.findUnique({
    //   where: { code }, // カラム名とパラメータがイコールなら省略可能(code: code)
    // });
    // if (!prismaRegion) {
    //   throw new NotFoundException(
    //     `codeに関連するエリア情報が存在しません!! code: ${code}`,
    //   );
    // }
    // // prisma → domain
    // const domain = RegionMapper.toDomain(prismaRegion);
    // return domain;

    // DBから更新対象のRegionを取得(なければ404) ---
    // Region取得(DB) → domain (reconstitute)
    return await this.regionRepository.findByCodeOrFail(code);
  }

  /**
   * getDetailByIdOrThrow: 指定されたIDのエリア情報詳細を取得します。
   *                            存在しない場合、NotFoundExceptionをthrowします。
   * 公開用のユースケースメソッド。
   * 指定されたIDのRegionが存在しない場合は `NotFoundException` をスローします。
   *
   * @param id - 取得対象のRegion ID
   * @returns Region Detail Read Model(エリア詳細情報)
   * @throws {NotFoundException} 指定されたIDのRegionが存在しない場合
   */
  async getDetailByIdOrThrow(id: string): Promise<RegionDetailReadModel> {
    // DBからRegionを取得
    const prismaRegion = await this.prismaService.region.findUnique({
      include: { _count: { select: { prefectures: true } } },
      where: { id },
    });

    // エリア情報が無ければ
    if (!prismaRegion) {
      throw new NotFoundException(
        `idに関連するエリア情報が存在しません!! regionId: ${id}`,
      );
    }
    // region(DB) → Read Model
    const readModel = {
      id: prismaRegion.id,
      code: prismaRegion.code,
      name: prismaRegion.name,
      kanaName: prismaRegion.kanaName,
      kanaEn: prismaRegion.kanaEn,
      status: prismaRegion.status,
      prefectureCount: prismaRegion._count.prefectures,
      createdAt: prismaRegion.createdAt,
      updatedAt: prismaRegion.updatedAt,
    } satisfies RegionDetailReadModel;

    return readModel;
  }

  /**
   * getDetailByCodeOrThrow: 指定されたcodeのエリア情報詳細を取得します。
   *                            存在しない場合、NotFoundExceptionをthrowします。
   * 公開用のユースケースメソッド。
   * 指定されたcodeのRegionが存在しない場合は `NotFoundException` をスローします。
   *
   * @param code - 取得対象のRegion code
   * @returns Region Detail Read Model(エリア詳細情報)
   * @throws {NotFoundException} 指定されたcodeのRegionが存在しない場合
   */
  async getDetailByCodeOrThrow(code: string): Promise<RegionDetailReadModel> {
    // DBからRegionを取得
    const prismaRegion = await this.prismaService.region.findUnique({
      include: { _count: { select: { prefectures: true } } },
      where: { code },
    });

    // エリア情報が無ければ
    if (!prismaRegion) {
      throw new NotFoundException(
        `codeに関連するエリア情報が存在しません!! regionCode: ${code}`,
      );
    }
    // region(DB) → Read Model
    const readModel = {
      id: prismaRegion.id,
      code: prismaRegion.code,
      name: prismaRegion.name,
      kanaName: prismaRegion.kanaName,
      kanaEn: prismaRegion.kanaEn,
      status: prismaRegion.status,
      prefectureCount: prismaRegion._count.prefectures,
      createdAt: prismaRegion.createdAt,
      updatedAt: prismaRegion.updatedAt,
    } satisfies RegionDetailReadModel;

    return readModel;
  }
}
