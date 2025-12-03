import { Injectable } from '@nestjs/common';
import { CreatePrefectureDto } from './dto/create-prefecture.dto';
import { UpdatePrefectureDto } from './dto/update-prefecture.dto';

@Injectable()
export class PrefecturesService {
  create(createPrefectureDto: CreatePrefectureDto) {
    return 'This action adds a new prefecture';
  }

  findAll() {
    return `This action returns all prefectures`;
  }

  findOne(id: number) {
    return `This action returns a #${id} prefecture`;
  }

  update(id: number, updatePrefectureDto: UpdatePrefectureDto) {
    return `This action updates a #${id} prefecture`;
  }

  remove(id: number) {
    return `This action removes a #${id} prefecture`;
  }
}
