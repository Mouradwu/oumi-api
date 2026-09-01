import { Controller, Get, Post, Put, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';

@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  async create(@Body() createDonorDto: CreateDonorDto) {
    try {
      const donor = await this.donorsService.create(createDonorDto);
      return {
        success: true,
        data: donor,
        message: 'Donneur enregistre avec succes',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  findAll(
    @Query('blood_type') blood_type?: string,
    @Query('donation_type') donation_type?: string,
    @Query('wilaya_id') wilaya_id?: string,
    @Query('availability_status') availability_status?: string,
  ) {
    return this.donorsService.findAll({ blood_type, donation_type, wilaya_id, availability_status });
  }

  @Get('me')
  findMyProfile(@Query('userId') userId: string) {
    if (!userId) return { message: 'userId requis' };
    return this.donorsService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donorsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<CreateDonorDto>) {
    return this.donorsService.update(id, updateData);
  }
}
