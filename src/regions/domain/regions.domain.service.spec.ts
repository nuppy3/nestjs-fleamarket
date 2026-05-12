import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from './../../prisma/prisma.service';
import { RegionsDomainService } from './regions.domain.service';

// MockService定義
const mockPrismaSercie = {
  prefecture: {
    count: jest.fn(),
  },
};

describe('■■■ Region test ■■■', () => {
  // DIモジュール
  let regionsDomainService: RegionsDomainService;
  let prismaService: PrismaService;

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    const module = await Test.createTestingModule({
      providers: [
        RegionsDomainService,
        { provide: PrismaService, useValue: mockPrismaSercie },
      ],
    }).compile();

    regionsDomainService =
      module.get<RegionsDomainService>(RegionsDomainService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  // 前処理: 各テストケースの前に毎回実行
  beforeEach(() => {
    console.log('beforeEach: モックをリセット');
    // jest.clearAllMocks();
    jest.resetAllMocks();
  });

  //--------------------------------------
  // validate test
  //--------------------------------------
  describe('validate', () => {
    it('正常系: idに紐づく都道府県が存在しない場合は正常終了する', async () => {
      // prisma mock data 作成 : 紐づく都道府県が0件
      const mockData = 0;
      jest.spyOn(prismaService.prefecture, 'count').mockResolvedValue(mockData);

      // 引数: なんでもいい
      const regionId = '0524dc98-89a2-4db1-9431-b20feff57700';

      // test対象service呼び出し： 戻り値はなし（void) なので正常終了することを確認
      await regionsDomainService.validate(regionId);

      // Prismaへの引数検証
      expect(
        jest.spyOn(prismaService.prefecture, 'count'),
      ).toHaveBeenCalledWith({ where: { regionId: regionId } });
    });

    it('異常系: idに紐づく都道府県がする場合、ConflictExceptionをスローする', async () => {
      // prisma mock data 作成： 紐づく都道府県が存在する
      const mockData = 3;
      jest.spyOn(prismaService.prefecture, 'count').mockResolvedValue(mockData);

      // 引数: なんでもいい
      const regionId = '0524dc98-89a2-4db1-9431-b20feff57700';

      // ConflictExceptionがスローされることをテスト
      await expect(regionsDomainService.validate(regionId)).rejects.toThrow(
        ConflictException,
      );
      await expect(regionsDomainService.validate(regionId)).rejects.toThrow(
        `都道府県が登録されているため、この地域は削除できません。regionId: ${regionId}`,
      );
    });

    // エラーを隠蔽・変換せずに透過的に投げているか
    it('異常系: エラーが発生した場合、元のエラーをそのままスローする(DB接続エラー)', async () => {
      // PrismaClientKnownRequestError以外の一般エラーを作成
      const mockGenericError = new Error('Database connection failed');

      // モックの実装: create()が一般のエラーを投げるように設定
      jest
        .spyOn(prismaService.prefecture, 'count')
        .mockRejectedValue(mockGenericError);

      // 引数: なんでもいい
      const regionId = '0524dc98-89a2-4db1-9431-b20feff57700';

      // 元のエラー（Generic Error）がそのままスローされることをテスト
      await expect(regionsDomainService.validate(regionId)).rejects.toThrow(
        Error,
      );
      await expect(regionsDomainService.validate(regionId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
