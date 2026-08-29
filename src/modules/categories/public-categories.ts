export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type CategoryQueryResult = {
  data: PublicCategory[] | null;
  error: { message: string } | null;
};

export async function resolvePublicCategories(
  query: () => Promise<CategoryQueryResult>,
): Promise<PublicCategory[]> {
  const { data, error } = await query();

  if (error) {
    throw new Error(`Unable to load public categories: ${error.message}`);
  }

  return data ?? [];
}
