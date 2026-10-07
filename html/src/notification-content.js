'use strict';

function buildNotificationContent(status, agent) {
    const name = typeof agent === 'string' && agent.trim() ? agent.trim() : 'Herdr';
    const baseName = name.replace(/\s+Agent$/i, '');
    const title = `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)} Agent`;
    const normalizedAgent = typeof agent === 'string' ? agent.toLowerCase().trim() : '';
    const agentWords = normalizedAgent.split(/[^a-z0-9]+/);
    const iconByAgent = {
        amp: 'amp',
        antigravity: 'antigravity',
        agy: 'antigravity',
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
        mastracode: 'mastra',
        mastra: 'mastra',
        opencode: 'opencode',
        pi: 'pi',
        qoder: 'qoder',
        qodercli: 'qoder',
        qwen: 'qwen',
    };
    const isOhMyPi = /^oh\s+my\s+pi(?:\b|$)/.test(normalizedAgent);
    const iconAgent = isOhMyPi ? undefined : agentWords.find(word => iconByAgent[word]);
    const icon = iconAgent ? `notifications/${iconByAgent[iconAgent]}.png` : undefined;

    const content = icon ? { title, icon } : { title };

    if (status === 'idle') {
        return { ...content, body: 'Agent is waiting for your input' };
    }
    if (status === 'done') {
        return { ...content, body: 'Agent has finished the work' };
    }
    if (status === 'blocked') {
        return { ...content, body: 'Agent is waiting for your approval or input' };
    }
    return null;
}

module.exports = { buildNotificationContent };
