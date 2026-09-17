import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FloorEntity } from '../database/entities/floor.entity';

@Injectable()
export class FloorsService {
  constructor(
    @InjectRepository(FloorEntity)
    private readonly floorRepo: Repository<FloorEntity>,
  ) {}

  async findFloor(buildingId: string, floorId: string): Promise<FloorEntity> {
    const floor = await this.floorRepo.findOne({
      where: { buildingId, floorId },
    });

    if (!floor) {
      throw new NotFoundException(`Floor ${buildingId}/${floorId} not found`);
    }

    return floor;
  }

  async findAllByBuilding(buildingId: string): Promise<FloorEntity[]> {
    return this.floorRepo.find({
      where: { buildingId },
      order: { floorId: 'ASC' },
    });
  }
}

