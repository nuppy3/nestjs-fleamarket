import { CreateRegionDto } from '../dto/region.dto';
import { Region } from './regions.model';

/**
 * RegionドメインのFactory
 * dto → domain
 */
export class RegionFactory {
  static fromCreateDto(dto: CreateRegionDto) {
    // Region作成
    return Region.createNew({
      code: dto.code,
      name: dto.name,
      kanaName: dto.kanaName,
      status: dto.status,
      kanaEn: dto.kanaEn,
    });
  }
}
