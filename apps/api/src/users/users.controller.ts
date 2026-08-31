import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me/roles')
  @UseGuards(JwtAuthGuard)
  async updateRoles(@Request() req, @Body('roles') roles: string[]) {
    return this.usersService.updateRoles(req.user.id, roles);
  }
}
