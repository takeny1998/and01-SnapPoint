export class ModifyAttachFileDto {
  readonly sourceUuids: string[];

  readonly files: { uuid: string; sourceUuid: string }[];
}
