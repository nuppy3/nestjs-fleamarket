import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * エリア情報リスト取得（全て）
   *
   * @returns エリア情報一覧
   */
  async findAll(): Promise<RegionListReadModel[]> {
    // エリア情報取得
    const regions = await this.prismaService.region.findMany({
      include: { _count: { select: { prefectures: true } } },
      orderBy: { code: 'asc' },
    });

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
    const readModels = regions.map((prismaRegion) => {
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

    return readModels;
  }

  /**
   * getDetailByIdOrThrow: 指定されたIDのエリア情報詳細を取得します。
   *                            存在しない場合、NotFoundExceptionをthrowします。
   * 公開用のユースケースメソッド。
   * 指定されたIDのRegionが存在しない場合は `NotFoundException` をスローします。
   *
   * @param id - 取得対象のRegion ID
   * @returns Regionドメインオブジェクト（id付き）
   * @throws {NotFoundException} 指定されたIDのRegionが存在しない場合
   */
  async getDetailByIdOrThrow(id: string): Promise<RegionDetailReadModel> {
    // DBから更新対象のRegionを取得
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
}
