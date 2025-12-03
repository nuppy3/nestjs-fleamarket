import { PartialType } from '@nestjs/swagger';
import { CreatePrefectureDto } from './prefecture.dto';

export class UpdatePrefectureDto extends PartialType(CreatePrefectureDto) {}
