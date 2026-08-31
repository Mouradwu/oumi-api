import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('find/:requestId')
  async find(@Param('requestId') requestId: string) {
    if (!requestId) {
      throw new BadRequestException('requestId est obligatoire');
    }
    const id = parseInt(requestId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('requestId doit être un nombre valide');
    }
    return this.matchingService.findMatches(id);
  }
}