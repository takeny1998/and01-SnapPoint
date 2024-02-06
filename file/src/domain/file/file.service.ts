import { Injectable } from '@nestjs/common';
import { CreateFileDto } from '@/domain/file/dtos/create-file.dto';
import { PrismaService } from '@/common/datasources/prisma.service';

@Injectable()
export class FileService {
  constructor(private readonly prisma: PrismaService) {}

  async createFile(dto: CreateFileDto) {
    return this.prisma.file.create({ data: dto });
  }

  async processFile(uuid: string) {
    return this.prisma.file.update({
      where: { uuid, isDeleted: false },
      data: { isProcessed: true },
    });
  }

  async deleteAttachFiles(sourceUuids: string[]) {
    const blocks = await this.prisma.file.findMany({
      where: { sourceUuid: { in: sourceUuids }, isDeleted: false },
    });

    await this.prisma.file.updateMany({
      where: { sourceUuid: { in: sourceUuids }, isDeleted: false },
      data: { isDeleted: true },
    });

    return blocks;
  }

  async deleteFiles(uuids: string[]) {
    await this.prisma.file.updateMany({
      where: { uuid: { in: uuids } },
      data: { isDeleted: true },
    });

    const blocks = await this.prisma.file.findMany({
      where: { uuid: { in: uuids }, isDeleted: true },
    });

    return blocks;
  }
}
