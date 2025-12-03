import { Injectable } from '@nestjs/common';
import { Prefecture } from 'src/stores/stores.model';
import { CreatePrefectureDto } from './dto/create-prefecture.dto';
import { UpdatePrefectureDto } from './dto/update-prefecture.dto';

@Injectable()
export class PrefecturesService {
  private prefecture: Prefecture[] = [];
  findAll() {
    // 暫定対応
    this.prefecture = [
      {
        name: '北海道',
        code: '01',
        kanaName: 'ホッカイドウ',
        status: 'published',
        kanaEn: 'hokkaido',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T10:00:00.000Z'),
      },
      {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T10:00:00.000Z'),
      },
    ];
    return this.prefecture;
  }

  create(createPrefectureDto: CreatePrefectureDto) {
    return 'This action adds a new prefecture';
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
