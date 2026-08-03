import { IsBoolean, IsString, Length, MaxLength, ValidateIf } from 'class-validator';

export class ReplaceCategoryDto {
  @IsString()
  @Length(2, 80)
  name!: string;

  @ValidateIf((_object: ReplaceCategoryDto, value: unknown) => value !== null)
  @IsString()
  @MaxLength(255)
  description!: string | null;

  @IsBoolean()
  active!: boolean;
}
