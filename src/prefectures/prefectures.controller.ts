import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
  CreatePrefectureDto,
  PrefectureResponseDto,
} from './dto/prefecture.dto';
import { UpdatePrefectureDto } from './dto/update-prefecture.dto';
import { PrefecturesService } from './prefectures.service';

@Controller('prefectures')
export class PrefecturesController {
  constructor(private readonly prefecturesService: PrefecturesService) {}

  @Get()
  async findAll(): Promise<PrefectureResponseDto> {
    // Prefecture情報[]取得
    const domains = await this.prefecturesService.findAll();
    // domain → dto
    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    // plainToInstanceは以下のように配列(store[]→dto[])にも使えるよ!!
    return instanceToPlain(
      plainToInstance(PrefectureResponseDto, domains, {
        // @Expose() がないプロパティは全部消える
        // 値が undefined or null の場合、キーごと消える
        excludeExtraneousValues: true,
      }),
    ) as PrefectureResponseDto;
  }

  @Post()
  async create(
    @Body() createPrefectureDto: CreatePrefectureDto,
  ): Promise<PrefectureResponseDto> {
    // Prefecture作成
    const domain = await this.prefecturesService.create(createPrefectureDto);
    // domain → dto
    // instanceToPlain()を咬まさないと、DTOのgetter(statusLabelなど)が機能しなかったので追加している。
    return instanceToPlain(
      plainToInstance(PrefectureResponseDto, domain, {
        // @Expose() がないプロパティは全部消える
        // 値が undefined or null の場合、キーごと消える
        excludeExtraneousValues: true,
      }),
    ) as PrefectureResponseDto;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prefecturesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePrefectureDto: UpdatePrefectureDto,
  ) {
    return this.prefecturesService.update(+id, updatePrefectureDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prefecturesService.remove(+id);
  }
}
