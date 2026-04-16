import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Region as PrismaRegion } from '../../generated/prisma';
import { PrismaService } from './../prisma/prisma.service';
import { RegionFactory } from './domain/regions.factory';
import { Region } from './domain/regions.model';
import { CreateRegionDto } from './dto/region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionMapper } from './infrastructure/region. mapper';
import { RegionRepository } from './infrastructure/region.repository';

@Injectable()
export class RegionsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly regionRepository: RegionRepository,
  ) {}

  /**
   * エリア情報取得（全て）
   */
  async findAll(): Promise<(Region & { id: string })[]> {
    // エリア情報取得
    const regions = await this.prismaService.region.findMany({
      orderBy: { code: 'asc' },
    });

    // prisma → domain
    // .map()は、regionsが空配列の場合も正常に動作し空配列を返却する仕様
    //   const domains: (Region & { id: string })[] = regions.map((region) => ({
    //     id: region.id,
    //     code: region.code,
    //     name: region.name,
    //     kanaName: region.kanaName,
    //     status: region.status,
    //     kanaEn: region.kanaEn,
    //     createdAt: region.createdAt,
    //     updatedAt: region.updatedAt,
    //   }));
    //   return domains;
    // }

    const domains: (Region & { id: string })[] = regions.map(
      (region) => RegionMapper.toDomain(region),
      // id: region.id,
      // code: region.code,
      // name: region.name,
      // kanaName: region.kanaName,
      // status: region.status,
      // kanaEn: region.kanaEn,
      // createdAt: region.createdAt,
      // updatedAt: region.updatedAt,
      //
    );
    return domains;
  }

  findOne(id: number) {
    return `This action returns a #${id} region`;
  }

  /**
   * findByCodeOrFail(): 指定されたcodeに関連するエリア情報をDBから取得し、返却します。
   * 指定されたcodeに関連する店舗情報が存在しない場合はNotFoundExceptionとします。
   *
   * @param code エリアコード
   * @returns エリア情報
   */
  async findByCodeOrFail(code: string): Promise<Region & { id: string }> {
    // エリア情報取得
    const prismaRegion = await this.prismaService.region.findUnique({
      where: { code }, // カラム名とパラメータがイコールなら省略可能(code: code)
    });

    if (!prismaRegion) {
      throw new NotFoundException(
        `codeに関連するエリア情報が存在しません!! code: ${code}`,
      );
    }

    // prisma → domain
    const domain = RegionMapper.toDomain(prismaRegion);

    // const domain = {
    //   id: prismaRegion.id,
    //   code: prismaRegion.code,
    //   name: prismaRegion.name,
    //   kanaName: prismaRegion.kanaName,
    //   status: prismaRegion.status,
    //   kanaEn: prismaRegion.kanaEn,
    //   createdAt: prismaRegion.createdAt,
    //   updatedAt: prismaRegion.updatedAt,
    // } satisfies Region & { id: string };

    return domain;
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

  /**
   * update(): エリア情報更新
   *
   * @param id エリア情報のID（更新対象のkey）
   * @param updateRegionDto 更新対象のエリア情報
   * @param userId ユーザーID
   * @returns
   */
  async update(
    id: string,
    updateRegionDto: UpdateRegionDto,
    userId: string,
  ): Promise<Region & { id: string }> {
    // dto取得
    const { name, code, kanaName, status, kanaEn } = updateRegionDto;

    // DBから更新対象のRegionを取得(なければ404) ---
    // Region取得(DB) → domain (reconstitute)
    const regionWithId = await this.regionRepository.findByIdOrFail(id);

    // domain更新(dtoの項目で更新): ドメインルール（例：特定のステータスなら名前は変えられない等）をチェック
    regionWithId.update({
      name,
      code,
      kanaName,
      status,
      kanaEn,
    } satisfies UpdateRegionDto);

    // 永続化（DB更新) → domain(toDomain)
    const saved = await this.regionRepository.save(regionWithId, userId);

    return saved;
  }

  /**
   * remove(): 指定のidに関連するエリア情報を削除します。
   *           削除したエリア情報を返却します。
   *
   * @param id Region ID (削除対象のエリア情報のキー)
   * @param userId ユーザーID
   * @returns 削除したエリア情報
   */
  async remove(id: string, userId: string): Promise<Region & { id: string }> {
    // 以下のPrismaからのRegion情報取得処理 → infrastructure/repository へ移動

    // Region情報取得
    // ⭐️当service内のfindOne()を呼ぶのは避けるべき（Service内でServiceを呼ぶのは好ましくない)
    // → 正確には、外部の窓口としているfunction(public)を呼ぶのはNGということ
    //   findOne()を呼ぶのはNG。findOne()は外の都合に振り回される（仕様変更）可能性が高いため。
    //   ただ、内部の共通部品として(private)、findByIdOrFail()などを作成し(Idに関連するオブジェクトが
    //   存在しなければエラーを返)実装し、findOne()の中でその内部の共通部品を呼ぶのはOK。
    //   findOne()もupdate()もremove()も、すべて「まずデータがあること」が前提です。
    //   その共通前提を findByCodeOrFail に集約することで、1箇所修正すればすべてのメソッドに反映されます。
    // const prismaRegion = await this.prismaService.region.findUnique({
    //   where: { id },
    // });

    // if (!prismaRegion) {
    //   throw new NotFoundException(
    //     `idに関連するエリア情報が存在しません!! regionId: ${id}`,
    //   );
    // }

    // // prisma → domain
    // const region = Region.reconstitute({
    //   code: prismaRegion.code,
    //   name: prismaRegion.name,
    //   kanaName: prismaRegion.kanaName,
    //   status: prismaRegion.status,
    //   kanaEn: prismaRegion.kanaEn,
    //   createdAt: prismaRegion.createdAt,
    //   updatedAt: prismaRegion.updatedAt,
    // } satisfies ReconstituteRegionProps);

    // // domain + id
    // const regionWithId = Object.assign(region, {
    //   id: prismaRegion.id,
    // });

    // Region情報取得
    // 当service内のfindOne()を呼ぶのは避けるべき（Service内でServiceを呼ぶのは好ましくない)
    // privateとして作成した内部共通functionは読んでもいいらしい。詳しくは上記の⭐️を参照
    //
    const regionWithId = await this.regionRepository.findByIdOrFail(id);

    // domain 削除（ドメインルール実行）
    regionWithId.remove();

    // 永続化: Region情報削除(ソフトデリート)
    // TODO： repositoryに移動
    const deleted = await this.prismaService.region.update({
      data: {
        status: regionWithId.status,
        userId: userId,
        updatedAt: regionWithId.updatedAt,
      },
      where: { id: regionWithId.id },
    });

    // prisma → domain
    // Region domainのプロパティをprivateでカプセル化したことにより、プロパティのアクセスは
    // getter経由になったが、そのgetterなどのメソッドが足りないと(差がある)、satisfies Regionで
    // 怒られてしまう。「Region クラスと全く同じ構造（メソッドも含めて）を持っているか？」を
    // チェックするため、「メソッドが足りない！」と怒られてしまいます。(domainのルールであるremove()も
    // ない）
    // →
    // const domain = { ... } satisfies Region は、メソッドが含まれないため失敗する。
    // 結論：単純にオブジェクト{}にcode,nameなどのプロパティ値をセットして、satisfiesでチェック
    //      するとNGになるので、prisma→domainの値だけの詰め替えは実施しない。
    //      必ず Region.reconstitute(...) を使って、クラスのインスタンス(new Region())として
    //      生成する。
    //      そうすることで、domain.remove() などのメソッドも正しく使えるようになります。
    //      インスタンス(メソッドが含まれている）に対してsatisfies すると問題ないので
    //      決してsatisfiesが悪いわけではない。
    //
    // 以下をコメント化し、Region.reconstitute()に切り替え
    // const domain = {
    //   id: deleted.id,
    //   code: deleted.code,
    //   name: deleted.name,
    //   kanaName: deleted.kanaName,
    //   status: deleted.status,
    //   kanaEn: deleted.kanaEn,
    //   createdAt: deleted.createdAt,
    //   updatedAt: deleted.updatedAt,
    // } satisfies Region & { id: string };

    // prisma → domain (最新の状態をドメイン形式に変換)
    // region = Region.reconstitute(
    //   deleted.code,
    //   deleted.name,
    //   deleted.kanaName,
    //   deleted.status,
    //   deleted.kanaEn,
    //   deleted.createdAt,
    //   deleted.updatedAt,
    // );

    // // domain + id
    // regionWithId = Object.assign(region, { id: deleted.id });

    // 20260402: 上記の詰め替え処理をMapperに移管
    // prisma → domain (最新の状態をドメイン形式に変換)
    return RegionMapper.toDomain(deleted);
  }
}
