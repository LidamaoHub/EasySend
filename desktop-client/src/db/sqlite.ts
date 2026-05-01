export type DownloadRecord = {
  itemId: string;
  savedPath: string;
  downloadedAt: string;
};

export async function getDownloadedRecords(): Promise<DownloadRecord[]> {
  return [];
}

export async function saveDownloadedRecord(_record: DownloadRecord) {
  return;
}
