import { Query, Resolver } from '@nestjs/graphql';
import { RegionsQueryService } from 'src/regions/query/regions.query.service';
import { RegionObjectType } from './object-types/region.object-type';

@Resolver()
export class RegionsResolver {
  constructor(private readonly queryService: RegionsQueryService) {}

  /**
   * regions
   *
   * @returns
   */
  @Query(() => [RegionObjectType])
  async regions(): Promise<RegionObjectType[]> {
    const readModel = await this.queryService.findAll({});
    return [
      {
        id: '',
        name: '',
        code: '',
        kanaName: '',
        kanaEn: '',
        status: 'editing',
        statusLabel: '',
      } satisfies RegionObjectType,
    ];
  }
}
