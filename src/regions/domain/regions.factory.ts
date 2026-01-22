import { CreateRegionDto } from '../dto/region.dto';
import { Region } from './regions.model';

/**
 * RegionドメインのFactory
 * dto → domain
 */
export class RegionFactory {
  static fromCreateDto(dto: CreateRegionDto) {
    // TODO
    // 将来的には、Region.createNew()を用意して、Region.createNewを呼び出すだけにする
    // その際、RegionドメインのcreateNew()の中だけでnew Region()できるようにする。
    // 他からnew Region()できないように。
    return new Region(dto.code, dto.name, dto.kanaName, dto.status, dto.kanaEn);
  }
}
