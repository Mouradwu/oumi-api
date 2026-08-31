import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  async create(@Body() body: any) {
    console.log('Received request body:', JSON.stringify(body, null, 2));

    // Construction manuelle du DTO
    const createRequestDto: CreateRequestDto = {
      userId: body.userId || body.user_id,
      blood_group: body.blood_group || body.bloodGroup,
      donation_type: body.donation_type || body.donationType,
      wilaya: body.wilaya,
      hospital: body.hospital,
      urgency: body.urgency || 'NORMAL',
      description: body.description,
      patient_name: body.patient_name || body.patientName,
      patient_age: body.patient_age || body.patientAge,
      quantity: body.quantity,
      contact_phone: body.contact_phone || body.contactPhone,
    };

    if (!createRequestDto.userId) {
      console.error('userId manquant dans le body reçu:', body);
      throw new BadRequestException({
        message: 'userId est obligatoire',
        received: body,
        constructed: createRequestDto,
      });
    }

    try {
      const result = await this.requestsService.create(createRequestDto);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.requestsService.findByUserId(userId);
    }
    return this.requestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(+id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    if (!status) throw new BadRequestException('status est obligatoire');
    return this.requestsService.updateStatus(+id, status);
  }
}