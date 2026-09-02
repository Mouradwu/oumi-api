import { Controller, Get, Post, Put, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { BloodProduct, BloodType } from '../compatibility/compatibility.service';

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

  // IMPORTANT : cette route doit rester declaree AVANT ':id' (NestJS/Express
  // font correspondre les routes dans l'ordre de declaration - sans cela
  // "/donors/compatible" serait intercepte par "/donors/:id" avec
  // id="compatible").
  @Get('compatible')
  findCompatible(
    @Query('blood_type') bloodType: string,
    @Query('product') product: string = 'SANG',
    @Query('wilaya_id') wilayaId?: string,
    @Query('commune_id') communeId?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius_km') radiusKm?: string,
    @Query('only_available') onlyAvailable?: string,
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
  ) {
    return this.donorsService.findCompatible({
      recipientBloodType: bloodType as BloodType,
      product: product as BloodProduct,
      wilayaId: wilayaId ? parseInt(wilayaId, 10) : undefined,
      communeId: communeId ? parseInt(communeId, 10) : undefined,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      onlyAvailable: onlyAvailable !== 'false',
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
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

  @Get('dashboard')
  getDashboard(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId requis');
    return this.donorsService.getDashboard(userId);
  }

  @Post(':id/confirm-donation')
  confirmDonation(@Param('id') id: string) {
    return this.donorsService.confirmDonation(id);
  }

  // Badge de compatibilite pour la fiche publique d'un donneur (section 15).
  @Get(':id/compatibility')
  getCompatibility(
    @Param('id') id: string,
    @Query('blood_type') recipientBloodType: string,
    @Query('product') product: string = 'SANG',
  ) {
    if (!recipientBloodType) {
      throw new BadRequestException('blood_type est requis');
    }
    return this.donorsService.getCompatibilityForDonor(id, recipientBloodType as BloodType, product as BloodProduct);
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
