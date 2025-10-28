import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { AppModule } from './app.module';
// swqggrのAPIドキュメント生成用パッケージ
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // 🔹 Swagger 設定
  const config = new DocumentBuilder()
    .setTitle('My API：Fleamarket API')
    .setDescription('NestJS APIドキュメント(フリーマーケットAPI)')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // ポートを3000→4000に変更
  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
