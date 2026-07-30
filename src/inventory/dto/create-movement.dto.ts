import { MovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, IsUUID, Length, Min } from 'class-validator';

const ManualMovementType = {
  ENTRY: MovementType.ENTRY,
  EXIT: MovementType.EXIT,
  ADJUSTMENT: MovementType.ADJUSTMENT,
} as const;

export class CreateMovementDto {
  @IsUUID()
  productId!: string;

  @IsEnum(ManualMovementType)
  type!: MovementType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @IsString()
  @Length(3, 255)
  reason!: string;
}
