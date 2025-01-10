import type { Chat, Video } from "./types";

const get_json = async function (url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const info_from_url = async function (url: string) {
  if (!/^https?:\/\/kick\.com\/.*\/videos\//.test(url)) {
    throw new Error("URLが正しくありません");
  }
  const video_id = url.split("/").slice(-1)[0];
  return (await get_json("https://kick.com/api/v1/video/" + video_id)) as Video;
};

export const download_comments = async function (
  info: Video,
  show_progress?: (progress: number) => void
) {
  const start_at = new Date(info.livestream.start_time);
  const end_at = new Date(start_at.getTime() + info.livestream.duration);
  let t = start_at;
  const list = [];
  const ids: Record<string, boolean> = {};
  while (true) {
    let posted_at;
    const url =
      `https://kick.com/api/v2/channels/${info.livestream.channel_id}/messages?` +
      `start_time=${t.toISOString()}`;
    const chats: {
      content: string;
      created_at: string;
      id: string;
      user_id: number;
    }[] = (await get_json(url)).data.messages;
    let new_chat = false;
    for (const chat of chats) {
      if (ids[chat.id]) {
        continue;
      }
      ids[chat.id] = true;
      new_chat = true;
      posted_at = new Date(chat.created_at);
      const vpos = (posted_at.getTime() - start_at.getTime()) / 10;
      if (vpos < 0) {
        continue;
      }
      const user_id = chat.user_id.toString();
      list.push({ vpos, user_id, message: chat.content });
    }
    t = new Date(t.getTime() + 5000);
    const progress =
      (t.getTime() - start_at.getTime()) /
      (end_at.getTime() - start_at.getTime());
    if (show_progress) {
      show_progress(progress);
    }
    if (t > end_at) {
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
  return list.toSorted((a, b) => a.vpos - b.vpos);
};
