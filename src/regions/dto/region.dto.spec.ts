import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PAGINATION } from '../../common/constants/pagination.constants';
import { RegionStatus } from '../domain/regions.model';
import { FindAllRegionsQueryDto } from './region.dto';

// クエリパラメータは実際には常にstringで渡ってくるため、
// plainToInstance() による string → number/enum 変換込みで検証する。

describe('■■■ FindAllRegionsQueryDto TEST ■■■', () => {
  describe('バインド確認(正常系)', () => {
    it('page/sizeを文字列で渡した場合、number型に変換され、バリデーションエラーが発生しないこと', async () => {
      const dto = plainToInstance(FindAllRegionsQueryDto, {
        page: '2',
        size: '5',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(2);
      expect(dto.size).toBe(5);
      expect(typeof dto.page).toBe('number');
      expect(typeof dto.size).toBe('number');
    });

    it('code/name/status/page/sizeを同時に指定した場合、すべて正しくバインドされ、バリデーションエラーが発生しないこと', async () => {
      const dto = plainToInstance(FindAllRegionsQueryDto, {
        code: '01',
        name: '北海道',
        status: 'editing',
        page: '3',
        size: '10',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto).toMatchObject({
        code: '01',
        name: '北海道',
        status: 'editing',
        page: 3,
        size: 10,
      });
    });

    it('page/size未指定の場合、バリデーションエラーが発生しないこと(IsOptional)', async () => {
      const dto = plainToInstance(FindAllRegionsQueryDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBeUndefined();
      expect(dto.size).toBeUndefined();
    });
  });

  describe('バリデーション確認(異常系)- size', () => {
    it.each([
      { testCase: '数値以外の文字列', value: 'abc' },
      { testCase: '負数', value: '-1' },
      { testCase: '0', value: '0' },
      {
        testCase: '上限超過',
        value: String(PAGINATION.MAX_PAGE_SIZE + 1),
      },
      { testCase: '小数', value: '1.5' },
    ])('sizeが$testCaseの場合、バリデーションエラーが発生すること', async ({ value }) => {
      const dto = plainToInstance(FindAllRegionsQueryDto, { size: value });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('size');
    });
  });

  describe('バリデーション確認(異常系)- page', () => {
    it.each([
      { testCase: '数値以外の文字列', value: 'abc' },
      { testCase: '負数', value: '-1' },
      { testCase: '0', value: '0' },
      {
        testCase: '上限超過',
        value: String(PAGINATION.MAX_PAGE + 1),
      },
      { testCase: '小数', value: '1.5' },
    ])('pageが$testCaseの場合、バリデーションエラーが発生すること', async ({ value }) => {
      const dto = plainToInstance(FindAllRegionsQueryDto, { page: value });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
    });
  });

  describe('バリデーション確認(異常系)- status', () => {
    it('不正なenum値の場合、バリデーションエラーが発生すること', async () => {
      const dto = plainToInstance(FindAllRegionsQueryDto, {
        status: 'invalid-status',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('status');
    });

    it('正常なenum値の場合、バリデーションエラーが発生しないこと', async () => {
      const dto = plainToInstance(FindAllRegionsQueryDto, {
        status: RegionStatus.PUBLISHED,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
