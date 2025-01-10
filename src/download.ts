import type { Chat } from "./types";

const get_json = async function (url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const info_from_url = async function (url: string) {
  if (!/^https?:\/\/www\.openrec\.tv\/live\//.test(url)) {
    throw new Error("URLが正しくありません");
  }
  const video_id = url.split("/").slice(-1)[0];
  return await get_json(
    "https://public.openrec.tv/external/api/v5/movies/" + video_id
  );
};

export const download_comments = async function (
  info: { id: string; started_at: string; ended_at: string },
  show_progress?: (progress: number) => any
) {
  const start_at = new Date(info.started_at);
  const end_at = new Date(info.ended_at);
  let t = start_at;
  const list = [];
  const ids: Record<string, boolean> = {};
  while (true) {
    let posted_at;
    const url =
      `https://public.openrec.tv/external/api/v5/movies/${info.id}/chats?` +
      `from_created_at=${t.toISOString()}&is_including_system_message=false`;
    const chats: {
      id: string;
      posted_at: string;
      user: { id: string };
      message: string;
    }[] = await get_json(url);
    let new_chat = false;
    for (const chat of chats) {
      if (ids[chat.id]) {
        continue;
      }
      ids[chat.id] = true;
      new_chat = true;
      posted_at = new Date(chat.posted_at);
      const vpos = (posted_at.getTime() - start_at.getTime()) / 10;
      if (vpos < 0) {
        continue;
      }
      const user_id = chat.user.id;
      list.push({ vpos, user_id, message: chat.message });
    }
    t = new Date(chats.slice(-1)[0].posted_at);
    const progress =
      (t.getTime() - start_at.getTime()) /
      (end_at.getTime() - start_at.getTime());
    if (show_progress) {
      show_progress(progress);
    }
    if (!new_chat) {
      break;
    }
  }
  return list;
};

export const randomize = function (list: Chat[]) {
  for (const chat of list) {
    if (chat.vpos % 100 === 0) {
      chat.vpos += Math.floor(Math.random() * 100);
    }
  }
  return list.sort((a, b) => a.vpos - b.vpos);
};
