import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Request as ExpressRequest } from 'express';
import { RequestUser } from 'src/types/requestUser';
import { CreateRegionDto, RegionResponseDto } from './dto/region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionsService } from './regions.service';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  async findAll(): Promise<RegionResponseDto[]> {
    // エリア情報[]取得
    const domains = await this.regionsService.findAll();
    // domain → dto
    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    // plainToInstanceは以下のように配列(store[]→dto[])にも使えるよ!!
    return instanceToPlain(
      plainToInstance(RegionResponseDto, domains, {
        // @Expose() がないプロパティは全部消える
        // 値が undefined or null の場合、キーごと消える
        excludeExtraneousValues: true,
      }),
    ) as RegionResponseDto[];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(+id);
  }

  /**
   * findByCode: 指定されたcodeに関連するエリア情報を取得し、返却します。
   *
   * @param code エリアコード
   * @returns エリア情報（エリアコードに関連する）
   */
  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<RegionResponseDto> {
    // エリア情報取得
    const region = await this.regionsService.findByCodeOrFail(code);
    // domain → dto
    const dto = instanceToPlain(
      plainToInstance(RegionResponseDto, region, {
        // @Expose() がないプロパティは全部消える
        // 値が undefined or null の場合、キーごと消える
        excludeExtraneousValues: true,
      }) satisfies RegionResponseDto,
    ) as RegionResponseDto;

    return dto;
  }
  /**
   * エリア情報登録（永続化）
   *
   * @param createRegionDto エリア登録対象DTO
   * @returns エリア登録後のDTO
   */
  @Post()
  @UseGuards(AuthGuard('jwt')) // Guard機能を使ってJWT認証を適用：JWT認証の実装はAuthModuleにて実施
  async create(
    @Body() createRegionDto: CreateRegionDto,
    @Request() req: ExpressRequest & { user: RequestUser },
  ): Promise<RegionResponseDto> {
    // エリア情報登録（永続化）
    const domain = await this.regionsService.create(
      createRegionDto,
      req.user.id,
    );

    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    return instanceToPlain(
      plainToInstance(RegionResponseDto, domain, {
        // @Expose() がないプロパティは全部消える
        // 値が undefined or null の場合、キーごと消える
        excludeExtraneousValues: true,
      }),
    ) as RegionResponseDto;
  }

  /**
   * update(): エリア情報更新API
   *
   * update()の引数(パラメータ)について
   * IDをURLに含め、更新対象をBodyのDTOから取得する（REST標準）
   * NestJS の CLI（nest g resource）などで自動生成すると、以下のパラメータとなる。
   * update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto)
   *
   * @param id
   * @param updateRegionDto エリア情報更新対象DTO
   * @returns エリア情報更新結果オブジェクト
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt')) // Guard機能を使ってJWT認証を適用：JWT認証の実装はAuthModuleにて実施
  update(
    @Param('id') id: string,
    @Body() updateRegionDto: UpdateRegionDto,
    @Request() req: ExpressRequest & { user: RequestUser },
  ): RegionResponseDto {
    const updated = this.regionsService.update(
      id,
      updateRegionDto,
      req.user.id,
    );

    const hogeDto = new RegionResponseDto();
    hogeDto.name = req.user.id;
    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    return instanceToPlain(
      plainToInstance(RegionResponseDto, hogeDto, {
        // @Expose() がないプロパティは全部消える
        // 値が undefined or null の場合、キーごと消える
        excludeExtraneousValues: true,
      }),
    ) as RegionResponseDto;
  }

  /**
   * remove(): 指定されたid(Region ID)に関連するエリア情報を削除します。（ソフトデリート）
   *           削除されたエリア情報を返却します。
   * @param id Region ID
   * @param req HTTPリクエスト
   * @returns エリア情報(削除された)
   */
  // @Delete() は 「このメソッドはHTTPのDELETEリクエストを処理する」 という宣言をするデコレーター。
  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) // Guard機能を使ってJWT認証を適用：JWT認証の実装はAuthModuleにて実施
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: ExpressRequest & { user: RequestUser },
  ): Promise<RegionResponseDto> {
    // エリア情報削除
    const deleted = await this.regionsService.remove(id, req.user.id);

    // domain → dto
    return instanceToPlain(
      plainToInstance(RegionResponseDto, deleted, {
        excludeExtraneousValues: true,
      }),
    ) as RegionResponseDto;
  }
}
