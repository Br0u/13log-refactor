import { db } from "../db";

export async function getCategoryById(id) {
  if (!id) return null;
  return db.category.findUnique({
    where: { id },
  });
}

export async function listCategories() {
  return db.category.findMany({
    orderBy: { name: "asc" },
  });
}
