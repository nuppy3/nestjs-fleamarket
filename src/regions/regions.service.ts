import { Injectable } from '@nestjs/common';
import { Region } from '../regions/regions.model';
import { PrismaService } from './../prisma/prisma.service';
import { CreateRegionDto } from './dto/region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * エリア情報取得（全て）
   */
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

  /**
   * エリア情報作成
   *
   * @param createDto 作成対象のエリア情報
   * @returns 作成されたエリア情報
   */
  async create(createDto: CreateRegionDto): Promise<Region & { id: string }> {
    // dto → domain
    // domain詰め替えはスキップしてもいいが、念の為。
    // → Regionドメインはinterfaceではなくclass化しているのでconstructorで初期化しやすい
    const { code, name, kanaName, status, kanaEn } = createDto;
    const domain = new Region(code, name, kanaName, status, kanaEn);

    // domain → prisma(input)
    // dtoから直接作成してもいいが、念の為。
    const prismaInput = Object.assign({}, domain);

    // エリア情報作成
    const created = await this.prismaService.region.create({
      data: prismaInput,
    });

    // prisma → domain
    const savedDomain = {
      id: created.id,
      code: created.code,
      name: created.name,
      kanaName: created.kanaName,
      status: created.status,
      kanaEn: created.kanaEn,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    } satisfies Region & { id: string };

    return savedDomain;
  }

  update(id: number, updateRegionDto: UpdateRegionDto) {
    return `This action updates a #${id} region`;
  }

  remove(id: number) {
    return `This action removes a #${id} region`;
  }
}
