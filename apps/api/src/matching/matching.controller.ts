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
    return this.matchingService.findMatches(requestId);
  }
}
