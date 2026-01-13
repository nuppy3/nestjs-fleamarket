import { Injectable } from '@nestjs/common';
import { Region } from '../regions/regions.model';
import { PrismaService } from './../prisma/prisma.service';
import { CreateRegionDto } from './dto/region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(private readonly prismaService: PrismaService) {}
  async findAll(): Promise<(Region & { id: string })[]> {
    // エリア情報取得
    const regions = await this.prismaService.region.findMany();
    // prisma → domain
    // .map()は、regionsが空配列の場合も正常に動作し空配列を返却する仕様
    const domains: (Region & { id: string })[] = regions.map((region) => ({
      ...region,
    }));
    return domains;
  }

  findOne(id: number) {
    return `This action returns a #${id} region`;
  }

  create(createDto: CreateRegionDto) {
    return 'This action adds a new region';
  }

  update(id: number, updateRegionDto: UpdateRegionDto) {
    return `This action updates a #${id} region`;
  }

  remove(id: number) {
    return `This action removes a #${id} region`;
  }
}
