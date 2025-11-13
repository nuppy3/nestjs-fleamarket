import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateStoreDto } from './dto/store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import type { Store } from './stores.model';
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
  findAll(): Store[] {
    return this.storesService.findAll();
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
   * @returns
   */
  @Post()
  create(@Body() createStoreDto: CreateStoreDto): Store {
    return this.storesService.create(createStoreDto);
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
