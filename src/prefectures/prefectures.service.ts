import { Injectable } from '@nestjs/common';
import { Prefecture } from '../prefectures/prefecture.model';
import { PrismaService } from './../prisma/prisma.service';
import { CreatePrefectureDto } from './dto/prefecture.dto';
import { UpdatePrefectureDto } from './dto/update-prefecture.dto';

@Injectable()
export class PrefecturesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(): Promise<Prefecture[]> {
    // prisma経由でPrefecture情報配列取得
    const prefectures = await this.prismaService.prefecture.findMany();
    // prisma→domain
    const domains: Prefecture[] = prefectures.map((prefecture) => ({
      ...prefecture,
    }));

    return domains;
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
