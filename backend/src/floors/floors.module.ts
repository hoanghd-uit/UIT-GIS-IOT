import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FloorEntity } from '../database/entities/floor.entity';
import { FloorsService } from './floors.service';

@Module({
  imports: [TypeOrmModule.forFeature([FloorEntity])],
  providers: [FloorsService],
  exports: [FloorsService],
})
export class FloorsModule {}

