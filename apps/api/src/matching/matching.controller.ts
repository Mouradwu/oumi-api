import { Controller, Get, Param, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('find/:requestId')
  @UseGuards(JwtAuthGuard)
  async find(@Param('requestId') requestId: string, @Request() req) {
    if (!requestId) {
      throw new BadRequestException('requestId est obligatoire');
    }
    return this.matchingService.findMatches(requestId, req.user.id);
  }
}
