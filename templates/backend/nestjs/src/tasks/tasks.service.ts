import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  create(dto: CreateTaskDto, ownerId: number): Promise<Task> {
    const task = this.tasksRepository.create({ ...dto, ownerId });
    return this.tasksRepository.save(task);
  }

  findAllByOwner(ownerId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, ownerId: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, ownerId },
    });
    if (!task) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, ownerId: number): Promise<Task> {
    const task = await this.findOne(id, ownerId);
    Object.assign(task, dto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string, ownerId: number): Promise<void> {
    const task = await this.findOne(id, ownerId);
    await this.tasksRepository.remove(task);
  }
}
