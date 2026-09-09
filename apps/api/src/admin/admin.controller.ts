import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

// TOUTES les routes de ce controleur exigent le role admin, verifie cote
// serveur via AdminGuard (jamais une simple dissimulation de bouton cote
// frontend - voir auth/guards/admin.guard.ts).
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers(@Query('search') search?: string) {
    return this.adminService.listUsers(search);
  }

  @Patch('users/:id/active')
  setUserActive(@Param('id') id: string, @Body('is_active') isActive: boolean) {
    return this.adminService.setUserActive(id, isActive !== false);
  }

  @Patch('users/:id/verified')
  setUserVerified(@Param('id') id: string, @Body('field') field: 'email_verified' | 'phone_verified', @Body('value') value: boolean) {
    return this.adminService.setUserVerified(id, field, value === true);
  }

  @Patch('users/:id/roles')
  setUserRoles(@Param('id') id: string, @Body('roles') roles: string[]) {
    return this.adminService.setUserRoles(id, roles || []);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('donors')
  listDonors() {
    return this.adminService.listDonors();
  }

  @Get('requests')
  listRequests() {
    return this.adminService.listRequests();
  }

  @Delete('requests/:id')
  deleteRequest(@Param('id') id: string) {
    return this.adminService.deleteRequest(id);
  }
}
