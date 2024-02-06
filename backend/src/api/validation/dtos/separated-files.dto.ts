import { DecomposedFileDto } from '@/api/transformation/dtos/decomposed-file.dto';

export class SeparatedFilesDto {
  attachFiles: DecomposedFileDto[];

  deleteFileUuids: string[];
}
