import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './../prisma/prisma.service';
import { CreatePrefectureDto } from './dto/prefecture.dto';
import { UpdatePrefectureDto } from './dto/update-prefecture.dto';
import { Prefecture } from './prefectures.model';

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
      (prefecture) => ({
        ...prefecture,
      }),
    );

    return domains;
  }

  /**
   * Prefecture配列を返却します。(店舗有りの都道府県情報/昇順)
   * @returns Prefecture配列
   */
  async findAllWithStores(): Promise<(Prefecture & { id: string })[]> {
    // prisma経由でPrefecture情報配列取得
    const prefectures = await this.prismaService.prefecture.findMany({
      orderBy: { code: 'asc' },
    });
    // prisma→domain
    // prefectures.map()は、prefecturesが空配列の場合も正常に動作し空配列を返却する仕様
    const domains: (Prefecture & { id: string })[] = prefectures.map(
      (prefecture) => ({
        ...prefecture,
      }),
    );

    return domains;
  }

  async create(
    createPrefectureDto: CreatePrefectureDto,
  ): Promise<Prefecture & { id: string }> {
    // dto取得
    const { name, code, kanaName, status, kanaEn } = createPrefectureDto;

    // dto → domain の詰め替えスキップ

    // domain → prismaインプットパラメータ
    const prismaInput = { name, code, kanaName, status, kanaEn };

    try {
      // 都道府県情報の登録
      const created = await this.prismaService.prefecture.create({
        data: prismaInput,
      });

      // prisma → domain
      // Prefecture TBL の項目は全てnot nullなので、Object.assign()で詰め替えているが
      // 今後、任意項目が追加された場合は、任意項目の値がない場合、Prismaはnullを返すので、undefined
      // に変換する処理が必要なので、Object.assign()ではなく、一つ一つ項目をセット、変換する。
      const domain: Prefecture & { id: string } = Object.assign({}, created);

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
