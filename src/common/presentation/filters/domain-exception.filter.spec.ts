import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/domain/errors/domain.exception';
import { DomainExceptionFilter } from './domain-exception.filter';

/**
 * 当該テストコードはGeminiにて生成
 */

// テスト用のダミーのドメイン例外を作成(catchの引数)
class TestDomainException extends DomainException {
  override readonly status = HttpStatus.BAD_REQUEST;
  override readonly errorCode = 'TEST_ERROR';
  constructor() {
    super('テスト用のエラーメッセージです');
    this.name = 'TestDomainException';
  }
}

describe('--- domain-exception.filter TEST ---', () => {
  let domainFilter: DomainExceptionFilter;
  let mockResponse: jest.Mocked<Partial<Response>>;
  let mockArgumentsHost: ArgumentsHost;

  // 前処理: 各テストケースの前に毎回実行
  beforeEach(() => {
    domainFilter = new DomainExceptionFilter();

    // ① Expressの response.status().json() の動きをモック化
    // メソッドチェーン（.status().json()）ができるように、statusは自分自身(this)を返すようにする
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as jest.Mocked<Partial<Response>>; // 一度unknownを経由して安全にキャスト

    // ② NestJSの ArgumentsHost の動きをモック化
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn(),
      }),
    } as unknown as ArgumentsHost;
  });

  describe('catch test', () => {
    it('正常系： DomainExceptionをキャッチして、正しい構造のHTTPレスポンス（JSON）に変換すること', () => {
      const exception = new TestDomainException();

      // 実際にフィルターの catch メソッドを実行
      domainFilter.catch(exception, mockArgumentsHost);

      // ③ 検証：ステータスコードが正しくセットされたか
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

      // ④ 検証：レスポンスのJSON中身が想定通りか
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST, // ※元のコードのタイポ「stasuCode」に合わせています
          errorCode: 'TEST_ERROR',
          message: 'テスト用のエラーメッセージです',
          // as unknownしないと型エラー(警告)「Unsafe assignment of an `any` value.」→
          // 「any 型の値を、オブジェクトのプロパティ（timestamp）に代入している（Unsafe assignment）」
          // が発生する。
          //
          // 解決策①：型キャストでリンターを黙らせる（一番簡単）
          // expect.any(String) の後ろに as unknown を付与します。これで「これは any ではなく安全な
          // 値だよ」とTypeScriptに伝えることができ、警告が消えます。
          timestamp: expect.any(String) as unknown, // 日時文字列が入っていればOK
        }),
      );
    });
  });
});
