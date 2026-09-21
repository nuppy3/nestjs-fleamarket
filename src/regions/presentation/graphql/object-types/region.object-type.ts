import { Field, ObjectType } from '@nestjs/graphql';
import { Region, RegionStatus } from '../../../../regions/domain/regions.model';

// -------------------------------------------------
// ObjectType: 型安全なRegionドメインのサブセット
// -------------------------------------------------
export const RegionObjectTypeKeys = [
  'name',
  'code',
  'kanaName',
  'kanaEn',
  'status',
] satisfies (keyof Region)[];

export type RegionObjectTypeShape = Pick<
  Region,
  (typeof RegionObjectTypeKeys)[number]
>;
/**
 * GraphQLのレスポンス定義
 *
 * "@ObjectType","@Field"はTypeScriptの型定義からGraphQLのオブジェクト型を
 * 作成するために使用される
 *
 * コードベースの場合は、このObject-TypeからGraphQLスキーマが自動生成される。
 */
@ObjectType()
export class RegionObjectType implements RegionObjectTypeShape {
  @Field()
  id!: string;

  @Field()
  code!: string;

  @Field()
  name!: string;

  @Field()
  kanaName!: string;

  @Field(() => String, { description: 'カナ英語' })
  kanaEn!: string;

  @Field(() => RegionStatus)
  status!: RegionStatus;
}
