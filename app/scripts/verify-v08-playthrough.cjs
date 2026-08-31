const fs = require('fs');
const assert = require('assert');
const ts = require('typescript');

for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = function transpile(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
      fileName: filename,
    });
    module._compile(output.outputText, filename);
  };
}
require.extensions['.css'] = () => {};

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Node = dom.window.Node;
global.IS_REACT_ACT_ENVIRONMENT = true;

const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { GameProvider } = require('../src/app/GameProvider.tsx');
const { GameShell } = require('../src/features/scenes/GameShell.tsx');
const { createInitialState } = require('../src/game/initialState.ts');

class MemoryStorage {
  constructor() { this.data = new Map(); }
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key) { return this.data.get(key) ?? null; }
  key(index) { return [...this.data.keys()][index] ?? null; }
  removeItem(key) { this.data.delete(key); }
  setItem(key, value) { this.data.set(key, String(value)); }
}

function text(node) { return (node.textContent || '').replace(/\s+/g, ' ').trim(); }
function button(label, within = document) {
  const all = [...within.querySelectorAll('button')];
  const exact = all.filter((node) => text(node) === label);
  const matches = exact.length ? exact : all.filter((node) => text(node).includes(label)).sort((a,b) => text(a).length - text(b).length);
  assert.ok(matches.length > 0, `button not found: ${label}\nCurrent page: ${text(document.querySelector('main') || document.body).slice(0, 500)}`);
  return matches[0];
}
async function click(label, within = document) {
  const target = button(label, within);
  assert.equal(target.disabled, false, `button disabled: ${label}`);
  await act(async () => {
    target.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
function expectText(label) {
  assert.ok(text(document.body).includes(label), `text not found: ${label}`);
}
async function dismissTutorial() {
  const target = [...document.querySelectorAll('button')].find((node) => text(node).includes('明白，继续查案'));
  if (target) {
    await act(async () => { target.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })); await Promise.resolve(); });
  }
}

const state = createInitialState();

const storage = new MemoryStorage();
const root = createRoot(document.getElementById('root'));
act(() => {
  root.render(React.createElement(GameProvider, { initialState: state, storage }, React.createElement(GameShell)));
});

(async () => {
  expectText('官渡密报');
  await click('启封案卷');
  await click('继续');
  await click('继续');
  await click('继续听报');
  await click('进入中军帐');
  await click('听下一句');
  await click('听下一句');
  await click('完整军令都有谁接触过？');
  await click('听下一句');
  await click('领命查案');
  expectText('残缺伏击军报');
  await dismissTutorial();

  await click('北桥东侧');
  await click('寅时以前');
  await click('誊入案卷');
  await click('传赵简入帐');
  await click('听下一句');
  await click('去文书房核验');
  expectText('核对集合命令笔迹');
  await dismissTutorial();

  await click('“寅”字收锋');
  await click('“車”字折笔');
  await click('确认笔迹结论');
  await click('携证回帐质询');
  expectText('质询赵简');
  await dismissTutorial();
  await click('笔迹核验');
  await click('呈证质问');
  await click('移至军机推演板');
  expectText('把事实连起来');
  await dismissTutorial();

  await click('笔迹核验');
  await click('相互矛盾');
  await click('赵简原口供');
  await click('钉入推演板');
  await click('收录本折案卷');
  expectText('第一条矛盾已立');
  await click('携案卷觐见主公');
  expectText('觐见曹操');
  await click('入帐觐见');
  await click('坐前回话');
  await click('陈明所查');
  await click('臣已查出一条关键矛盾');
  await click('呈上证据');
  await click('组织第二轮汇报');
  await click('继续深查军需、文书与商路');
  await click('请主公下令');
  await click('臣领命');
  expectText('四匣并查');
  await dismissTutorial();

  await click('比对两版粮册');
  await click('以改册对质陆淳');
  await click('郑禾', document.querySelector('.dossier-rack'));
  await click('核车辆维修记录');
  await click('以维修笔迹对质');
  await click('杜衡', document.querySelector('.dossier-rack'));
  await click('查出入簿与商路图');
  await click('深查采购与价格');
  await click('以价格暗号对质杜衡');
  await click('赵简家书', document.querySelector('.dossier-rack'));
  await click('追查家书与家人');
  await click('把四匣移上推演板');
  expectText('拼出泄密链');

  let slots = [...document.querySelectorAll('.theory-slot')];
  await click('赵简', slots[0]);
  slots = [...document.querySelectorAll('.theory-slot')];
  await click('杜衡', slots[1]);
  slots = [...document.querySelectorAll('.theory-slot')];
  await click('杜衡', slots[2]);
  await click('钉定泄密链');
  expectText('三条关系已钉入案板');
  await click('制定四路假令');
  expectText('四路投饵');
  await dismissTutorial();

  await click('南线调用驿马');
  await click('登记十二辆粮车');
  await click('寅时集合');
  await click('制造南渡运输迹象');
  await click('封签四封假令');
  expectText('回报：南渡 · 寅时');
  await click('查看斥候回报');
  expectText('敌军回声');
  expectText('南渡');
  expectText('寅时');
  await click('回中军复命');
  expectText('觐见曹操');
  await click('入帐觐见');
  await click('坐前回话');
  await click('陈明所查');
  await click('请主公准臣结案收网');
  await click('听主公定夺');
  await click('臣领命');
  expectText('提交军机结案');

  await click('出发时辰');
  await click('运输路线');
  let peopleRow = document.querySelector('.report-person-row');
  await click('赵简', peopleRow);
  peopleRow = document.querySelector('.report-person-row');
  await click('杜衡', peopleRow);
  const split = document.querySelector('.report-section--split');
  const splitParts = split ? [...split.querySelectorAll(':scope > div')] : [];
  assert.equal(splitParts.length, 2, 'final report split sections missing');
  await click('杜衡', splitParts[0]);
  await click('价格表暗号', splitParts[1]);
  const evidenceGrid = document.querySelector('.report-evidence-grid');
  await click('笔迹核对确认', evidenceGrid);
  await click('杜衡承认结合草料', evidenceGrid);
  await click('异常价格与地支序号', evidenceGrid);
  await click('封印并呈交');
  expectText('真相归属');

  await click('交给曹军');
  expectText('封网成功');
  expectText('重新开案');

  console.log('v0.8 full UI playthrough passed (title → investigation → interrogation → deduction → bait → report → ending).');
  act(() => root.unmount());
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
