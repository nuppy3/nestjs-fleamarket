import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import type { Request as ExpressRequest } from 'express';

import { RequestUser } from 'src/types/requestUser';
import {
  CreateStoreDto,
  FindAllStoresQueryDto,
  PaginatedStoreResponseDto,
  StoreResponseDto,
} from './dto/store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreFilter } from './stores.model';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /**
   * findAll(): 店舗情報一覧を取得します。
   *
   * クエリパラメータにprefectureCodeが指定：指定したprefectureCodeに関連する店舗のみを返却します。
   * prefectureCode未指定：全店舗を返却します。
   *
   * @returns 店舗情報一覧(Storeオブジェクト配列)
   */
  @Get()
  async findAll(
    // @Query('prefectureCode') prefectureCode?: string,
    // @Query('status') status?: StoreStatus,
    // 上記のクエリパラメータをDTOに集約（DTOの場合@Query()の中のパラメータは省略可
    // クエリパラメータ無しの場合、queryは{}からオブジェクトが渡される
    @Query() query: FindAllStoresQueryDto,
  ): Promise<PaginatedStoreResponseDto> {
    // 店舗情報取得
    const filters: StoreFilter = query; // validation(dto)で入力チェック済みなので、そのまま渡す。
    const paginated = await this.storesService.findAll(filters);
    console.log('*** controller ***');
    console.log('filters: ');
    console.log(filters);

    // domain → dto
    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    // plainToInstanceは以下のように配列(store[]→dto[])にも使えるよ!!
    const plainData = instanceToPlain(
      // paginated.data： (Store & {id:string})[]
      plainToInstance(StoreResponseDto, paginated.data, {
        // @Expose() がないプロパティは全部消える
        excludeExtraneousValues: true,
      }),
      // 値が undefined or null の場合、キーごと消える
      { exposeUnsetFields: false },
    ) as StoreResponseDto[];

    // ページ全体のplain object(DTO): {data/meta} を作成
    const responsePlainDto = {
      data: plainData,
      meta: {
        totalCount: paginated.meta.totalCount,
        page: paginated.meta.page,
        size: paginated.meta.size,
      },
    } satisfies PaginatedStoreResponseDto;

    // memo: もし、PaginatedStoreResponseDtoに@Expose()やgetterでの変換処理などを追加したい
    //       場合は、plainToInstance()をかます必要がある。
    return responsePlainDto;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // +id は単項プラス演算子と呼ばれ、文字列を数値に変換します。（地味だが重要な型変換テクニック）
    // NestJSで @Param('id') を使うと、URLパラメータ（例：GET /stores/123）は 必ず文字列 として渡されるため
    // 123の部分を数値として扱いたいため、+idをしている。
    return this.storesService.findOne(+id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<StoreResponseDto> {
    // 店舗情報(Store domain)取得
    const domain = await this.storesService.findByCodeOrFail(code);

    // domain → dto
    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    const responseDto = instanceToPlain(
      plainToInstance(StoreResponseDto, domain, {
        // @Expose() がないプロパティは全部消える
        excludeExtraneousValues: true,
      }),
      // 値が undefined or null の場合、キーごと消える
      { exposeUnsetFields: false },
    ) as StoreResponseDto;

    return responseDto;
  }

  /**
   * create(): 店舗情報を作成します。
   * @param createStoreDto リクエストBodyパラメータ
   * @returns 店舗情報DTO(StoreResponseDto)
   */
  @Post()
  @UseGuards(AuthGuard('jwt')) // Guard機能を使ってJWT認証を適用：JWT認証の実装はAuthModuleにて実施
  async create(
    @Body() createStoreDto: CreateStoreDto,
    @Request() req: ExpressRequest & { user: RequestUser },
  ): Promise<StoreResponseDto> {
    // 店舗情報作成
    const created = await this.storesService.create(
      createStoreDto,
      req.user.id,
    );
    // domain → dto
    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    return instanceToPlain(
      plainToInstance(StoreResponseDto, created, {
        // @Expose() がないプロパティは全部消える
        // 値が undefined or null の場合、キーごと消える
        excludeExtraneousValues: true,
      }),
    ) as StoreResponseDto;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(+id, updateStoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storesService.remove(+id);
  }
}
