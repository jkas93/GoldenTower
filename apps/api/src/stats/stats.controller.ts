import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@erp/shared';

@ApiTags('Stats')
@ApiBearerAuth('Firebase')
@Controller('stats')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
  @ApiOperation({ summary: 'Estadísticas agregadas para dashboard ejecutivo' })
  async getDashboardStats() {
    return this.statsService.getDashboardStats();
  }
}
