import { Controller, Get, Post, Put, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';

@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  async create(@Body() createDonorDto: CreateDonorDto) {
    // Log du body reçu (pour debug)
    console.log('Received body:', JSON.stringify(createDonorDto, null, 2));

    // Vérifier si userId est présent
    if (!createDonorDto.userId) {
      // Renvoyer une erreur avec les données reçues
      throw new BadRequestException({
        message: 'userId est obligatoire',
        received: createDonorDto,
      });
    }

    // Sinon, enregistrer le donneur
    try {
      const donor = await this.donorsService.create(createDonorDto);
      return {
        success: true,
        data: donor,
        message: 'Donneur enregistré avec succès'
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  findAll() {
    return this.donorsService.findAll();
  }

  @Get('me')
  findMyProfile(@Query('userId') userId: string) {
    if (!userId) return { message: 'userId requis en paramètre' };
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