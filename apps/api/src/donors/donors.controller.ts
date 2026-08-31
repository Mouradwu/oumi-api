import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDonorDto: CreateDonorDto, @Request() req) {
    return this.donorsService.create({
      ...createDonorDto,
      userId: req.user.id,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.donorsService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyProfile(@Request() req) {
    return this.donorsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.donorsService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateData: Partial<CreateDonorDto>) {
    return this.donorsService.update(+id, updateData);
  }
}