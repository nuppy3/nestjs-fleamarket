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

  // メソッド名をtoDomainにしているが、API→Domainなどのケースが発生したら
  // リネームする（prismaToDomainなど）
  static toDomain(record: PrismaRegion): Region & { id: string } {
    // prisma → domain
    const domain = Region.reConstruct(
      record.code,
      record.name,
      record.kanaName,
      record.status,
      record.kanaEn,
      record.createdAt,
      record.updatedAt,
    );

    // domain + id
    const domainWithId = {
      ...domain,
      id: record.id,
    } satisfies Region & { id: string };

    return domainWithId;
  }
}
