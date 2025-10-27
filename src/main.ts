import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORSの設定(FEからのアクセスを許可)
  app.enableCors();
  // app.enableCors({
  //   origin: ['http://example.com:1234'],
  //   methods: ['GET', 'POST'],
  // });
  // nushi add: class validationをグローバルに適用
  app.useGlobalPipes(new ValidationPipe());
  // ポートを3000→4000に変更
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
