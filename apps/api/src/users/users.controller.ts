import { Controller, Get, Patch, Delete, Body, Request, UseGuards, HttpCode } from '@nestjs/common';
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

  // Met le compte en pause (is_active = false) : masque le profil des
  // recherches/matching sans supprimer les donnees. Reversible en
  // renvoyant is_active: true.
  @Patch('me/active')
  @UseGuards(JwtAuthGuard)
  async setActive(@Request() req, @Body('is_active') isActive: boolean) {
    return this.usersService.setActive(req.user.id, isActive !== false);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteAccount(@Request() req) {
    await this.usersService.deleteAccount(req.user.id);
  }
}
