import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardIotCatalogueQueryDto {
  @ApiPropertyOptional({
    description: 'Application floor ID (e.g. 4, 6). When omitted, returns the unfiltered full active device catalogue.',
    example: '4',
  })
  @IsOptional()
  @IsString()
  floorId?: string;
}
