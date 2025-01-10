/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const path = require('path');
const fs = require('fs');
const { create } = require('xmlbuilder2');
const xml2js = require('xml2js');
const { info_from_url, download_comments, randomize } = require('./download');
const ass = require('./ass');

const write_tty = function(s) { if (process.stderr.isTTY) { return process.stderr.write(s); } };

const show_progress = function(progress) {
  const w = process.stderr.columns - 7;
  let bar = '░'.repeat(Math.round(w * progress));
  bar += '─'.repeat(w - bar.length);
  const percent = Math.round(99 * progress);
  return write_tty(`\r[${bar}] ${percent}%`);
};

const parse_xml = function(content) {
  let xml;
  try {
    xml = await(xml2js.parseStringPromise(content));
  } catch (e) {
    return null;
  }
  const list = xml.packet != null ? xml.packet.chat : undefined;
  if (!list) { return null; }

  return (() => {
    const result = [];
    for (var chat of Array.from(list)) {
      var vpos = Number(chat.$.vpos);
      var {
        user_id
      } = chat.$;
      var message = chat._ || '';
      result.push({ vpos, user_id, message });
    }
    return result;
  })();
};

const load_file = function(filename) {
  if (filename === '-') { filename = process.stdin.fd; }
  const content = fs.readFileSync(filename, 'utf8');

  try { return JSON.parse(content); } catch (error) {}

  const list = await(parse_xml(content));
  if (list) { return list; }

  throw new Error('入力ファイルのフォーマットが未対応です');
};

const add_delay = (list, delay) => list
  .map(item => ({
  ...item,
  vpos: item.vpos - (delay * 100)
}))
  .filter(item => item.vpos >= 0);

const build_xml = function(list) {
  const root = create({version: '1.0'}).ele('packet');
  for (var item of Array.from(list)) {
    root.ele('chat', {vpos: item.vpos, user_id: item.user_id}).txt(item.message);
  }
  return root.end({prettyPrint: true});
};

const orcd = function(args) {
  let list, title;
  if (/^https?:\/\//.test(args.url)) {
    const info = await(info_from_url(args.url));
    ({
      title
    } = info);
    console.warn(`Loading comments for '${info.title}'.`);
    list = await(download_comments(info, show_progress));
  } else {
    list = await(load_file(args.file));
    title = path.basename(args.file);
    if (Array.from(title).includes('.')) {
      title = title.split('.').slice(0, -1).join('.');
    }
  }

  if (!args.norandom) { randomize(list); }
  list = add_delay(list, args.delay);

  var filename =
    args.output === 'auto' ?
      (filename = `${title}.${args.format}`)
    :
      args.output;

  if (filename === args.file) {
    throw new Error('出力ファイル名が入力ファイルと同じです');
  }

  const output =
    args.format === 'xml' ?
      build_xml(list)
    : args.format === 'ass' ?
      ass.build(list, {
        font_name: args.fontname,
        font_size: args.fontsize,
        margin: args.margin,
        outline: args.outline,
        displayed_time: args.time
      }
      )
    :
      JSON.stringify(list);

  write_tty('\r');
  process.stderr.write(`Saving to '${filename}': `);
  write_tty('\x1b[K');

  if (filename === '-') {
    process.stdout.write(output);
  } else {
    fs.writeFileSync(filename, output);
  }

  return process.stderr.write('done.\n');
};

module.exports = {
  randomize,
  build_xml,
  orcd
};
