/* istanbul ignore file */
// ↑ これだけで Jest に「このファイルは無視して！」指示！！！
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrefecturesController } from './prefectures.controller';
import { PrefecturesService } from './prefectures.service';

@Module({
  imports: [PrismaModule],
  controllers: [PrefecturesController],
  providers: [PrefecturesService],
})
export class PrefecturesModule {}
