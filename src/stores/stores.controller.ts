import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { CreateStoreDto, StoreResponseDto } from './dto/store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /**
   * findAll(): 店舗情報一覧を取得します。
   *
   * @returns 店舗情報一覧(Storeオブジェクト配列)
   */
  @Get()
  async findAll(): Promise<StoreResponseDto[]> {
    // 店舗情報取得
    const stores = await this.storesService.findAll();
    // domain → dto
    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    // plainToInstanceは以下のように配列(store[]→dto[])にも使えるよ!!
    return instanceToPlain(
      plainToInstance(StoreResponseDto, stores, {
        // @Expose() がないプロパティは全部消える
        // 値が undefined or null の場合、キーごと消える
        excludeExtraneousValues: true,
      }),
    ) as StoreResponseDto[];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // +id は単項プラス演算子と呼ばれ、文字列を数値に変換します。（地味だが重要な型変換テクニック）
    // NestJSで @Param('id') を使うと、URLパラメータ（例：GET /stores/123）は 必ず文字列 として渡されるため
    // 123の部分を数値として扱いたいため、+idをしている。
    return this.storesService.findOne(+id);
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
  ): Promise<StoreResponseDto> {
    // 店舗情報作成
    const created = await this.storesService.create(createStoreDto);
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
