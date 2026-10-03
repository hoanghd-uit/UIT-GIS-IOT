import {
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'isValidRoomId', async: false })
export class IsValidRoomIdConstraint implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments) {
    if (value === undefined) return true;
    if (typeof value !== 'string') return false;
    return value.trim().length > 0;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'roomId must be a non-empty string when provided and cannot be duplicated or blank.';
  }
}

export class DashboardIotCatalogueQueryDto {
  @ApiPropertyOptional({
    description: 'Application floor ID (e.g. 4, 6). When omitted, returns the unfiltered full active device catalogue.',
    example: '4',
  })
  @IsOptional()
  @IsString()
  floorId?: string;

  @ApiPropertyOptional({
    description: 'Optional exact room ID filter (e.g. E4.08). Leading and trailing spaces are trimmed, exact case preserved. Blank or duplicate roomId is rejected with 400.',
    example: 'E4.08',
  })
  @IsOptional()
  @Validate(IsValidRoomIdConstraint)
  roomId?: string;
}
