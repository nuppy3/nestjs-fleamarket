import { Module } from '@nestjs/common';
import { PrefecturesService } from './prefectures.service';
import { PrefecturesController } from './prefectures.controller';

@Module({
  controllers: [PrefecturesController],
  providers: [PrefecturesService],
})
export class PrefecturesModule {}
