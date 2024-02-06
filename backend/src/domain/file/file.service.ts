import { Inject, Injectable } from '@nestjs/common';
import { FindAttachFileDto } from './dtos/find-attach-files.dto';
import { AttachFileDto } from './dtos/attach-file.dto';
import { PRISMA_SERVICE, PrismaService } from '@/common/databases/prisma.service';

@Injectable()
export class FileService {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService) {}

  async findFilesByIds(uuids: string[]) {
    return this.prisma.file.findMany({
      where: { uuid: { in: uuids }, isDeleted: false },
    });
  }

  async findAttachFiles(dto: FindAttachFileDto) {
    const { source, sourceUuids } = dto;
    return this.prisma.file.findMany({
      where: { source, sourceUuid: { in: sourceUuids }, isDeleted: false },
    });
  }

  async attachFiles(dtos: AttachFileDto[]) {
    const attachPromises = dtos.map(({ uuid, source, sourceUuid }) =>
      this.prisma.file.update({
        where: { uuid },
        data: { source, sourceUuid },
      }),
    );

    return Promise.all(attachPromises);
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
