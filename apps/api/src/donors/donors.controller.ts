import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';

@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  create(@Body() createDonorDto: CreateDonorDto) {
    return this.donorsService.create(createDonorDto);
  }

  @Get()
  findAll() {
    return this.donorsService.findAll();
  }

  @Get('me')
  findMyProfile(@Query('userId') userId: string) {
    if (!userId) {
      return { message: 'Veuillez fournir userId en paramètre (ex: ?userId=1)' };
    }
    return this.donorsService.findByUserId(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donorsService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<CreateDonorDto>) {
    return this.donorsService.update(+id, updateData);
  }
}