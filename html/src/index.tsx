if (process.env.NODE_ENV === 'development') {
    require('preact/debug');
}
import 'whatwg-fetch';
import { h, render } from 'preact';
import { App } from './components/app';
import './style/index.scss';

document.addEventListener('contextmenu', event => event.preventDefault());

render(<App />, document.body);
