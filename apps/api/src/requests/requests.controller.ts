import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  async create(@Body() body: any) {
    const dto: CreateRequestDto = {
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
    if (!dto.userId) throw new BadRequestException('userId est obligatoire');
    return this.requestsService.create(dto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    return userId ? this.requestsService.findByUserId(userId) : this.requestsService.findAll();
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