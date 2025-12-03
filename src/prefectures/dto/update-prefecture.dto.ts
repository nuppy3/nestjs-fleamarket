import { PartialType } from '@nestjs/swagger';
import { CreatePrefectureDto } from './create-prefecture.dto';

export class UpdatePrefectureDto extends PartialType(CreatePrefectureDto) {}
