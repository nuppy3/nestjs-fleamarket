import { Prisma, Region as PrismaRegion } from 'generated/prisma';
import { Region } from '../domain/regions.model';

export class RegionMapper {
  // domain → prismaInput
  // 戻り値の型(Prisma.RegionCreateInput)はPrismaが自動生成した型（Prisma.XXXCreateInput）
  static toPrismaCreate(
    domain: Region,
    userId: string,
  ): Prisma.RegionCreateInput {
    const prismaInput = {
      code: domain.code,
      name: domain.name,
      kanaName: domain.kanaName,
      status: domain.status,
      kanaEn: domain.kanaEn,
      userId: userId,
    };
    return prismaInput;
  }

  /**
   * Prisma Data → Region Domain に変換
   *
   * メソッド名をtoDomainにしているが、API→Domainなどのケースが発生したら
   * リネームする（prismaToDomainなど）
   *
   * @param record Prisma Region情報
   * @returns Region Domain + id
   */
  static toDomain(record: PrismaRegion): Region & { id: string } {
    // prisma → domain
    const domain = Region.reconstitute({
      code: record.code,
      name: record.name,
      kanaName: record.kanaName,
      status: record.status,
      kanaEn: record.kanaEn,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    // domain + id
    // 以下のような詰め替え方でsatisfiesするとRegionインスタンスじゃないので（メソッドが無かったり）
    // チェックNGになる。
    // const domainWithId = {
    //   id: record.id,
    //   code: domain.code,
    //   name: domain.name,
    //   kanaName: domain.kanaName,
    //   status: domain.status,
    //   kanaEn: domain.kanaEn,
    //   createdAt: domain.createdAt,
    //   updatedAt: domain.updatedAt,
    // } satisfies Region & { id: string };

    // domain + id
    const domainWithId = Object.assign(domain, { id: record.id });

    return domainWithId;
  }
}
