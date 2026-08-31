import { Controller, Get, Post, Put, Body, Param, Query, BadRequestException, Req } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';

@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  async create(@Body() body: any, @Req() request: any) {
    // Log du corps brut
    console.log('Raw body:', JSON.stringify(body, null, 2));
    console.log('Headers:', request.headers);

    // Tenter de construire le DTO manuellement
    const createDonorDto: CreateDonorDto = {
      userId: body.userId || body.user_id || body.userId || request.body?.userId,
      blood_group: body.blood_group || body.bloodGroup,
      donation_types: body.donation_types || body.donationTypes || [],
      wilaya: body.wilaya,
      latitude: body.latitude || 0,
      longitude: body.longitude || 0,
      availability: body.availability ?? true,
      certified: body.certified ?? false,
      has_donated_before: body.has_donated_before ?? false,
      last_donation_date: body.last_donation_date || body.lastDonationDate,
    };

    console.log('DTO construit:', JSON.stringify(createDonorDto, null, 2));

    if (!createDonorDto.userId) {
      throw new BadRequestException({
        message: 'userId est obligatoire',
        received: body,
        constructed: createDonorDto,
      });
    }

    try {
      const donor = await this.donorsService.create(createDonorDto);
      return {
        success: true,
        data: donor,
        message: 'Donneur enregistrÃ© avec succÃ¨s'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  findAll(@Query() query: any) {
    return this.donorsService.findAll({});
  }

  @Get('me')
  findMyProfile(@Query('userId') userId: string) {
    if (!userId) return { message: 'userId requis' };
    return this.donorsService.findByUserId(userId);
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


