import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PrefectureStatus } from '../prefecture.model';

export class CreatePrefectureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaName: string;

  // PrefectureStatusは厳密なEnumではない（modern Enum=union)のだが@IsEnum()が効くみたい！
  @IsEnum(PrefectureStatus, {
    message: `StoreStatus must be one of: ${PrefectureStatus.PUBLISHED}, ${PrefectureStatus.SUSPENDED}`,
  })
  status: PrefectureStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaEn: string;
}
