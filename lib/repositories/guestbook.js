import { z } from "zod";
import { db } from "../db";

const guestbookSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  content: z.string().trim().min(1).max(1000),
});

export async function createGuestbookEntry({ nickname, content }) {
  const parsed = guestbookSchema.parse({ nickname, content });

  return db.guestbookEntry.create({
    data: {
      nickname: parsed.nickname,
      content: parsed.content,
      status: "PENDING",
    },
  });
}

export async function getApprovedGuestbookEntries() {
  return db.guestbookEntry.findMany({
    where: {
      status: "APPROVED",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function approveGuestbookEntry(entryId) {
  return db.guestbookEntry.update({
    where: { id: entryId },
    data: { status: "APPROVED" },
  });
}

export async function removeGuestbookEntry(entryId) {
  return db.guestbookEntry.delete({
    where: { id: entryId },
  });
}
