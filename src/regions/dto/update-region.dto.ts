import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RegionStatus } from '../domain/regions.model';

/**
 * Update用のDTO
 *
 * region.dto.tsに集約してもよかったのだが、NestJsのinitにて
 * 自動生成されたクラスなので、せっかくなので使用。
 *
 * DTO の必須プロパティには ! をつける。（例: name!: string;）
 * DTO の任意プロパティには ? をつける。（例: kanaName?: string;）
 */
export class UpdateRegionDto {
  @IsOptional() // 任意項目デコレーター(渡された値がnullの場合は、以降のIsString、MaxLengthなどを無視する)
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaName?: string;

  @IsOptional()
  // RegionStatusは厳密なEnumではない（modern Enum=union)だが@IsEnum()が効くみたい！
  @IsEnum(RegionStatus, {
    message: `StoreStatus must be one of: ${RegionStatus.PUBLISHED}, ${RegionStatus.SUSPENDED}`,
  })
  status?: RegionStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaEn?: string;
}
