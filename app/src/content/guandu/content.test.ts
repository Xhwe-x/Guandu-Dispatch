import { describe, expect, it } from 'vitest';
import { validateGameContent } from '../../game/contentSchema';
import { validateRelationship } from '../../game/rules/relationships';
import { guanduCase } from './index';

const characterContract = [
  ['lu', '陆淳', '邮驿主吏', ['ledger', 'seal', 'horseDispatch'], '挪用少量军粮救济村民并修改数量', '违法但未通敌'],
  ['zheng', '郑禾', '军粮书佐', ['convoyScale', 'wagonDamage'], '修改车辆维修记录掩盖失误', '撒谎但未泄露核心情报'],
  ['zhao', '赵简', '军书佐', ['departureTime'], '家人受胁迫', '向杜衡泄露出发时辰'],
  ['du', '杜衡', '营外行商', ['fodder', 'wheel', 'bridge', 'tradeRoute'], '使用价格表暗号', '推断路线、拼合并传递情报'],
] as const;

const documentContract = [
  ['report-ambush', '残缺伏击军报', 'report', ['北桥', '车辙', '封蜡未破', '冷炊灰', '蹄印', '寅时前集结']],
  ['ledger-original', '粮秣出入簿（原簿）', 'ledger', ['八百六十袋', '陆淳签押']],
  ['ledger-revised', '粮秣出入簿（改簿）', 'ledger', ['八百二十袋', '盖印顺序']],
  ['repair-wagons', '车马修治簿', 'repair', ['七辆', '三辆', '三尺二寸']],
  ['repair-north-bridge', '北桥修治牍', 'repair', ['两日前', '重型粮车']],
  ['station-entry', '邮舍出入簿', 'ledger', ['杜衡', '每辆重车五束', '一百二十束', '二十四辆重车']],
  ['statement-lu', '陆淳口供', 'statement', ['否认', '粮册数量']],
  ['statement-zheng', '郑禾口供', 'statement', ['否认', '维修记录']],
  ['statement-zhao', '赵简口供', 'statement', ['只负责誊抄', '不知道集合时辰']],
  ['statement-du', '杜衡口供', 'statement', ['按订单送货', '不懂军务']],
  ['trade-prices', '商价簿', 'trade', ['价格', '地支序号', '编码']],
  ['route-map', '官渡粮道图牍', 'map', ['北桥', '南渡', '西岭', '伏击点']],
] as const;

const baitContract = [
  ['bait-lu-south', 'lu', '南线调用驿马', 'southDispatch', ['claim-lu-seal-order'], false],
  ['bait-lu-priority', 'lu', '调高南渡通行优先级', 'southPriority', ['claim-lu-seal-order', 'claim-lu-ledger-change'], false],
  ['bait-lu-seal', 'lu', '制造异常盖印顺序', 'anomalousSeal', ['claim-lu-seal-order'], false],
  ['bait-zheng-12', 'zheng', '登记十二辆粮车', '12', ['claim-zheng-scale'], false],
  ['bait-zheng-24', 'zheng', '登记二十四辆粮车', '24', ['claim-zheng-scale', 'claim-zheng-repair-change'], false],
  ['bait-zheng-36', 'zheng', '登记三十六辆粮车', '36', ['claim-zheng-scale', 'claim-zheng-repair-change'], false],
  ['bait-zhao-zi', 'zhao', '子时集合', 'zi', ['claim-zhao-time', 'claim-zhao-copied-order'], true],
  ['bait-zhao-chou', 'zhao', '丑时家书', 'chou', ['claim-zhao-time', 'claim-zhao-coerced'], true],
  ['bait-zhao-yin', 'zhao', '寅时集合', 'yin', ['claim-zhao-time', 'claim-zhao-copied-order'], true],
  ['bait-du-south-ford', 'du', '制造南渡运输迹象', 'southFord', ['claim-south-ford-open', 'claim-du-fodder-pattern'], true],
  ['bait-du-west-ridge', 'du', '制造西岭运输迹象', 'westRidge', ['claim-west-ridge-light', 'claim-du-wheel-question'], true],
  ['bait-du-north-bridge', 'du', '制造北桥运输迹象', 'northBridge', ['claim-bridge-open', 'claim-du-wheel-question', 'claim-du-fodder-pattern'], true],
] as const;

describe('guandu case content', () => {
  it('passes the complete game-content validator with unique stable IDs', () => {
    expect(validateGameContent(guanduCase)).toStrictEqual(guanduCase);

    for (const items of [
      guanduCase.characters,
      guanduCase.documents,
      guanduCase.claims,
      guanduCase.investigations,
      guanduCase.interrogations,
      guanduCase.baits,
    ]) {
      const ids = items.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('contains the complete fixed inventory', () => {
    expect(guanduCase.characters.map((character) => character.id)).toEqual(['lu', 'zheng', 'zhao', 'du']);
    expect(guanduCase.documents.map((document) => document.id)).toEqual([
      'report-ambush',
      'ledger-original',
      'ledger-revised',
      'repair-wagons',
      'repair-north-bridge',
      'station-entry',
      'statement-lu',
      'statement-zheng',
      'statement-zhao',
      'statement-du',
      'trade-prices',
      'route-map',
    ]);
    expect(guanduCase.investigations).toHaveLength(6);
    expect(guanduCase.baits).toHaveLength(12);
  });

  it('locks the approved character semantics field by field', () => {
    expect(guanduCase.characters.map((character) => [
      character.id,
      character.name,
      character.role,
      character.access,
      character.secret,
      character.responsibility,
    ])).toEqual(characterContract);
  });

  it('locks every document title, category, factual clue, and pre-answer boundary', () => {
    expect(guanduCase.documents.map((document) => [document.id, document.title, document.category])).toEqual(
      documentContract.map(([id, title, category]) => [id, title, category]),
    );
    for (const [id, , , clues] of documentContract) {
      const body = guanduCase.documents.find((document) => document.id === id)!.body;
      for (const clue of clues) {
        expect(body, `${id}: ${clue}`).toContain(clue);
      }
      expect(body, id).not.toMatch(/赵简.{0,8}泄露.{0,8}时辰|杜衡.{0,8}拼合|杜衡.{0,8}传给袁军/u);
    }
  });

  it('keeps the ambush report observational until the site investigation', () => {
    const report = guanduCase.documents.find((document) => document.id === 'report-ambush')!;
    expect(report.body).not.toMatch(
      /无人单独|各自只接触|完整命令未失|完整命令未被取走|完整封存命令仍在|无人.{0,8}(阅得|接触).{0,4}全件/u,
    );
    expect(report.body).toEqual(expect.stringContaining('封蜡未破'));
    expect(report.body).toEqual(expect.stringContaining('北桥'));
    expect(report.body).toEqual(expect.stringContaining('车辙'));
    expect(report.body).toEqual(expect.stringContaining('冷炊灰'));
    expect(report.body).toEqual(expect.stringContaining('蹄印'));
    expect(report.body).toEqual(expect.stringContaining('寅时前集结'));

    const noFullOrder = guanduCase.claims.find((claim) => claim.id === 'claim-no-full-order')!;
    expect(noFullOrder.provenance).toEqual({
      kind: 'investigation',
      sourceId: 'investigate-ambush-site',
    });
    expect(guanduCase.claims.find((claim) => claim.id === 'claim-shuoyuan-received')?.text).toBe(
      '敌军行动同时对应北桥与寅时',
    );
  });

  it('keeps every prose document within the prototype reading budget', () => {
    for (const document of guanduCase.documents.filter((item) => item.category !== 'map')) {
      expect(document.body).toMatch(/[\u3400-\u9fff]/u);
      expect([...document.body].length).toBeGreaterThanOrEqual(80);
      expect([...document.body].length).toBeLessThanOrEqual(180);
    }
  });

  it('contains every fixed-truth claim with a bidirectional document source', () => {
    const requiredClaimIds = [
      'claim-ambush-north',
      'claim-lu-ledger-change',
      'claim-lu-no-time',
      'claim-zheng-repair-change',
      'claim-zheng-no-route',
      'claim-zhao-denial',
      'claim-zhao-copied-order',
      'claim-zhao-time',
      'claim-zhao-coerced',
      'claim-bridge-open',
      'claim-du-wheel-question',
      'claim-du-fodder-pattern',
      'claim-du-route',
      'claim-price-cipher',
      'claim-no-full-order',
      'claim-shuoyuan-received',
      'claim-lu-seal-order',
      'claim-zheng-scale',
      'claim-zhao-night-duty',
      'claim-south-ford-open',
      'claim-west-ridge-light',
    ];
    expect(guanduCase.claims.map((claim) => claim.id)).toEqual(expect.arrayContaining(requiredClaimIds));
    expect(guanduCase.claims.length).toBeGreaterThanOrEqual(15);

    for (const claim of guanduCase.claims) {
      const source = guanduCase.documents.find((document) => document.id === claim.sourceDocumentId);
      expect(source, claim.id).toBeDefined();
      expect(source?.claimIds, claim.id).toContain(claim.id);
    }
  });

  it('attributes derived claims to the actual investigation or interrogation', () => {
    const provenanceByClaim = Object.fromEntries(
      guanduCase.claims.map((claim) => [claim.id, claim.provenance]),
    );
    expect(provenanceByClaim).toMatchObject({
      'claim-zhao-copied-order': { kind: 'investigation', sourceId: 'investigate-handwriting' },
      'claim-du-fodder-pattern': { kind: 'investigation', sourceId: 'investigate-du-records' },
      'claim-price-cipher': { kind: 'investigation', sourceId: 'investigate-du-records' },
      'claim-bridge-open': { kind: 'investigation', sourceId: 'investigate-north-bridge' },
      'claim-zhao-coerced': { kind: 'investigation', sourceId: 'investigate-zhao-family' },
      'claim-ambush-north': { kind: 'investigation', sourceId: 'investigate-ambush-site' },
      'claim-no-full-order': { kind: 'investigation', sourceId: 'investigate-ambush-site' },
      'claim-du-wheel-question': { kind: 'investigation', sourceId: 'investigate-deep-du' },
      'claim-lu-no-time': { kind: 'interrogation', sourceId: 'interrogate-lu-ledger' },
      'claim-lu-relief-motive': { kind: 'interrogation', sourceId: 'interrogate-lu-ledger' },
      'claim-zheng-no-route': { kind: 'interrogation', sourceId: 'interrogate-zheng-repair' },
      'claim-zhao-time': { kind: 'interrogation', sourceId: 'interrogate-zhao-time' },
      'claim-du-route': { kind: 'interrogation', sourceId: 'interrogate-du-cipher' },
    });
  });

  it('keeps the fodder arithmetic concrete and scale auxiliary to route analysis', () => {
    const station = guanduCase.documents.find((document) => document.id === 'station-entry')!;
    const fodderClaim = guanduCase.claims.find((claim) => claim.id === 'claim-du-fodder-pattern')!;
    expect(station.body).toEqual(expect.stringContaining('每辆重车五束'));
    expect(station.body).toEqual(expect.stringContaining('一百二十束'));
    expect(station.body).toEqual(expect.stringContaining('二十四辆重车'));
    expect(fodderClaim.text).toEqual(expect.stringContaining('五束'));
    expect(fodderClaim.text).toEqual(expect.stringContaining('一百二十束'));
    expect(guanduCase.hints.routeSource[2]).toContain('规模只是辅助');
    expect(guanduCase.claims.find((claim) => claim.id === 'claim-price-cipher')?.text).not.toContain('推断路线');
  });

  it('permits the three fixed hypothesis links and Zhao denial refutation', () => {
    expect(guanduCase.claims.find((claim) => claim.id === 'claim-zhao-time')?.tags).toContain('actor');
    expect(guanduCase.claims.find((claim) => claim.id === 'claim-du-route')?.tags).toContain('method');
    expect(guanduCase.claims.find((claim) => claim.id === 'claim-shuoyuan-received')?.tags).toContain('enemyConclusion');
    expect(guanduCase.claims.find((claim) => claim.id === 'claim-zhao-copied-order')?.tags).toEqual(expect.arrayContaining(['refutes', 'actor']));
  });

  it('maps all six investigations to their fixed reveals', () => {
    expect(guanduCase.investigations.map(({ id, revealClaimIds }) => [id, revealClaimIds])).toEqual([
      ['investigate-handwriting', ['claim-zhao-copied-order']],
      ['investigate-du-records', ['claim-du-fodder-pattern', 'claim-price-cipher']],
      ['investigate-north-bridge', ['claim-bridge-open']],
      ['investigate-zhao-family', ['claim-zhao-coerced']],
      ['investigate-ambush-site', ['claim-ambush-north', 'claim-no-full-order']],
      ['investigate-deep-du', ['claim-du-wheel-question', 'claim-price-cipher']],
    ]);
  });

  it('provides a usable contradiction interrogation for every character', () => {
    expect(guanduCase.interrogations.map((rule) => [
      rule.characterId,
      rule.statementClaimId,
      rule.evidenceClaimId,
      rule.revealClaimIds,
    ])).toEqual([
      ['lu', 'claim-lu-denial', 'claim-lu-ledger-change', ['claim-lu-relief-motive', 'claim-lu-no-time']],
      ['zheng', 'claim-zheng-denial', 'claim-zheng-repair-change', ['claim-zheng-no-route']],
      ['zhao', 'claim-zhao-denial', 'claim-zhao-copied-order', ['claim-zhao-time']],
      ['du', 'claim-du-denial', 'claim-price-cipher', ['claim-du-route', 'claim-shuoyuan-received']],
    ]);

    for (const rule of guanduCase.interrogations) {
      expect(validateRelationship(guanduCase, {
        fromId: rule.evidenceClaimId,
        toId: rule.statementClaimId,
        kind: 'refutes',
        slot: 'leakedInfo',
      }), rule.id).toEqual({ ok: true });
      expect(rule.revealClaimIds.length, rule.id).toBeGreaterThan(0);
    }
  });

  it('keeps Lu guarded until evidence reveals relief motive and limited access', () => {
    const statement = guanduCase.documents.find((document) => document.id === 'statement-lu')!;
    expect(statement.body).not.toMatch(/承认.{0,8}(改|重抄)|曾.{0,8}重抄/u);
    expect(guanduCase.claims.find((claim) => claim.id === 'claim-lu-denial')?.text).toBe('陆淳否认或回避修改粮册数量');
    const rule = guanduCase.interrogations.find((item) => item.characterId === 'lu')!;
    expect(rule.revealClaimIds).toEqual(['claim-lu-relief-motive', 'claim-lu-no-time']);
  });

  it('declares target-level permissions for the main chain and evidence board', () => {
    expect(guanduCase.relationshipPermissions).toEqual(expect.arrayContaining([
      { fromId: 'claim-zhao-time', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
      { fromId: 'claim-du-route', toId: 'du', kind: 'infers', slot: 'method' },
      { fromId: 'du', toId: 'claim-shuoyuan-received', kind: 'transmitsTo', slot: 'enemyConclusion' },
      { fromId: 'claim-zhao-copied-order', toId: 'claim-zhao-denial', kind: 'refutes', slot: 'leakedInfo' },
      { fromId: 'claim-zhao-copied-order', toId: 'zhao', kind: 'accessedBy', slot: 'actor' },
      { fromId: 'claim-du-fodder-pattern', toId: 'claim-du-route', kind: 'supports', slot: 'method' },
      { fromId: 'claim-du-wheel-question', toId: 'claim-du-route', kind: 'supports', slot: 'method' },
      { fromId: 'claim-bridge-open', toId: 'claim-du-route', kind: 'supports', slot: 'method' },
      { fromId: 'claim-price-cipher', toId: 'claim-shuoyuan-received', kind: 'supports', slot: 'enemyConclusion' },
    ]));
    for (const permission of guanduCase.relationshipPermissions) {
      expect(validateRelationship(guanduCase, permission), JSON.stringify(permission)).toEqual({ ok: true });
    }
  });

  it('defines every fixed bait label, signal, requirement, and core channel', () => {
    expect(guanduCase.baits.map((bait) => [
      bait.id,
      bait.channel,
      bait.payload,
      bait.signal,
      bait.requiredClaimIds,
      bait.core,
    ])).toEqual(baitContract);
  });

  it('provides the four approved three-level hint topics', () => {
    expect(Object.keys(guanduCase.hints)).toEqual(['timeSource', 'routeSource', 'transmission', 'innocentLiars']);
    expect(guanduCase.hints.timeSource).toEqual([
      '也许应该确认谁真正知道出发时间。',
      '赵简的口供和集合命令可能存在关联。',
      '赵简称不知道出发时间，但集合命令由他亲笔抄写。',
    ]);
    for (const levels of Object.values(guanduCase.hints)) {
      expect(levels).toHaveLength(3);
      expect(levels.every(Boolean)).toBe(true);
    }
  });

  it('contains every fragment key consumed by the epilogue composer', () => {
    expect(Object.keys(guanduCase.epilogueFragments).sort()).toEqual([
      'du.escaped',
      'du.identified',
      'lu.canghe',
      'lu.destroyed',
      'lu.lishe',
      'lu.shuoyuan',
      'outcome.ambushedAgain',
      'outcome.convoySavedIncomplete',
      'outcome.networkClosed',
      'owner.canghe',
      'owner.destroyed',
      'owner.lishe',
      'owner.shuoyuan',
      'player.canghe',
      'player.destroyed',
      'player.lishe',
      'player.shuoyuan',
      'zhao.coerced',
      'zhao.traitor',
      'zheng.accused',
      'zheng.cleared',
    ]);
    expect(guanduCase.epilogueFragments['du.escaped']).toContain('未正确指出杜衡的传递方式');
    expect(guanduCase.epilogueFragments['du.escaped']).not.toMatch(/未找到|未发现|没有.{0,4}证据/u);
  });
});
