import { Controller, Get, Post, Put, Body, Param, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';

@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  async create(@Body() createDonorDto: CreateDonorDto) {
    try {
      // Vérifier que userId est fourni
      if (!createDonorDto.userId) {
        throw new BadRequestException('userId est obligatoire');
      }

      // Vérifier que l'utilisateur existe (optionnel)
      const userExists = await this.donorsService.userExists(createDonorDto.userId);
      if (!userExists) {
        throw new NotFoundException(`Utilisateur avec id ${createDonorDto.userId} non trouvé`);
      }

      // Créer le donneur
      const donor = await this.donorsService.create(createDonorDto);
      return {
        success: true,
        data: donor,
        message: 'Donneur enregistré avec succès'
      };
    } catch (error) {
      // Renvoyer une erreur explicite
      throw error;
    }
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