import { PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PrefectureStatus } from '../prefectures.model';
import { CreatePrefectureDto } from './prefecture.dto';

export class UpdatePrefectureDto extends PartialType(CreatePrefectureDto) {
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
  kanaName?: string | undefined;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaEn?: string | undefined;

  @IsOptional()
  // PrefectureStatusは厳密なEnumではない（modern Enum=union)だが@IsEnum()が効くみたい！
  @IsEnum(PrefectureStatus, {
    message: `StoreStatus must be one of: ${PrefectureStatus.PUBLISHED}, ${PrefectureStatus.SUSPENDED}`,
  })
  status?: PrefectureStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  regionCode?: string;
}
