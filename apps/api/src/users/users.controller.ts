import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@erp/shared';
import { Roles } from '../auth/roles.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

@ApiTags('Auth')
@ApiBearerAuth('Firebase')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  async register(
    @Body() body: { uid: string; email: string; name: string; role?: UserRole },
  ) {
    return this.usersService.register(
      body.uid,
      body.email,
      body.name,
      body.role,
    );
  }

  @Get()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('by-role/:role')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
  async listByRole(@Param('role') role: string) {
    return this.usersService.listByRole(role);
  }

  @Post('set-role')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE)
  async setRole(@Body() body: { uid: string; role: UserRole }) {
    return this.usersService.setRole(body.uid, body.role);
  }

  @Post('invite')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  async invite(@Body() body: { email: string; name: string; role: UserRole }) {
    return this.usersService.invite(body.email, body.name, body.role);
  }

  @Delete('invite/:uid')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  async deleteInvite(@Param('uid') uid: string) {
    return this.usersService.deleteInvite(uid);
  }

  @Post('acknowledge-login')
  @UseGuards(FirebaseAuthGuard)
  async acknowledgeLogin(@Body() body: { uid: string }) {
    return this.usersService.acknowledgeLogin(body.uid);
  }
}
