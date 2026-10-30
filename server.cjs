// Local development server: static pages and the exported site's Table API.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const ROOT = __dirname;
const STATUSES = ['대기중', '승인', '거부', '결제완료'];
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function json(res, status, value) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(value));
}

async function readBody(req) {
    let body = '';
    for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 65536) {
            throw Object.assign(new Error('요청이 너무 큽니다.'), { status: 413 });
        }
    }
    try {
        const value = JSON.parse(body);
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
        return value;
    } catch {
        throw Object.assign(new Error('올바른 JSON 객체가 필요합니다.'), { status: 400 });
    }
}

function createServer(dataFile = path.join(ROOT, 'data', 'applications.json')) {
    function load() {
        return fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : [];
    }
    function save(records) {
        fs.mkdirSync(path.dirname(dataFile), { recursive: true });
        fs.writeFileSync(`${dataFile}.tmp`, JSON.stringify(records, null, 2), 'utf8');
        fs.renameSync(`${dataFile}.tmp`, dataFile);
    }

    return http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url, 'http://localhost');
            const route = url.pathname.match(/^\/tables\/applications(?:\/([\w-]+))?$/);
            if (route) {
                const id = route[1];
                // Read bodies before loading the file so simultaneous writes use fresh data.
                const body = ['POST', 'PATCH'].includes(req.method) ? await readBody(req) : null;
                const records = load();
                const index = id ? records.findIndex(record => record.id === id) : -1;
                if (id && index < 0) return json(res, 404, { error: '신청을 찾을 수 없습니다.' });

                if (req.method === 'GET') {
                    if (id) return json(res, 200, records[index]);
                    const search = (url.searchParams.get('search') || '').toLowerCase();
                    const filtered = records.filter(record => `${record.name} ${record.company}`.toLowerCase().includes(search));
                    filtered.sort((a, b) => b.application_date.localeCompare(a.application_date));
                    const page = Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1);
                    const limit = Math.min(1000, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || 100));
                    return json(res, 200, { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit });
                }
                if (req.method === 'POST' && !id) {
                    const required = ['name', 'phone', 'email', 'company', 'position', 'industry_type'];
                    if (required.some(key => typeof body[key] !== 'string' || !body[key].trim())) {
                        return json(res, 400, { error: '필수 항목을 입력해주세요.' });
                    }
                    const rate = Number(body.discount_rate || 0);
                    if (![0, 10, 20].includes(rate)) return json(res, 400, { error: '할인율이 올바르지 않습니다.' });
                    const record = Object.fromEntries(required.map(key => [key, body[key].trim()]));
                    Object.assign(record, {
                        id: randomUUID(), inquiry: typeof body.inquiry === 'string' ? body.inquiry : '',
                        discount_types: Array.isArray(body.discount_types) ? body.discount_types.filter(value => typeof value === 'string') : [],
                        discount_rate: rate, base_amount: 4500000, discount_amount: 4500000 * rate / 100,
                        vat: (4500000 - 4500000 * rate / 100) * 0.1,
                        final_amount: Math.round((4500000 - 4500000 * rate / 100) * 1.1),
                        status: '대기중', application_date: new Date().toISOString()
                    });
                    records.push(record);
                    save(records);
                    return json(res, 201, record);
                }
                if (req.method === 'PATCH' && id) {
                    if (!STATUSES.includes(body.status)) return json(res, 400, { error: '상태가 올바르지 않습니다.' });
                    records[index].status = body.status;
                    save(records);
                    return json(res, 200, records[index]);
                }
                if (req.method === 'DELETE' && id) {
                    records.splice(index, 1);
                    save(records);
                    res.writeHead(204);
                    return res.end();
                }
                return json(res, 405, { error: '지원하지 않는 요청입니다.' });
            }

            if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: '지원하지 않는 요청입니다.' });
            const filename = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
            // Serve only the original public assets, never stored applications or server files.
            if (!/^\/(?:index\.html|apply\.html|admin\.html|dashboard\.html|(?:css|js)\/[\w.-]+\.(?:css|js)|images\/[\w.-]+\.(?:png|jpe?g|webp))$/.test(filename)) {
                return json(res, 404, { error: '파일을 찾을 수 없습니다.' });
            }
            const file = path.join(ROOT, filename);
            if (!fs.existsSync(file)) return json(res, 404, { error: '파일을 찾을 수 없습니다.' });
            res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] });
            res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(file));
        } catch (error) {
            if (!error.status) console.error(error);
            json(res, error.status || 500, { error: error.status ? error.message : '서버 처리 중 오류가 발생했습니다.' });
        }
    });
}

if (require.main === module) {
    const port = Number(process.env.PORT || 3000);
    const server = createServer();
    server.on('error', error => {
        console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Set PORT to another port.` : error);
        process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => console.log(`KFCEO local server: http://127.0.0.1:${port}`));
}

module.exports = { createServer };
