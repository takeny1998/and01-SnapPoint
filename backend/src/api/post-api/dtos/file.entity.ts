export class File {
  id: number;
  uuid: string;
  userUuid: string;
  url: string;
  mimeType: string;
  createdAt: Date;
  isDeleted: boolean;
  isProcessed: boolean;
  source: string | null;
  sourceUuid: string | null;
  thumbnailUuid: string | null;
}
