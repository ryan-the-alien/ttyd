const { src, dest, task, series } = require('gulp');
const fs = require('fs');
const path = require('path');
const clean = require('gulp-clean');
const gzip = require('gulp-gzip');
const inlineSource = require('gulp-inline-source');
const rename = require('gulp-rename');
const through2 = require('through2');

const genHeader = (size, buf, len) => {
    let idx = 0;
    let data = 'unsigned char index_html[] = {\n  ';

    for (const value of buf) {
        idx++;

        const current = value < 0 ? value + 256 : value;

        data += '0x';
        data += (current >>> 4).toString(16);
        data += (current & 0xf).toString(16);

        if (idx === len) {
            data += '\n';
        } else {
            data += idx % 12 === 0 ? ',\n  ' : ', ';
        }
    }

    data += '};\n';
    data += `unsigned int index_html_len = ${len};\n`;
    data += `unsigned int index_html_size = ${size};\n`;
    return data;
};
let fileSize = 0;

task('clean', () => {
    return src('dist', { read: false, allowEmpty: true }).pipe(clean());
});

task('inline', () => {
    const options = {
        compress: false,
    };

    return src('dist/index.html').pipe(inlineSource(options)).pipe(rename('inline.html')).pipe(dest('dist/'));
});

task('worker', () => {
    return src('src/notifications-sw.js')
        .pipe(
            through2.obj((file, enc, cb) => {
                const source = file.contents.toString();
                file.contents = Buffer.from(
                    `const char notifications_sw_script[] = ${JSON.stringify(source)};\n` +
                        'const unsigned int notifications_sw_script_len = sizeof(notifications_sw_script) - 1;\n'
                );
                return cb(null, file);
            })
        )
        .pipe(rename('notifications-sw.h'))
        .pipe(dest('../src/'));
});

task('notification-icons', done => {
    const icons = [
        ['amp', 'src/assets/notifications/amp.png'],
        ['antigravity', 'src/assets/notifications/antigravity.png'],
        ['claude', 'src/assets/notifications/claude.png'],
        ['cline', 'src/assets/notifications/cline.png'],
        ['codex', 'src/assets/notifications/codex.png'],
        ['copilot', 'src/assets/notifications/copilot.png'],
        ['cursor', 'src/assets/notifications/cursor.png'],
        ['devin', 'src/assets/notifications/devin.png'],
        ['gemini', 'src/assets/notifications/gemini.png'],
        ['grok', 'src/assets/notifications/grok.png'],
        ['hermes', 'src/assets/notifications/hermes.png'],
        ['kilo', 'src/assets/notifications/kilo.png'],
        ['kimi', 'src/assets/notifications/kimi.png'],
        ['kiro', 'src/assets/notifications/kiro.png'],
        ['mastra', 'src/assets/notifications/mastra.png'],
        ['opencode', 'src/assets/notifications/opencode.png'],
        ['pi', 'src/assets/notifications/pi.png'],
        ['qoder', 'src/assets/notifications/qoder.png'],
        ['qwen', 'src/assets/notifications/qwen.png'],
    ];
    const declarations = icons.map(([name, file]) => {
        const bytes = fs.readFileSync(path.resolve(__dirname, file));
        const rows = [];
        for (let i = 0; i < bytes.length; i += 16) {
            rows.push(`    ${Array.from(bytes.subarray(i, i + 16), byte => `0x${byte.toString(16).padStart(2, '0')}`).join(', ')}`);
        }
        return (
            `static const unsigned char notification_${name}_icon[] = {\n${rows.join(',\n')}\n};\n` +
            `static const unsigned long notification_${name}_icon_len = sizeof(notification_${name}_icon);\n`
        );
    });
    fs.writeFileSync(path.resolve(__dirname, '../src/notification-icons.h'), declarations.join('\n'));
    done();
});

task(
    'default',
    series('inline', 'worker', 'notification-icons', () => {
        return src('dist/inline.html')
            .pipe(
                through2.obj((file, enc, cb) => {
                    fileSize = file.contents.length;
                    return cb(null, file);
                })
            )
            .pipe(gzip())
            .pipe(
                through2.obj((file, enc, cb) => {
                    const buf = file.contents;
                    file.contents = Buffer.from(genHeader(fileSize, buf, buf.length));
                    return cb(null, file);
                })
            )
            .pipe(rename('html.h'))
            .pipe(dest('../src/'));
    })
);
