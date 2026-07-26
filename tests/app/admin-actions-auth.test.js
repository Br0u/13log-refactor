import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

const {
  authError,
  requireAdminSessionMock,
  formDataGetMock,
  repositoryWriteMocks,
  prismaWriteMocks,
} = vi.hoisted(() => {
  const repositoryWrites = {
    createPost: vi.fn(),
    updatePost: vi.fn(),
    createMicroPost: vi.fn(),
    updateMicroPost: vi.fn(),
    createPhoto: vi.fn(),
    updatePhoto: vi.fn(),
    approveComment: vi.fn(),
    removeComment: vi.fn(),
    approveGuestbookEntry: vi.fn(),
    removeGuestbookEntry: vi.fn(),
  };
  const prismaWrites = {
    categoryUpsert: vi.fn(),
    categoryDelete: vi.fn(),
    photoCategoryUpsert: vi.fn(),
    photoDelete: vi.fn(),
    tagUpsert: vi.fn(),
    tagDelete: vi.fn(),
    postDelete: vi.fn(),
    postCount: vi.fn(),
    microPostDelete: vi.fn(),
  };

  return {
    authError: new Error("ADMIN_SESSION_REQUIRED"),
    requireAdminSessionMock: vi.fn(),
    formDataGetMock: vi.fn(),
    repositoryWriteMocks: repositoryWrites,
    prismaWriteMocks: prismaWrites,
  };
});

vi.mock("../../lib/admin-session", () => ({
  requireAdminSession: requireAdminSessionMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("../../lib/repositories/posts", () => ({
  createPost: repositoryWriteMocks.createPost,
  updatePost: repositoryWriteMocks.updatePost,
}));

vi.mock("../../lib/repositories/micro-posts", () => ({
  createMicroPost: repositoryWriteMocks.createMicroPost,
  updateMicroPost: repositoryWriteMocks.updateMicroPost,
}));

vi.mock("../../lib/repositories/photos", () => ({
  createPhoto: repositoryWriteMocks.createPhoto,
  updatePhoto: repositoryWriteMocks.updatePhoto,
}));

vi.mock("../../lib/repositories/comments", () => ({
  approveComment: repositoryWriteMocks.approveComment,
  removeComment: repositoryWriteMocks.removeComment,
}));

vi.mock("../../lib/repositories/guestbook", () => ({
  approveGuestbookEntry: repositoryWriteMocks.approveGuestbookEntry,
  removeGuestbookEntry: repositoryWriteMocks.removeGuestbookEntry,
}));

vi.mock("../../lib/db", () => ({
  db: {
    category: {
      upsert: prismaWriteMocks.categoryUpsert,
      delete: prismaWriteMocks.categoryDelete,
    },
    photoCategory: {
      upsert: prismaWriteMocks.photoCategoryUpsert,
    },
    photo: {
      delete: prismaWriteMocks.photoDelete,
    },
    tag: {
      upsert: prismaWriteMocks.tagUpsert,
      delete: prismaWriteMocks.tagDelete,
    },
    post: {
      delete: prismaWriteMocks.postDelete,
      count: prismaWriteMocks.postCount,
    },
    microPost: {
      delete: prismaWriteMocks.microPostDelete,
    },
  },
}));

import * as adminActions from "../../app/admin/actions";

const EXPECTED_MUTATION_ACTIONS = [
  "approveCommentAction",
  "approveGuestbookEntryAction",
  "createCategoryAction",
  "createMicroPostAction",
  "createPhotoAction",
  "createPhotoCategoryAction",
  "createPostAction",
  "createTagAction",
  "deleteCategoryAction",
  "deleteCommentAction",
  "deleteGuestbookEntryAction",
  "deleteMicroPostAction",
  "deletePhotoAction",
  "deletePostAction",
  "deleteTagAction",
  "updateMicroPostAction",
  "updatePhotoAction",
  "updatePostAction",
];

const DUMMY_FORM_DATA = { get: formDataGetMock };

const ACTION_ARGUMENTS = {
  approveCommentAction: ["comment-1"],
  approveGuestbookEntryAction: ["guestbook-1"],
  createCategoryAction: [DUMMY_FORM_DATA],
  createMicroPostAction: [DUMMY_FORM_DATA],
  createPhotoAction: [{}, DUMMY_FORM_DATA],
  createPhotoCategoryAction: [DUMMY_FORM_DATA],
  createPostAction: [{}, DUMMY_FORM_DATA],
  createTagAction: [DUMMY_FORM_DATA],
  deleteCategoryAction: ["category-1"],
  deleteCommentAction: ["comment-1"],
  deleteGuestbookEntryAction: ["guestbook-1"],
  deleteMicroPostAction: ["micro-post-1"],
  deletePhotoAction: ["photo-1", "album-1"],
  deletePostAction: ["post-1"],
  deleteTagAction: ["tag-1"],
  updateMicroPostAction: ["micro-post-1", DUMMY_FORM_DATA],
  updatePhotoAction: ["photo-1", "album-1", DUMMY_FORM_DATA],
  updatePostAction: ["post-1", DUMMY_FORM_DATA],
};

function listAdminSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listAdminSourceFiles(entryPath);
    }
    return /\.[jt]sx?$/.test(entry.name) ? [entryPath] : [];
  });
}

describe("admin action authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminSessionMock.mockRejectedValue(authError);
  });

  it("keeps the exported mutation set and authentication matrix in sync", () => {
    const exportedMutationNames = Object.keys(adminActions).sort();

    expect(exportedMutationNames).toEqual(EXPECTED_MUTATION_ACTIONS);
    expect(Object.keys(ACTION_ARGUMENTS).sort()).toEqual(exportedMutationNames);
  });

  it("rejects every exported mutation before any repository or Prisma write", async () => {
    for (const [name, action] of Object.entries(adminActions)) {
      await expect(action(...ACTION_ARGUMENTS[name])).rejects.toBe(authError);
    }

    expect(requireAdminSessionMock).toHaveBeenCalledTimes(EXPECTED_MUTATION_ACTIONS.length);
    expect(formDataGetMock).not.toHaveBeenCalled();

    for (const writeMock of [
      ...Object.values(repositoryWriteMocks),
      ...Object.values(prismaWriteMocks),
    ]) {
      expect(writeMock).not.toHaveBeenCalled();
    }
  });

  it("guards every inline admin Server Action as its first executable statement", () => {
    const inlineActions = [];

    for (const sourcePath of listAdminSourceFiles(path.join(process.cwd(), "app/admin"))) {
      const lines = fs.readFileSync(sourcePath, "utf8").split("\n");

      lines.forEach((line, index) => {
        if (!/^\s+["']use server["'];\s*$/.test(line)) {
          return;
        }

        const firstExecutableLine = lines.slice(index + 1).find((candidate) => candidate.trim());
        inlineActions.push({
          sourcePath: path.relative(process.cwd(), sourcePath),
          line: index + 1,
          statement: firstExecutableLine?.trim(),
        });
      });
    }

    expect(inlineActions.length).toBeGreaterThan(0);
    expect(inlineActions).toEqual(
      inlineActions.map((inlineAction) => ({
        ...inlineAction,
        statement: "await requireAdminSession();",
      }))
    );
  });
});
