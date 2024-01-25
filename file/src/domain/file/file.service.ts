import { Injectable } from '@nestjs/common';
import { CreateFileDto } from '@/domain/file/dtos/create-file.dto';
import { PrismaService } from '@/common/datasources/prisma.service';

@Injectable()
export class FileService {
  constructor(private readonly prisma: PrismaService) {}

  async createFile(dto: CreateFileDto) {
    return this.prisma.file.create({ data: dto });
  }
}
