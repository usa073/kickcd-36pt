/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
import { info_from_url, download_comments, randomize } from './download';
import { build } from './ass';

const save = function(filename, s) {
  const blob = new Blob([s], {type: 'text/plain'});
  const a = document.createElement('a');
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  return a.click();
};

const show_downloading = function() {
  const e = document.createElement('div');
  e.id = 'orcd-downloading';
  e.innerText = 'コメントをダウンロード中...';
  const s = e.style;
  s.position = 'fixed';
  s.width = '100%';
  s.top = (s.left = 0);
  s.textAlign = 'center';
  s.padding = '16px';
  s.fontSize = '32px';
  s.fontWeight = 'bold';
  s.zIndex = 99999999;
  s.color = '#333';
  s.backgroundColor = '#fff';
  s.boxShadow = '0 0 40px #000';
  return document.body.append(e);
};

const remove_downloading = () => __guard__(document.querySelector('#orcd-downloading'), x => x.remove());

(function() {
  try {
    show_downloading();
    const info = await(info_from_url(window.location.href));
    const comments = await(download_comments(info));
    randomize(comments);
    const ass = build(comments);
    save(`${info.title}.ass`, ass);
    return remove_downloading();
  } catch (e) {
    remove_downloading();
    return alert(e.message);
  }
})();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}