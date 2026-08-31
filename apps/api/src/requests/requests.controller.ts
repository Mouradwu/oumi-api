import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  async create(@Body() createRequestDto: CreateRequestDto) {
    if (!createRequestDto.userId) {
      throw new BadRequestException('userId est obligatoire');
    }
    try {
      return await this.requestsService.create(createRequestDto);
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