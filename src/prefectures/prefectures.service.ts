import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './../prisma/prisma.service';
import { CreatePrefectureDto } from './dto/prefecture.dto';
import { UpdatePrefectureDto } from './dto/update-prefecture.dto';
import { Prefecture, PrefectureWithCoverage } from './prefectures.model';

@Injectable()
export class PrefecturesService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Prefecture配列を返却します。(昇順)
   * @returns Prefecture配列
   */
  async findAll(): Promise<(Prefecture & { id: string })[]> {
    // prisma経由でPrefecture情報配列取得
    const prefectures = await this.prismaService.prefecture.findMany({
      orderBy: { code: 'asc' },
    });
    // prisma→domain
    // prefectures.map()は、prefecturesが空配列の場合も正常に動作し空配列を返却する仕様
    const domains: (Prefecture & { id: string })[] = prefectures.map(
      (prefecture) =>
        ({
          // ...prefecture,
          // regionId: prefecture.regionId ?? undefined,

          // 上記スプレッド構文で全展開だと限界が訪れたので、必要項目をチクチクセットするように修正
          id: prefecture.id,
          code: prefecture.code,
          name: prefecture.name,
          kanaName: prefecture.kanaName,
          status: prefecture.status,
          kanaEn: prefecture.kanaEn,
          createdAt: prefecture.createdAt,
          updatedAt: prefecture.updatedAt,
          regionId: prefecture.regionId ?? undefined,
        }) satisfies Prefecture & { id: string },
    );

    return domains;
  }

  /**
   * Prefecture配列を返却します。(店舗有りの都道府県情報と紐づく店舗数/昇順)
   *
   * @returns Prefecture配列(店舗有りの都道府県情報と紐づく店舗数/昇順)
   */
  async findAllWithStoreCount(): Promise<PrefectureWithCoverage[]> {
    // prisma経由でPrefecture情報配列取得（アクティブ店舗のあるPrefecture）
    const prefectures = await this.prismaService.prefecture.findMany({
      where: {
        store: { some: { status: 'published' } },
      },
      include: {
        _count: {
          select: {
            store: { where: { status: 'published' } },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // prisma→domain
    // prefectures.map()は、prefecturesが空配列の場合も正常に動作し空配列を返却する仕様
    const domains: PrefectureWithCoverage[] = prefectures.map((prefecture) => ({
      prefecture: {
        code: prefecture.code,
        name: prefecture.name,
        kanaName: prefecture.kanaName,
        status: prefecture.status,
        kanaEn: prefecture.kanaEn,
        createdAt: prefecture.createdAt,
        updatedAt: prefecture.updatedAt,
        regionId: prefecture.regionId ?? undefined,
      } satisfies Prefecture,
      id: prefecture.id,
      storeCount: prefecture._count.store,
    }));

    return domains;
  }

  async create(
    createPrefectureDto: CreatePrefectureDto,
    userId: string,
  ): Promise<Prefecture & { id: string }> {
    // dto取得
    const { name, code, kanaName, status, kanaEn } = createPrefectureDto;

    // dto → domain の詰め替えスキップ

    // domain → prismaインプットパラメータ
    const prismaInput = { name, code, kanaName, status, kanaEn, userId };

    try {
      // 都道府県情報の登録
      const created = await this.prismaService.prefecture.create({
        data: prismaInput,
      });

      // prisma → domain
      const domain: Prefecture & { id: string } = {
        code: created.code,
        name: created.name,
        kanaName: created.kanaName,
        status: created.status,
        kanaEn: created.kanaEn,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        regionId: created.regionId ?? undefined,
        id: created.id,
      } satisfies Prefecture & { id: string };

      return domain;
      // e:unknownはPrismaClientKnownRequestErrorのinstansof問題対策のBP
      // 詳細は、以下のトラブルシューティングを参照
      // https://nuppy3.atlassian.net/wiki/spaces/~712020c7a7ba463a644114a22001124373f0fc/pages/60162052/03_99
    } catch (e: unknown) {
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
  }

  findOne(id: number) {
    return `This action returns a #${id} prefecture`;
  }

  /**
   * prefectureコードを元に都道府県情報を取得し返却します。
   * 存在しない場合はNotFoundExceptionを投げます。
   *
   * @param code prefectureコード
   * @returns 都道府県情報(Prefectureドメイン＋id)
   * @throws NotFoundException 該当する都道府県が見つからない場合
   */
  async findByCodeOrFail(code: string): Promise<Prefecture & { id: string }> {
    // Prefectureを取得
    const prefecture = await this.prismaService.prefecture.findUnique({
      where: { code },
    });

    // codeに紐づく都道府県情報が無い場合
    if (!prefecture) {
      throw new NotFoundException(`
        codeに関連する都道府県情報が存在しません!! code: ${code}`);
    }

    // Prefecture(Prisma) → domain
    const domain: Prefecture & { id: string } = {
      id: prefecture.id,
      name: prefecture.name,
      code: prefecture.code,
      kanaName: prefecture.kanaName,
      kanaEn: prefecture.kanaEn,
      status: prefecture.status,
      createdAt: prefecture.createdAt,
      updatedAt: prefecture.updatedAt,
      regionId: prefecture.regionId ?? undefined,
    };

    return domain;
  }

  update(id: number, updatePrefectureDto: UpdatePrefectureDto) {
    return `This action updates a #${id} prefecture`;
  }

  remove(id: number) {
    return `This action removes a #${id} prefecture`;
  }
}
