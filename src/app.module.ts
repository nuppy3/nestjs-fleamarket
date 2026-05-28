import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { DomainExceptionFilter } from './common/presentation/filters/domain-exception.filter';
import { ItemsNoDbModule } from './items-no-db/items-no-db.module';
import { ItemsModule } from './items/items.module';
import { PrefecturesModule } from './prefectures/prefectures.module';
import { RegionsModule } from './regions/regions.module';
import { StoresModule } from './stores/stores.module';
import { TodoItemsModule } from './todo-items/todo-items.module';

@Module({
  // featureモジュール(子モジュール)、外部モジュールの登録
  // 例：
  // nest.jsのlib（service)を使う場合もimportsに追加するだけ
  // providersに登録不要
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ItemsModule,
    TodoItemsModule,
    ItemsNoDbModule,
    AuthModule,
    StoresModule,
    PrefecturesModule,
    RegionsModule,
  ],
  // コントローラー
  controllers: [],
  // DI対象
  // NestJSでのDomainExceptionFilterのグローバル設定(main.tsでの設定も可能であるが、
  // app.module.tsでの設定がよい)
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter, // 自作のフィルターを指定
    },
  ],
})
export class AppModule {}
