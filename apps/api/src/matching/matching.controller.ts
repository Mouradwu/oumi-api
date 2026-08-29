import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('find/:requestId')
  @UseGuards(JwtAuthGuard)
  findMatches(
    @Param('requestId') requestId: string, 
    @Query('radius') radius: string
  ) {
    const maxDistance = radius ? parseInt(radius, 10) : 50;
    return this.matchingService.findMatches(requestId, maxDistance);
  }
}