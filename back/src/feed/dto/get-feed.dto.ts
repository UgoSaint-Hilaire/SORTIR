import { IsOptional, IsInt, Min, Max, IsString, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetFeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  segments?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsString()
  genre?: string;
}