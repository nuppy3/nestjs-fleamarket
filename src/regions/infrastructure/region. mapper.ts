import { Region as PrismaRegion } from 'generated/prisma';
import { Region } from '../domain/regions.model';

export class RegionMapper {
  // domain → prismaInput
  static toPrismaCreate() {}

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
