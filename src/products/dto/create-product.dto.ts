import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(2, 40)
  sku!: string;

  @IsString()
  @Length(8, 20)
  barcode!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumStock!: number;

  @IsUUID()
  categoryId!: string;
}
