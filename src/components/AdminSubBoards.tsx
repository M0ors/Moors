"use client";

import { useFormState } from "react-dom";
import {
  createSubBoard,
  deleteSubBoard,
  updateSubBoard,
} from "@/app/actions/admin";

type Board = { id: string; slug: string; name: string };
type SubBoard = {
  id: string;
  board_id: string;
  slug: string;
  name: string;
  description: string | null;
  is_adult: boolean;
  sort_order: number;
  max_threads_per_user: number | null;
  op_only_replies: boolean;
  allow_anonymous: boolean;
};

type Props = {
  boards: Board[];
  subBoards: SubBoard[];
};

export function AdminSubBoards({ boards, subBoards }: Props) {
  const [createState, createAction] = useFormState(createSubBoard, undefined);

  return (
    <section>
      <h2 className="font-medium mb-3">Sub-boards</h2>

      <form action={createAction} className="border rounded p-4 mb-6 grid gap-3 max-w-2xl">
        <h3 className="text-sm font-medium">Create sub-board</h3>
        <label className="flex flex-col gap-1 text-sm">
          Board
          <select name="board_id" required className="border p-2">
            {boards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Slug
          <input name="slug" required className="border p-2" placeholder="coding" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="name" required className="border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Description
          <input name="description" className="border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sort order
          <input name="sort_order" type="number" defaultValue={0} className="border p-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Max threads per user (blank = unlimited)
          <input name="max_threads_per_user" type="number" min={1} className="border p-2" />
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" name="is_adult" /> Adult / NSFW
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" name="allow_anonymous" /> Allow anonymous posts
        </label>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" name="op_only_replies" /> OP-only replies
        </label>
        {createState?.error ? (
          <p className="text-red-600 text-sm">{createState.error}</p>
        ) : null}
        <button type="submit">Create</button>
      </form>

      <ul className="space-y-4">
        {subBoards.map((sub) => {
          const board = boards.find((b) => b.id === sub.board_id);
          return (
            <li key={sub.id} className="border rounded p-4">
              <form action={updateSubBoard} className="grid gap-2 max-w-2xl">
                <input type="hidden" name="id" value={sub.id} />
                <p className="text-sm text-neutral-600">
                  {board?.name ?? "Board"} / {sub.slug}
                </p>
                <input
                  name="name"
                  defaultValue={sub.name}
                  required
                  className="border p-2"
                />
                <input
                  name="description"
                  defaultValue={sub.description ?? ""}
                  className="border p-2"
                  placeholder="Description"
                />
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={sub.sort_order}
                  className="border p-2"
                />
                <input
                  name="max_threads_per_user"
                  type="number"
                  min={1}
                  defaultValue={sub.max_threads_per_user ?? ""}
                  className="border p-2"
                  placeholder="Max threads / user"
                />
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_adult"
                    defaultChecked={sub.is_adult}
                  />{" "}
                  Adult
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="allow_anonymous"
                    defaultChecked={sub.allow_anonymous}
                  />{" "}
                  Anonymous
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="op_only_replies"
                    defaultChecked={sub.op_only_replies}
                  />{" "}
                  OP-only replies
                </label>
                <div className="flex gap-2">
                  <button type="submit">Save</button>
                </div>
              </form>
              <form action={deleteSubBoard} className="mt-2">
                <input type="hidden" name="id" value={sub.id} />
                <button type="submit" className="!bg-white !text-red-700">
                  Remove
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
