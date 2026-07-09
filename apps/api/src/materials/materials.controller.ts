import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, CreateMaterialDto } from '@erp/shared';

@ApiTags('Materials')
@ApiBearerAuth('Firebase')
@Controller('materials')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @Roles(UserRole.GERENTE, UserRole.LOGISTICO)
  @ApiOperation({ summary: 'Crea un nuevo material en el catálogo' })
  async create(@Body() createMaterialDto: CreateMaterialDto) {
    const id = await this.materialsService.create(createMaterialDto);
    return { id, message: 'Material registrado' };
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos los materiales del catálogo' })
  async findAll() {
    return this.materialsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Post(':id/stock/add')
  @Roles(UserRole.GERENTE, UserRole.LOGISTICO)
  async addStock(@Param('id') id: string, @Body('quantity') quantity: number) {
    await this.materialsService.updateStock(id, Number(quantity));
    return { message: 'Stock actualizado correctamente' };
  }

  @Post(':id/stock/remove')
  @Roles(UserRole.GERENTE, UserRole.LOGISTICO, UserRole.COORDINADOR)
  async removeStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    await this.materialsService.updateStock(id, -Math.abs(Number(quantity)));
    return { message: 'Stock descontado correctamente' };
  }
}
