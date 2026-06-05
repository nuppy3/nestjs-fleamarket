import { Injectable } from '@nestjs/common';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { RegionResponseDto } from '../dto/region.dto';

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
   * エリア情報取得（全て）
   * @returns
   */
  async findAll(): Promise<RegionResponseDto[]> {
    // エリア情報取得
    const regions = await this.prismaService.region.findMany({
      include: { _count: { select: { prefectures: true } } },
      orderBy: { code: 'asc' },
    });

    // prisma[] → dto[] の 変換ロジック
    // ⭐️UIを意識して、データ変換などが必要になった際は以下のようなロジックがいい感じ
    const dtos = regions.map((prismaRegion) => {
      // データ変換
      const plainObj = {
        id: prismaRegion.id,
        name: prismaRegion.name,
        code: prismaRegion.code,
        // kanaName: prismaRegion.kanaName ?? undefined, // 例: nullならundefined
        kanaName: prismaRegion.kanaName,
        status: prismaRegion.status,
        kanaEn: prismaRegion.kanaEn,
        prefectureCount: prismaRegion._count.prefectures,
        // sortOrder: index + 1, // 例: 連番を画面用に付与
      } satisfies Partial<RegionResponseDto>;

      // prisma[] → dto[]
      return instanceToPlain(
        plainToInstance(RegionResponseDto, plainObj, {
          // @Expose() がないプロパティは全部消える
          // 値が undefined or null の場合、キーごと消える
          excludeExtraneousValues: true,
        }),
      ) as RegionResponseDto;
    });

    return dtos;

    // prisma[] → dto[]
    // memo: 元々controller()で実装していたdto変換処理をそのまま
    // return instanceToPlain(
    //   plainToInstance(RegionResponseDto, regions, {
    //     // @Expose() がないプロパティは全部消える
    //     // 値が undefined or null の場合、キーごと消える
    //     excludeExtraneousValues: true,
    //   }),
    // ) as RegionResponseDto[];
  }
}
