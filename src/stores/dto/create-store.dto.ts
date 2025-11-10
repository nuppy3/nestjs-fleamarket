import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { StoreStatus, WEEKDAYS, type Weekday } from './../stores.model';

export class CreateStoreDto {
  // idはリクエストパラメーターで取得しない
  // id: number;
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @IsOptional() // 任意項目デコレーター(渡された値がnullの場合は、以降のIsString、MaxLengthなどを無視する)
  @IsString() // 任意項目だが入力された際のValidation
  @MaxLength(40) // 任意項目だが入力された際のValidation
  kanaName?: string;

  @IsEnum(StoreStatus, {
    message: `StoreStatus must be one of: ${StoreStatus.EDITING}, ${StoreStatus.PUBLISHED}, ${StoreStatus.SUSPENDED}`,
  })
  status: StoreStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  zipCode: string; // 郵便番号

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  prefecture: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessHours?: string; // 営業時間 例："10:00〜20:00"

  @IsOptional()
  @IsString()
  @IsIn(WEEKDAYS, {
    message: `holiday must be one of: ${WEEKDAYS.join(', ')}`,
  })
  holiday?: Weekday;
}
