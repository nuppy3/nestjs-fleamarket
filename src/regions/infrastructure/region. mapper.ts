import { Region as PrismaRegion } from 'generated/prisma';
import { Region } from '../domain/regions.model';

export class RegionMapper {
  // メソッド名をtoDomainにしているが、API→Domainなどのケースが発生したら
  // リネームする（prismaToDomainなど）
  static toDomain(record: PrismaRegion) {
    return Region.reConstruct(
      record.code,
      record.name,
      record.kanaName,
      record.status,
      record.kanaEn,
      record.createdAt,
      record.updatedAt,
    );
  }
}
