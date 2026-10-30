const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('../server.cjs');

test('pages, application lifecycle, persistence and private file protection', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kfceo-test-'));
    const dataFile = path.join(dir, 'applications.json');
    let server;
    let base;
    async function start() {
        server = createServer(dataFile);
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        base = `http://127.0.0.1:${server.address().port}`;
    }
    async function stop() {
        await new Promise(resolve => server.close(resolve));
    }
    const send = (url, method, body) => fetch(base + url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    try {
        await start();
        for (const page of ['/', '/apply.html', '/admin.html', '/dashboard.html', '/css/style-v2.css?v=3', '/js/apply.js', '/images/hero-banner.png']) {
            const response = await fetch(base + page);
            assert.equal(response.status, 200, page);
            assert.ok((await response.text()).length > 0);
        }
        for (const file of ['/data/applications.json', '/server.cjs', '/package.json', '/.env']) {
            assert.equal((await fetch(base + file)).status, 404);
        }
        assert.equal((await send('/tables/applications', 'POST', {})).status, 400);
        const response = await send('/tables/applications', 'POST', {
            name: '테스트 신청자', phone: '010-0000-0000', email: 'test@example.com',
            company: '테스트 회사', position: '대표', industry_type: '프랜차이즈업',
            discount_rate: 20, discount_types: ['KFA 회원사'], final_amount: 1
        });
        assert.equal(response.status, 201);
        const record = await response.json();
        assert.equal(record.final_amount, 3960000);
        assert.equal(record.status, '대기중');
        await stop();
        await start();
        const list = await (await fetch(base + '/tables/applications?limit=1000')).json();
        assert.equal(list.total, 1);
        assert.equal(list.data[0].id, record.id);
        const resource = `/tables/applications/${record.id}`;
        assert.equal((await send(resource, 'PATCH', { status: 'invalid' })).status, 400);
        assert.equal((await (await send(resource, 'PATCH', { status: '승인' })).json()).status, '승인');
        assert.equal((await (await fetch(base + resource)).json()).status, '승인');
        assert.equal((await fetch(base + resource, { method: 'DELETE' })).status, 204);
        assert.equal((await fetch(base + resource)).status, 404);
        assert.equal((await (await fetch(base + '/tables/applications')).json()).total, 0);
    } finally {
        if (server?.listening) await stop();
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
