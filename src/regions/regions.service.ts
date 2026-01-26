import { ConflictException, Injectable } from '@nestjs/common';
import { Region as PrismaRegion } from 'generated/prisma';
import { PrismaService } from './../prisma/prisma.service';
import { RegionFactory } from './domain/regions.factory';
import { Region } from './domain/regions.model';
import { CreateRegionDto } from './dto/region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionMapper } from './infrastructure/region. mapper';
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
      id: region.id,
      code: region.code,
      name: region.name,
      kanaName: region.kanaName,
      status: region.status,
      kanaEn: region.kanaEn,
      createdAt: region.createdAt,
      updatedAt: region.updatedAt,
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
   * @param userId ユーザーID
   * @returns 作成されたエリア情報
   */
  async create(
    createDto: CreateRegionDto,
    userId: string,
  ): Promise<Region & { id: string }> {
    // dto → domain
    // domain詰め替えはスキップしてもいいが、念の為。
    // RegionFactoryを作成したので、以下のdto展開は不要
    // const { code, name, kanaName, status, kanaEn } = createDto;
    const domain = RegionFactory.fromCreateDto(createDto);

    // domain → prisma(input)
    // dtoから直接作成してもいいが、念の為。
    // 完全にDDDを意識するとMapper(toPrismaCreate())に移管するのがよい
    // 移管したので、以下をコメントアウト
    // const prismaInput = {
    //   code: domain.code,
    //   name: domain.name,
    //   kanaName: domain.kanaName,
    //   status: domain.status,
    //   kanaEn: domain.kanaEn,
    //   userId: userId,
    // };
    const prismaInput = RegionMapper.toPrismaCreate(domain, userId);

    // エリア情報登録（永続化）
    let created: PrismaRegion;
    try {
      created = await this.prismaService.region.create({
        data: prismaInput,
      });
    } catch (e: unknown) {
      // e:unknownはPrismaClientKnownRequestErrorのinstansof問題対策のBP
      // 詳細は、以下のトラブルシューティングを参照
      // https://nuppy3.atlassian.net/wiki/spaces/~712020c7a7ba463a644114a22001124373f0fc/pages/60162052/03_99

      // Prismaの既知のリクエストエラーであるかをチェック

      // eはanyなので、instansof PrismaClientKnownRequestErrorでeの型ガードを行なっているが、
      // instanceof は Prisma 5.x/6.x では信頼性が低い問題のため、削除
      // if (e instanceof PrismaClientKnownRequestError) {
      if (e && typeof e === 'object' && 'code' in e && 'meta' in e) {
        // P2002:一意制約エラー
        if (e.code === 'P2002') {
          const meta = e.meta as { target?: string[] } | undefined;
          const field = meta?.target?.join(', ') || '不明なフィールド';
          // 409 Conflictをスローし、コントローラーとNestJSのエラーハンドリング層でキャッチされる
          throw new ConflictException(`指定された ${field} は既に存在します。`);
        } else {
          throw e;
        }
      }
      throw e;
    }

    // prisma → domain
    // 以下の詰め替え処理をMapper(toDomain)に移管
    // const savedDomain = {
    //   id: created.id,
    //   code: created.code,
    //   name: created.name,
    //   kanaName: created.kanaName,
    //   status: created.status,
    //   kanaEn: created.kanaEn,
    //   createdAt: created.createdAt,
    //   updatedAt: created.updatedAt,
    // } satisfies Region & { id: string };
    const savedDomain = RegionMapper.toDomain(created);

    return savedDomain;
  }

  update(id: number, updateRegionDto: UpdateRegionDto) {
    return `This action updates a #${id} region`;
  }

  remove(id: number) {
    return `This action removes a #${id} region`;
  }
}
