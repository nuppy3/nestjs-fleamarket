import { Injectable } from '@nestjs/common';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  findAll() {
    // dto → domain

    // domain → prisma(imput)

    // prisma → domain

    return `This action returns all regions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} region`;
  }

  create(createRegionDto: CreateRegionDto) {
    return 'This action adds a new region';
  }

  update(id: number, updateRegionDto: UpdateRegionDto) {
    return `This action updates a #${id} region`;
  }

  remove(id: number) {
    return `This action removes a #${id} region`;
  }
}
