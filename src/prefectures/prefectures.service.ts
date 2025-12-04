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
    const prefectures = await this.prismaService.prefecture.findMany({
      orderBy: { code: 'asc' },
    });
    // prisma→domain
    const domains: Prefecture[] = prefectures.map((prefecture) => ({
      ...prefecture,
    }));

    return domains;
  }

  async create(createPrefectureDto: CreatePrefectureDto) {
    // dto取得
    const { name, code, kanaName, status, kanaEn } = createPrefectureDto;

    // dto → domain の詰め替えスキップ

    // domain → prismaインプットパラメータ
    const prismaInput = { name, code, kanaName, status, kanaEn };

    // prisma → domain
    const created = await this.prismaService.prefecture.create({
      data: prismaInput,
    });

    return created;
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
