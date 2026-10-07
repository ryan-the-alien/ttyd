const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

const workerSource = fs.readFileSync(new URL('../src/notifications-sw.js', `file://${__filename}`), 'utf8');

async function clickNotification(clients, targetUrl = 'http://localhost:8103/') {
    let clickHandler;
    const self = {
        location: new URL('http://localhost:8103/'),
        registration: { scope: 'http://localhost:8103/' },
        clients,
        addEventListener(type, handler) {
            if (type === 'notificationclick') clickHandler = handler;
        },
    };
    vm.runInNewContext(workerSource, { self, URL });

    let waited;
    let closed = false;
    clickHandler({
        notification: { data: { url: targetUrl }, close: () => (closed = true) },
        waitUntil: promise => (waited = promise),
    });
    await waited;
    assert.equal(closed, true);
}

test('notification click focuses an open ttyd tab', async () => {
    let focused = 0;
    let opened;
    const client = { url: 'http://localhost:8103/', focus: async () => ++focused };
    const clients = {
        matchAll: async options => {
            assert.equal(options.type, 'window');
            assert.equal(options.includeUncontrolled, true);
            return [client];
        },
        openWindow: async url => (opened = url),
    };

    await clickNotification(clients);

    assert.equal(focused, 1);
    assert.equal(opened, undefined);
});

test('notification click opens ttyd when no tab is open', async () => {
    let opened;
    const clients = {
        matchAll: async () => [],
        openWindow: async url => (opened = url),
    };

    await clickNotification(clients);

    assert.equal(opened, 'http://localhost:8103/');
});
