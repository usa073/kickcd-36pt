import { build } from "./ass";
import { download_comments, info_from_url, randomize } from "./download";

const save = function (filename: string, s: string) {
  const blob = new Blob([s], { type: "text/plain" });
  const a = document.createElement("a");
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  return a.click();
};

const show_downloading = function () {
  const e = document.createElement("div");
  e.id = "orcd-downloading";
  e.innerText = "コメントをダウンロード中...";
  const s = e.style;
  s.position = "fixed";
  s.width = "100%";
  s.top = s.left = "0";
  s.textAlign = "center";
  s.padding = "16px";
  s.fontSize = "32px";
  s.fontWeight = "bold";
  s.zIndex = "99999999";
  s.color = "#333";
  s.backgroundColor = "#fff";
  s.boxShadow = "0 0 40px #000";
  return document.body.append(e);
};

const remove_downloading = function () {
  document.querySelector("#orcd-downloading")?.remove();
};

(async function () {
  try {
    show_downloading();
    const info = await info_from_url(window.location.href);
    const comments = await download_comments(info);
    randomize(comments);
    const ass = build(comments);
    save(`${info.title}.ass`, ass);
    return remove_downloading();
  } catch (e) {
    remove_downloading();
    if (e instanceof Error) {
      return alert(e.message);
    }
  }
})();
