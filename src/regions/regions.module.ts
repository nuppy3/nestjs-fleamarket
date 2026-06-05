/* istanbul ignore file */
// ↑ これだけで Jest に「このファイルは無視して！」指示！！！
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RegionsController } from '../regions/presentation/regions.controller';
import { RegionsService } from './application/regions.service';
import { REGION_REPOSITORY_PORT } from './domain/region.repository.port';
import { RegionsDomainService } from './domain/regions.domain.service';
import { RegionRepository } from './infrastructure/region.repository';
import { RegionsQueryService } from './query/regions.query.service';

@Module({
  imports: [PrismaModule],
  controllers: [RegionsController],
  providers: [
    RegionsService,
    RegionsDomainService,
    RegionsQueryService,
    {
      provide: REGION_REPOSITORY_PORT,
      useClass: RegionRepository,
    },
  ],
  exports: [RegionsService],
})
export class RegionsModule {}
