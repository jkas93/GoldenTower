import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto, CreateMaintenanceLogDto, EquipmentSchema, MaintenanceLogSchema } from '@erp/shared';

@ApiTags('Equipment')
@ApiBearerAuth('Firebase')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  findAll() {
    return this.equipmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipmentService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    const dto = EquipmentSchema.parse(body);
    return this.equipmentService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const dto = EquipmentSchema.partial().parse(body);
    return this.equipmentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentService.delete(id);
  }

  @Post(':id/maintenance')
  addMaintenance(@Param('id') id: string, @Body() body: any) {
    const dto = MaintenanceLogSchema.parse({ ...body, equipmentId: id });
    return this.equipmentService.addMaintenanceLog(dto);
  }

  @Get(':id/maintenance')
  getMaintenanceLogs(@Param('id') id: string) {
    return this.equipmentService.getMaintenanceLogs(id);
  }

  @Patch(':id/assign')
  assignToProject(@Param('id') id: string, @Body() body: { projectId: string | null }) {
    return this.equipmentService.assignToProject(id, body.projectId);
  }
}
