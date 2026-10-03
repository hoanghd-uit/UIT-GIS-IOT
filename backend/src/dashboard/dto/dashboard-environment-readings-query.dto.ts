import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsISO8601, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardEnvironmentReadingsQueryDto {
  @ApiProperty({
    description: 'Inclusive query range start in ISO-8601 UTC format. Must be strictly before stop.',
    example: '2026-09-26T12:00:00.000Z',
  })
  @IsNotEmpty({ message: 'Query parameter start is required.' })
  @IsISO8601({}, { message: 'Query parameter start must be a valid ISO-8601 date string.' })
  start: string;

  @ApiProperty({
    description: 'Inclusive query range stop in ISO-8601 UTC format. Must be strictly after start.',
    example: '2026-09-27T12:00:00.000Z',
  })
  @IsNotEmpty({ message: 'Query parameter stop is required.' })
  @IsISO8601({}, { message: 'Query parameter stop must be a valid ISO-8601 date string.' })
  stop: string;

  @ApiPropertyOptional({
    description: 'Maximum number of readings to return (1..1000). Default is 1000.',
    example: 1000,
    default: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Query parameter limit must be an integer.' })
  @Min(1, { message: 'Query parameter limit must be at least 1.' })
  @Max(1000, { message: 'Query parameter limit cannot exceed 1000 for Dashboard queries.' })
  limit?: number;
}
