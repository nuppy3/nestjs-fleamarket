import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Regions Domain Serivce:
 * Domainの審判・専門家。複雑なドメインルールの判定などを行います。
 * 例： 紐づく都道府県が存在する場合は削除不可（参照整合性）
 *      判定に必要な「紐づく都道府県の件数」をRegion Domainで保持するのは不自然なので
 *      Domain Serviceで当判定の専門家として、判定を行う。
 *      Prefecture(都道府県)のRepositoryを呼び出し、判定する。
 *      Region domainはPrefecture domainに依存せず、何も知らないので、専門家に聞くような
 *      イメージの役割分担。
 *
 * Regionは関連する都道府県が何件あるか知らないから専門家に聞く
 *     ↓        ↑
 * Resion Domain Service（専門家は都道府県のことを調べて、調査結果を返す)
 *     ↓        ↑
 * Prefecture Repository
 */
@Injectable()
export class RegionsDomainService {
  constructor(private readonly prismaService: PrismaService) {}
}
