import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class Coordinate3DDto {
  @ApiProperty({ example: 1.5 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 0.0 })
  @IsNumber()
  y: number;

  @ApiProperty({ example: -2.0 })
  @IsNumber()
  z: number;
}

export class UpdateDisplayPositionDto {
  @ApiProperty({ example: 'E' })
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty({ example: '4' })
  @IsString()
  @IsNotEmpty()
  floorId: string;

  @ApiProperty({ example: 'E/4/floor-local' })
  @IsString()
  @IsNotEmpty()
  frameId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  frameVersion: number;

  @ApiProperty({ type: Coordinate3DDto })
  @ValidateNested()
  @Type(() => Coordinate3DDto)
  position: Coordinate3DDto;
}

