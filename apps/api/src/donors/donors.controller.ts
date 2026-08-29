import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createOrUpdate(@Request() req, @Body() dto: CreateDonorDto) {
    return this.donorsService.createOrUpdate(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Request() req) {
    return this.donorsService.getMyProfile(req.user.id);
  }

  @Get()
  findAll() {
    return this.donorsService.findAll();
  }
}