import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateMovementDto } from './dto/create-movement.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Post('movements')
  createMovement(@Body() dto: CreateMovementDto) {
    return this.inventory.createMovement(dto);
  }

  @Get('movements')
  findMovements(@Query() query: QueryMovementsDto) {
    return this.inventory.findMovements(query);
  }

  @Get('low-stock')
  lowStock() {
    return this.inventory.lowStock();
  }
}
