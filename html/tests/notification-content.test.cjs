const assert = require('node:assert/strict');
const test = require('node:test');

const { buildNotificationContent } = require('../src/notification-content');

test('waiting input notification names the agent and explains why it is waiting', () => {
    assert.deepEqual(buildNotificationContent('idle', 'codex'), {
        title: 'Codex Agent',
        body: 'Agent is waiting for your input',
        icon: 'notifications/codex.png',
    });
});

test('finished notification names the agent and says the work is complete', () => {
    assert.deepEqual(buildNotificationContent('done', 'Codex'), {
        title: 'Codex Agent',
        body: 'Agent has finished the work',
        icon: 'notifications/codex.png',
    });
});

test('uses the event agent name in the title', () => {
    assert.deepEqual(buildNotificationContent('done', 'claude'), {
        title: 'Claude Agent',
        body: 'Agent has finished the work',
        icon: 'notifications/claude.png',
    });
});

test('uses the Claude icon for a Claude display label', () => {
    assert.equal(buildNotificationContent('blocked', 'Claude Code: auth').icon, 'notifications/claude.png');
});

test('uses a logo for each Herdr agent with a matching icon', () => {
    const icons = {
        amp: 'amp',
        antigravity: 'antigravity',
        claude: 'claude',
        cline: 'cline',
        codex: 'codex',
        copilot: 'copilot',
        cursor: 'cursor',
        devin: 'devin',
        gemini: 'gemini',
        grok: 'grok',
        hermes: 'hermes',
        kilo: 'kilo',
        kimi: 'kimi',
        kiro: 'kiro',
        mastra: 'mastra',
        opencode: 'opencode',
        pi: 'pi',
        qoder: 'qoder',
        qwen: 'qwen',
    };

    for (const [agent, icon] of Object.entries(icons)) {
        assert.equal(buildNotificationContent('done', agent).icon, `notifications/${icon}.png`, agent);
    }
});

test('leaves agents without a matching logo on the browser default icon', () => {
    for (const agent of ['droid', 'letta', 'maki', 'muse', 'omp', 'oh my pi', 'command code', 'crush', 'prime agent']) {
        assert.equal(buildNotificationContent('done', agent).icon, undefined, agent);
    }
});

test('matches Herdr agent kind aliases and display labels', () => {
    const cases = {
        agy: 'antigravity',
        'Antigravity CLI': 'antigravity',
        'Gemini CLI': 'gemini',
        'GitHub Copilot CLI': 'copilot',
        MastraCode: 'mastra',
        'Qoder CLI': 'qoder',
    };

    for (const [agent, icon] of Object.entries(cases)) {
        assert.equal(buildNotificationContent('done', agent).icon, `notifications/${icon}.png`, agent);
    }
});

test('blocked notification explains that the agent needs input', () => {
    assert.deepEqual(buildNotificationContent('blocked', 'Codex'), {
        title: 'Codex Agent',
        body: 'Agent is waiting for your approval or input',
        icon: 'notifications/codex.png',
    });
});

test('uses a generic agent label when Herdr does not provide an agent name', () => {
    assert.deepEqual(buildNotificationContent('done', null), {
        title: 'Herdr Agent',
        body: 'Agent has finished the work',
    });
});

test('describes future status values and uses the browser default icon when no logo matches', () => {
    assert.deepEqual(buildNotificationContent('review', 'droid'), {
        title: 'Droid Agent',
        body: 'Agent status changed to review',
    });
});
