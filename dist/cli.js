#!/usr/bin/env node
const fs = require('fs');
const { program } = require('commander');
const { snapshot } = require('./index');

program
  .name('snap')
  .argument('[url]', '스냅샷을 생성할 URL')
  .option('--list <file>', 'URL 목록 파일')
  .option('--out <dir>', '출력 디렉터리')
  .option('--mhtml', 'MHTML 생성', true)
  .option('--no-mhtml', 'MHTML 생성 안함')
  .option('--png', 'PNG 생성', true)
  .option('--no-png', 'PNG 생성 안함')
  .option('--pdf', 'PDF 생성', true)
  .option('--no-pdf', 'PDF 생성 안함')
  .option('--viewport <size>', '뷰포트 크기', '1440x900')
  .option('--user-agent <ua>', 'User-Agent 문자열')
  .option('--lang <lang>', 'Accept-Language', 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7')
  .option('--timeout <ms>', '타임아웃(ms)', '120000')
  .option('--wait-after-load <ms>', '로드 후 대기(ms)', '0')
  .option('--scroll-step <px>', '스크롤 스텝(px)', '800')
  .option('--scroll-interval <ms>', '스크롤 간격(ms)', '200')
  .option('--proxy <url>', '프록시 주소')
  .option('--cookies <file>', '쿠키 JSON 파일')
  .option('--concurrency <n>', '동시 처리 개수', '1')
  .option('--pdf-format <size>', 'PDF 용지 크기', 'A4')
  .option('--pdf-margin <margin>', 'PDF 여백', '10mm')
  .option('--sanitize-file-names <bool>', '파일명 정규화', 'true')
  .parse(process.argv);

const opts = program.opts();
let urls = [];
if (opts.list) {
  const content = fs.readFileSync(opts.list, 'utf8');
  urls = content.split(/\r?\n/).filter(Boolean);
} else if (program.args[0]) {
  urls = [program.args[0]];
} else {
  program.help();
}

snapshot(urls, opts).then(code => {
  process.exit(code);
});
