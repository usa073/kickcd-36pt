import retry from "async-retry";
import type { Chat, Video } from "./types";

// ─── emoteタグそのもの → 置換するキリル文字 の対応表 ───
const emoteToCyrillic: Record<string, string> = {
  "[emote:3175408:oechanOPENREC]": "\u0410",  // А
  "[emote:55886:kickSadge]":        "\u0411",  // Б
};

/**
 * message 中の [emote:…] を
 * emoteToCyrillic にあればその文字に、
 * なければ削除する
 */
function transformEmote(message: string): string {
  return message.replace(
    /\[emote:[^\]]+\]/g,
    (match) => emoteToCyrillic[match] || ""
  );
}

const excludeEmote = function (message: string) {
  return transformEmote(message);
};

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
  const list: Chat[] = [];
  const ids: Record<string, boolean> = {};

  while (true) {
    let posted_at: Date | undefined;
    const url =
      `https://kick.com/api/v2/channels/${info.livestream.channel_id}/messages?` +
      `start_time=${t.toISOString()}`;
    const res = await retry(async () => await get_json(url), {
      retries: 100,
    });
    const chats:
      | { content: string; created_at: string; id: string; user_id: number }[]
      | undefined = res?.data?.messages;

    if (chats) {
      for (const chat of chats) {
        if (ids[chat.id]) continue;
        ids[chat.id] = true;
        posted_at = new Date(chat.created_at);
        const vpos = (posted_at.getTime() - start_at.getTime()) / 10;
        if (vpos < 0) continue;

        const user_id = chat.user_id.toString();
        const message = excludeEmote(chat.content);
        if (message) {
          list.push({ vpos, posted_at, user_id, message });
        }
      }
    }

    t = new Date(t.getTime() + 5000);
    const progress =
      (t.getTime() - start_at.getTime()) /
      (end_at.getTime() - start_at.getTime());
    if (show_progress) show_progress(progress);
    if (t > end_at) break;
  }

  return list;
};

async function limit<T>(tasks: (() => Promise<T>)[], concurrency: number) {
  const results: T[] = [];
  const tasksIterator = tasks.entries();

  await Promise.all(
    Array.from({ len


