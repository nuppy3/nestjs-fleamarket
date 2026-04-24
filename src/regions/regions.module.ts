/* istanbul ignore file */
// ↑ これだけで Jest に「このファイルは無視して！」指示！！！
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RegionRepository } from './infrastructure/region.repository';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';
import { RegionsDomainService } from './domain/regions.domain.service';

@Module({
  imports: [PrismaModule],
  controllers: [RegionsController],
  providers: [RegionsService, RegionRepository, RegionsDomainService],
  exports: [RegionsService],
})
export class RegionsModule {}
