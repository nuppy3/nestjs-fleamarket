import { CreateRegionDto } from '../dto/region.dto';
import { Region } from './regions.model';

/**
 * RegionドメインのFactory
 * dto → domain
 */
export class RegionFactory {
  static fromCreateDto(dto: CreateRegionDto) {
    // Region作成
    return Region.createNew(
      dto.code,
      dto.name,
      dto.kanaName,
      dto.status,
      dto.kanaEn,
    );
  }
}
