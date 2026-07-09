import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  UsePipes,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { RRHHService } from './rrhh.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  UserRole,
  EmployeeSchema,
  CreateEmployeeDto,
  CreateAttendanceDto,
  AttendanceSchema,
  CreateIncidentDto,
  IncidentSchema,
} from '@erp/shared';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('RRHH')
@ApiBearerAuth('Firebase')
@Controller('rrhh')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class RRHHController {
  constructor(private readonly rrhhService: RRHHService) {}

  @Get('check-existence')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  @ApiOperation({
    summary: 'Verifica si un empleado ya existe por DNI o Email',
    description: 'Endpoint para validación de unicidad al crear empleados. Retorna información del duplicado si existe.',
  })
  @ApiQuery({ name: 'dni', required: false, description: 'DNI de 8 dígitos' })
  @ApiQuery({ name: 'email', required: false, description: 'Email del empleado' })
  @ApiResponse({ status: 200, description: 'Resultado de la verificación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async checkExistence(
    @Query('dni') dni?: string,
    @Query('email') email?: string,
  ) {
    return this.rrhhService.checkExistence(dni, email);
  }

  @Post('employees')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  @UsePipes(new ZodValidationPipe(EmployeeSchema))
  @ApiOperation({
    summary: 'Crea un nuevo empleado',
    description: 'Crea el empleado en Firebase Auth y Firestore. Envía email de bienvenida.',
  })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o duplicado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async create(@Body() data: CreateEmployeeDto) {
    const id = await this.rrhhService.createEmployee(data);
    return { id, message: 'Employee registered successfully' };
  }

  // --- Self-Activation Endpoint ---
  @Post('activate')
  @ApiOperation({
    summary: 'Activa cuenta del usuario autenticado',
    description: 'El usuario se activa a sí mismo al hacer login por primera vez',
  })
  @ApiResponse({ status: 200, description: 'Cuenta activada' })
  async activate(@Req() req: any) {
    // El usuario se activa a sí mismo al hacer login por primera vez
    const uid = req.user.uid;
    await this.rrhhService.activateEmployee(uid);
    return { message: 'Cuenta activada y confirmada' };
  }

  @Get('employees')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  async findAll(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const pageSize = limit ? parseInt(limit, 10) : 50;
    return this.rrhhService.findAllEmployees(pageSize, cursor);
  }

  @Patch('employees/:id')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  async update(
    @Param('id') id: string,
    @Body() data: Partial<CreateEmployeeDto>,
  ) {
    await this.rrhhService.updateEmployee(id, data);
    return { message: 'Employee updated' };
  }

  @Get('employees/:id')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  async findOne(@Param('id') id: string) {
    return this.rrhhService.findOneEmployee(id);
  }

  @Delete('employees/:id')
  @Roles(UserRole.GERENTE)
  async delete(@Param('id') id: string) {
    await this.rrhhService.deleteEmployee(id);
    return { message: 'Employee deleted successfully' };
  }

  // --- Attendance Endpoints ---
  @Post('attendance')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  @UsePipes(new ZodValidationPipe(AttendanceSchema))
  async recordAttendance(@Body() data: CreateAttendanceDto) {
    const id = await this.rrhhService.recordAttendance(data);
    return { id, message: 'Attendance recorded' };
  }

  @Get('attendance/:employeeId')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  async getAttendance(@Param('employeeId') employeeId: string) {
    return this.rrhhService.getEmployeeAttendance(employeeId);
  }

  // --- Incident Endpoints ---
  @Post('incidents')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  @UsePipes(new ZodValidationPipe(IncidentSchema))
  async createIncident(@Body() data: CreateIncidentDto) {
    const id = await this.rrhhService.createIncident(data);
    return { id, message: 'Incident created' };
  }

  @Get('incidents')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  async findAllIncidents() {
    return this.rrhhService.findAllIncidents();
  }

  @Patch('incidents/:id/status')
  @Roles(UserRole.GERENTE, UserRole.RRHH)
  async updateIncidentStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    await this.rrhhService.updateIncidentStatus(id, status);
    return { message: 'Incident status updated' };
  }
}
