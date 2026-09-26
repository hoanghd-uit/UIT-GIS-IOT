import { IsNotEmpty, IsISO8601, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardIotTelemetryQueryDto {
  @ApiProperty({
    description: 'Query window start as ISO-8601 UTC string',
    example: '2026-09-23T12:00:00.000Z',
  })
  @IsNotEmpty()
  @IsISO8601()
  start: string;

  @ApiProperty({
    description: 'Query window stop as ISO-8601 UTC string',
    example: '2026-09-26T12:00:00.000Z',
  })
  @IsNotEmpty()
  @IsISO8601()
  stop: string;

  @ApiPropertyOptional({
    description: 'Maximum readings to return (1..1000). Defaults to 1000.',
    example: 1000,
    default: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
