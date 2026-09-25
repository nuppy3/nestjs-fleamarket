import { Query, Resolver } from '@nestjs/graphql';
import { RegionsQueryService } from 'src/regions/query/regions.query.service';
import {
  RegionObjectType,
  RegionQueryReturnType,
} from './object-types/region.object-type';

@Resolver()
export class RegionsResolver {
  constructor(private readonly queryService: RegionsQueryService) {}

  /**
   * regions: エリア情報一覧を取得するGraphQL Query
   *
   * ページネーションなしの全件取得(RegionsQueryService.findAll()を使用)。
   * ページネーションが必要な場合は、別クエリ`regionsPaginated`(実装予定)を使用する想定。
   *
   * ※戻り値のstatusLabelはこのメソッドでは設定していない。
   *   @ResolveField()側で別途解決されるため、ここではRegionQueryReturnType
   *   (Omit<RegionObjectType, 'statusLabel'>)を返す。
   *
   * @returns エリア情報一覧(statusLabelを除いたRegionObjectType[])
   */
  @Query(() => [RegionObjectType])
  async regions(): Promise<RegionQueryReturnType[]> {
    // エリア情報[] 取得 (ページネーション化されたRegion情報)
    const paginated = await this.queryService.findAll({});

    // ReadModel[] → ObjectType[]
    const objectType = paginated.data.map(
      (readModel) =>
        ({
          id: readModel.id,
          code: readModel.code,
          name: readModel.name,
          kanaName: readModel.kanaEn,
          kanaEn: readModel.kanaEn,
          status: readModel.status,
          prefectureCount: readModel.prefectureCount ?? undefined,
          // statusLabelは@ResolverFieldなので除外
        }) satisfies Omit<RegionObjectType, 'statusLabel'>,
    );

    return objectType;
  }
}
