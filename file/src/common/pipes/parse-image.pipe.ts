import { ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';

export const parseImagePipe = new ParseFilePipeBuilder()
  .addMaxSizeValidator({
    maxSize: 1024 * 1024 * 2,
  })
  .addFileTypeValidator({ fileType: 'image/webp' })
  .build({
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  });
