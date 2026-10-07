import { Realtime } from 'ably';
import { Component, h } from 'preact';

const subscribeKey = process.env.ABLY_SUBSCRIBE_KEY;
const channelName = process.env.ABLY_NOTIFICATION_CHANNEL || 'herdr-agent-completed';

interface State {
    enabled: boolean;
    status: string;
    connecting: boolean;
}

export class Notifications extends Component<{}, State> {
    private realtime?: Realtime;
    private notificationRegistration?: ServiceWorkerRegistration;

    constructor() {
        super();
        this.state = { enabled: false, status: '', connecting: false };
    }

    componentWillUnmount() {
        this.realtime?.close();
    }

    render() {
        if (!subscribeKey) return null;

        const { enabled, status, connecting } = this.state;
        return (
            <div class="notification-control">
                <button type="button" onClick={this.enable} disabled={enabled || connecting}>
                    {enabled ? 'Notifications enabled' : connecting ? 'Connecting…' : 'Enable notifications'}
                </button>
                <span role="status" aria-live="polite">
                    {status}
                </span>
            </div>
        );
    }

    private enable = async () => {
        if (!('Notification' in window)) {
            this.setState({ status: 'This browser does not support desktop notifications.' });
            return;
        }

        this.setState({ connecting: true, status: 'Requesting permission…' });
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                this.setState({ connecting: false, status: 'Notification permission was not granted.' });
                return;
            }

            if ('serviceWorker' in navigator) {
                try {
                    this.notificationRegistration = await navigator.serviceWorker.register('notifications-sw.js');
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    this.setState({ status: `Could not enable notification click handling: ${message}` });
                }
            }

            this.realtime?.close();
            const realtime = new Realtime({ key: subscribeKey, clientId: 'ttyd-browser' });
            this.realtime = realtime;
            realtime.connection.on('failed', change => {
                const reason = change.reason?.message;
                this.setState({
                    enabled: false,
                    connecting: false,
                    status: reason ? `Ably connection failed: ${reason}` : 'Ably connection failed.',
                });
            });
            const channel = realtime.channels.get(channelName);
            await channel.subscribe(async message => {
                if (message.name !== 'herdr.agent.done' || !message.data) return;

                const data = message.data as {
                    status?: string;
                    agent?: string | null;
                    title?: string | null;
                    pane_id?: string;
                };
                if (data.status !== 'done') return;

                const title = data.agent ? `${data.agent} finished` : 'Agent finished';
                const body = data.title || data.pane_id || 'Work completed';
                this.setState({ status: `Completion received for ${body}; showing notification…` });
                try {
                    if (this.notificationRegistration) {
                        await this.notificationRegistration.showNotification(title, {
                            body,
                            data: { url: window.location.href },
                        });
                    } else {
                        const notification = new Notification(title, { body });
                        notification.onclick = () => window.focus();
                        notification.onshow = () => this.setState({ status: 'Desktop notification shown.' });
                        notification.onerror = () =>
                            this.setState({ status: 'The browser could not display the desktop notification.' });
                    }
                    this.setState({ status: 'Desktop notification requested.' });
                } catch (error) {
                    const reason = error instanceof Error ? error.message : String(error);
                    this.setState({ status: `Could not show desktop notification: ${reason}` });
                }
            });
            this.setState({ enabled: true, connecting: false, status: `Listening on ${channelName}` });
        } catch (error) {
            this.realtime?.close();
            this.realtime = undefined;
            const message = error instanceof Error ? error.message : String(error);
            this.setState({ connecting: false, status: `Could not connect to Ably: ${message}` });
        }
    };
}
