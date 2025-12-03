import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreatePrefectureDto } from './dto/create-prefecture.dto';
import { UpdatePrefectureDto } from './dto/update-prefecture.dto';
import { PrefecturesService } from './prefectures.service';

@Controller('prefectures')
export class PrefecturesController {
  constructor(private readonly prefecturesService: PrefecturesService) {}

  @Get()
  findAll() {
    return this.prefecturesService.findAll();
  }

  @Post()
  create(@Body() createPrefectureDto: CreatePrefectureDto) {
    return this.prefecturesService.create(createPrefectureDto);
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
