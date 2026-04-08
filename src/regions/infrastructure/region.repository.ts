import { Injectable } from '@nestjs/common';
import { Region } from '../domain/regions.model';
import { PrismaService } from './../../prisma/prisma.service';

@Injectable()
export class RegionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * findById(): id(Region ID)に関連するRegion情報を取得し、Region domainに
   *             詰め替えて返却します。(Region + id)
   *
   * @param id Region ID (PK)
   * @returns Region Domain(Region + id)
   */
  findById(id: string): Region & { id: string } {
    return {} as Region & { id: string };
  }
}
