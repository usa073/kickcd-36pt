/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const fetch =
  typeof process !== "undefined" &&
  process !== null &&
  typeof require !== "undefined" &&
  require !== null
    ? require("node-fetch")
    : window.fetch;

const get_json = function (url) {
  const res = await(fetch(url));
  if (!res.ok) {
    throw new Error(await(res.text()));
  }
  return res.json();
};

exports.info_from_url = function (url) {
  if (!/^https?:\/\/www\.openrec\.tv\/live\//.test(url)) {
    throw new Error("URLが正しくありません");
  }
  const video_id = url.split("/").slice(-1)[0];
  return await(
    get_json("https://public.openrec.tv/external/api/v5/movies/" + video_id)
  );
};

exports.download_comments = function (info, show_progress) {
  const start_at = new Date(info.started_at);
  const end_at = new Date(info.ended_at);
  let t = start_at;
  const list = [];
  const ids = {};
  while (true) {
    var posted_at;
    var url =
      `https://public.openrec.tv/external/api/v5/movies/${info.id}/chats?` +
      `from_created_at=${t.toISOString()}&is_including_system_message=false`;
    var chats = await(get_json(url));
    var new_chat = false;
    for (var chat of Array.from(chats)) {
      if (ids[chat.id]) {
        continue;
      }
      ids[chat.id] = true;
      new_chat = true;
      posted_at = new Date(chat.posted_at);
      var vpos = (posted_at.getTime() - start_at.getTime()) / 10;
      if (vpos < 0) {
        continue;
      }
      var user_id = chat.user.id;
      list.push({ vpos, user_id, message: chat.message });
    }
    t = new Date(chats.slice(-1)[0].posted_at);
    var progress =
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

exports.randomize = function (list) {
  for (var chat of Array.from(list)) {
    if (chat.vpos % 100 === 0) {
      chat.vpos += Math.floor(Math.random() * 100);
    }
  }
  return list.sort((a, b) => a.vpos - b.vpos);
};
