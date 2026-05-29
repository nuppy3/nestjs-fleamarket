import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../common/domain/errors/domain.exception';

export class DomainExceptionFilter implements ExceptionFilter<DomainException> {
  catch(exception: DomainException, host: ArgumentsHost) {
    // ArgumentsHost(通信モード)をhttpに切り替え： そのほか、GraphQL/gRPC/WebSocket など
    const ctx = host.switchToHttp();
    // ExpressのResponseオブジェクトを取得
    const response = ctx.getResponse<Response>();

    // ステータス/エラーコード/メッセージ
    const status = exception.status;
    const errorCode = exception.errorCode;
    const message = exception.message;

    response.status(status).json({
      statusCode: status,
      errorCode: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}
