export type PublicationStatus = "draft" | "published" | "hidden";

export function buildPublicationUpdate(status: PublicationStatus) {
  return { publication_status: status } as const;
}
