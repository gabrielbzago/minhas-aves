export async function getFreePrintBirdIds(db: any, userId: string, limit: number): Promise<string[]> {
  const { data, error } = await db
    .from("birds")
    .select("id")
    .eq("user_id", userId)
    .or("is_genealogy_reference.eq.false,is_genealogy_reference.is.null")
    .order("created_at", { ascending: false })
    .limit(Math.max(0, limit));

  if (error) throw error;
  return (data || []).map((bird: { id: string }) => bird.id);
}
