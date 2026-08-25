import { Patch, Body, Param, UseGuards, Get, Controller } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Session() session: UserSession) {
    return session.user;
  }

  @Get('admin/all')
  @Roles('PLATFORM_ADMIN')
  @UseGuards(RolesGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Patch('admin/:id/role')
  @Roles('PLATFORM_ADMIN')
  @UseGuards(RolesGuard)
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }
}