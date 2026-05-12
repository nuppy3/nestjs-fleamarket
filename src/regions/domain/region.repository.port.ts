import { Region } from './regions.model';

/**
 * Regionドメインを操作・永続化するためのPort
 */
export interface RegionRepositoryPort {
  // 現在のDomainの状態を正しく取得する意味で、Repositoryに配置。
  // findAllなどは、Repositoryではなく、Query Serviceに配置するのが望ましい。
  findByIdOrFail(id: string): Promise<Region & { id: string }>;

  // save: DB更新（永続化)
  save(
    domainWithId: Region & { id: string },
    userId: string,
  ): Promise<Region & { id: string }>;
}
