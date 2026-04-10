import { Injectable, NotFoundException } from '@nestjs/common';
import { ReconstituteRegionProps, Region } from '../domain/regions.model';
import { PrismaService } from './../../prisma/prisma.service';

@Injectable()
export class RegionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * findById(): id(Region ID)に関連するRegion情報を取得し、Region domainに
   *             詰め替えて返却します。(Region + id)
   *
   * @param id Region ID (PK)
   * @returns Region Domain(Region + id)
   */
  async findByIdOrFail(id: string): Promise<Region & { id: string }> {
    // Region情報取得
    // 当service内のfindOne()を呼ぶのは避けるべき（Service内でServiceを呼ぶのは好ましくない)
    // TODO: いづれinfrastructure/repositoryに移動

    const prismaRegion = await this.prismaService.region.findUnique({
      where: { id },
    });

    if (!prismaRegion) {
      throw new NotFoundException(
        `idに関連するエリア情報が存在しません!! regionId: ${id}`,
      );
    }

    // prisma → domain
    const region = Region.reconstitute({
      code: prismaRegion.code,
      name: prismaRegion.name,
      kanaName: prismaRegion.kanaName,
      status: prismaRegion.status,
      kanaEn: prismaRegion.kanaEn,
      createdAt: prismaRegion.createdAt,
      updatedAt: prismaRegion.updatedAt,
    } satisfies ReconstituteRegionProps);

    // domain + id
    const regionWithId = Object.assign(region, { id });

    return regionWithId;
  }
}
