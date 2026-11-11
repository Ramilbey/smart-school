import assert from 'node:assert/strict';
import { test } from 'node:test';
import { signInitData, validateInitData } from '../server/telegramAuth.ts';

const TOKEN = '123456:TEST-token-for-unit-tests-only';
const now = Math.floor(Date.now() / 1000);
const user = JSON.stringify({ id: 4242, first_name: 'Aziza', language_code: 'uz' });

test('accepts correctly signed initData and returns the user', () => {
  const initData = signInitData({ auth_date: String(now), query_id: 'AAH', user }, TOKEN);
  const r = validateInitData(initData, TOKEN, 3600, now);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.user?.id, 4242);
    assert.equal(r.user?.first_name, 'Aziza');
  }
});

test('rejects a tampered user id', () => {
  const initData = signInitData({ auth_date: String(now), user }, TOKEN);
  const tampered = initData.replace('4242', '9999');
  assert.deepEqual(validateInitData(tampered, TOKEN, 3600, now), { ok: false, reason: 'bad-hash' });
});

test('rejects data signed with another bot token', () => {
  const initData = signInitData({ auth_date: String(now), user }, '999:other');
  assert.equal(validateInitData(initData, TOKEN, 3600, now).ok, false);
});

test('rejects expired initData', () => {
  const initData = signInitData({ auth_date: String(now - 7200), user }, TOKEN);
  assert.deepEqual(validateInitData(initData, TOKEN, 3600, now), { ok: false, reason: 'expired' });
});

test('rejects missing, malformed and token-less input', () => {
  assert.deepEqual(validateInitData('', TOKEN, 3600, now), { ok: false, reason: 'missing' });
  assert.deepEqual(validateInitData('user=1&hash=zz', TOKEN, 3600, now), { ok: false, reason: 'malformed' });
  assert.deepEqual(validateInitData('a=b', '', 3600, now), { ok: false, reason: 'no-token' });
});

test('accepts a signature field whether or not it was part of the signed string', () => {
  const withSig = signInitData({ auth_date: String(now), user, signature: 'abc' }, TOKEN);
  assert.equal(validateInitData(withSig, TOKEN, 3600, now).ok, true);

  const signedWithout = new URLSearchParams(signInitData({ auth_date: String(now), user }, TOKEN));
  signedWithout.set('signature', 'added-later');
  assert.equal(validateInitData(signedWithout.toString(), TOKEN, 3600, now).ok, true);
});
