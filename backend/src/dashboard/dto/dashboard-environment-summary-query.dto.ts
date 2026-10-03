import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsISO8601 } from 'class-validator';

export class DashboardEnvironmentSummaryQueryDto {
  @ApiProperty({
    description: 'Inclusive query range start in ISO-8601 UTC format. Must be strictly before stop. Max duration 24 hours.',
    example: '2026-09-26T12:00:00.000Z',
  })
  @IsNotEmpty({ message: 'Query parameter start is required.' })
  @IsISO8601({}, { message: 'Query parameter start must be a valid ISO-8601 date string.' })
  start: string;

  @ApiProperty({
    description: 'Inclusive query range stop in ISO-8601 UTC format. Must be strictly after start. Max duration 24 hours.',
    example: '2026-09-27T12:00:00.000Z',
  })
  @IsNotEmpty({ message: 'Query parameter stop is required.' })
  @IsISO8601({}, { message: 'Query parameter stop must be a valid ISO-8601 date string.' })
  stop: string;
}
