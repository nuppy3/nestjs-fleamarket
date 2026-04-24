import { Injectable, NotFoundException } from '@nestjs/common';
import { ReconstituteRegionProps, Region } from '../domain/regions.model';
import { PrismaService } from './../../prisma/prisma.service';
import { RegionMapper } from './region. mapper';

/**
 * RegionRepositoryクラス
 *
 * 【📌 役割】
 * infrastructureに位置し、prisma⇔domain間のやり取りを担う
 * DBクエリの最適化、データの永続化が責務。
 * ユースケースが要求したデータ（例: 生きた店舗数）を、特定のDB技術（PostgreSQL/Prisma）の
 * 能力を最大限に活用して、最も効率的かつ高速に取得すること。
 * ユースケースは「生きた店舗の集計データが欲しい」と抽象的に要求し、インフラ層のRepositoryが
 * その要求を具体的なSQLクエリに変換して最適化を行います。
 *
 * 【prisma⇔domain】のデータ変換について： （Repositoryが担うのもアリだが）
 * domain → prismaInput、prisma → domain の変換はDDD/CAを意識してinfrastructure/mapper
 * に移管している。
 *
 * 外部の世界（データベース、Web、UI）からユースケースとdomain(エンティティ）への変換を行う。
 *
 * 20260421: DDD/CAの中でのRepositoryの役割(BP)は「ドメインの境界」を守る門番
 *
 */
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
    // TODO ここはRegionMapperのtoDomain()に移管するのがDDDを意識した実装
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

  /**
   * save(): エリア情報を更新し(DB更新)、結果をdomainに詰め替えて返却します。(Region + id)
   *
   * infrastructureに位置し、prisma⇔domain間のやり取りを担う
   *
   * @param domainWithId (更新対象domain)
   * @param userId
   * @returns 更新後のエリア情報
   */
  async save(
    domainWithId: Region & { id: string },
    userId: string,
  ): Promise<Region & { id: string }> {
    // 永続化（DB更新) -----
    // domain → prisma
    // 以下はDDDを意識して、RegionMapperのtoPrismaUpdate()に移管
    // const { id, code, name, kanaName, kanaEn, status } = regionWithId;
    // const prismaInput = { code, name, kanaName, kanaEn, status };
    const prismaInput = RegionMapper.toPrismaUpdate(domainWithId, userId);

    // DB更新：本業
    const updated = await this.prismaService.region.update({
      data: prismaInput,
      where: { id: domainWithId.id },
    });

    // prisma → domain (toDomain)
    const savedRegion = RegionMapper.toDomain(updated);

    return savedRegion;
  }
}
