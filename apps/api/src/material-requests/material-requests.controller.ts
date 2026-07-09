import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { MaterialRequestsService } from './material-requests.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, CreateMaterialRequestDto } from '@erp/shared';

@ApiTags('Material Requests')
@ApiBearerAuth('Firebase')
@Controller('material-requests')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class MaterialRequestsController {
  constructor(private readonly requestsService: MaterialRequestsService) {}

  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.COORDINADOR)
  @ApiOperation({ summary: 'Crea una nueva solicitud de materiales' })
  async create(@Body() createDto: CreateMaterialRequestDto) {
    const id = await this.requestsService.create(createDto);
    return { id, message: 'Solicitud enviada' };
  }

  @Get()
  @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
  @ApiOperation({ summary: 'Lista todas las solicitudes de materiales' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO'],
    description: 'Filtrar por estado',
  })
  async findAll(@Query('status') status?: string) {
    return this.requestsService.findAll(status);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Solicitudes de materiales por proyecto' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.requestsService.findByProject(projectId);
  }

  @Patch(':id/status')
  @Roles(UserRole.GERENTE, UserRole.PMO, UserRole.COORDINADOR)
  @ApiOperation({
    summary: 'Actualiza el estado de una solicitud (aprobar/rechazar)',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    await this.requestsService.updateStatus(id, status, rejectionReason);
    return { success: true };
  }
}
