'use strict';

const fs = require('fs');
const http = require('http');
const marked = require('./marked-math-support.js');

const fsPath = process.argv[2][0] === '/' ? process.argv[2] : process.cwd() + '/' + process.argv[2];
const port = process.argv[3] || 8000;
const host = process.argv[4] || '';
const template = fs.readFileSync(__dirname + '/template.html', 'utf8');


http.createServer((req, res) => {

  const path = decodeURI(req.url);
  if (path[path.length - 1] !== '/') {
    fs.readFile(fsPath + path + '.md', 'utf8', (err, data) => {
      if (err) {
        fs.stat(fsPath + path, (err, stats) => {
          if (err || !stats.isDirectory()) {
            res.writeHead(404);
            res.end('404');
          } else {
            fs.stat(fsPath + path + '/.squash', (err, stats) => {
              if (err) {
                res.writeHead(303, { 'Location': path + '/' });
                res.end();
              } else {
                getSquash(path, res);
              }
            });
          }
        });
      } else {
        res.end(template.replace('[content]', md(data)));
      }
    });
  } else {
    fs.readFile(fsPath + path + 'index.md', 'utf8', (err, data) => {
      if (err) {
        fs.stat(fsPath + path + '.no-index', (err, stats) => {
          if (err) {
            getFileIndex(path, res);
          } else {
            res.writeHead(404);
            res.end('404');
          }
        });
      } else {
        res.end(template.replace('[content]', md(data)));
      }
    });
  }

}).listen(port, host, () => console.log(`Listening on ${host}:${port}`));


marked.setOptions({
  mathDelimiters: [['$', '$'], ['\\(', '\\)'], ['\\[', '\\]'], ['$$', '$$'], 'beginend']
});

function md(text, headerShift) {
  if (headerShift) {
    let renderer = new marked.Renderer();
    renderer.heading = function (text, level) {
      return `<h${level+headerShift}>${text}</h${level+headerShift}>`;
    };
    return marked(text, { renderer: renderer, smartypants: true });
  } else {
    return marked(text);
  }
}

function accumulateContent(path, res, cb) {
  fs.readdir(fsPath + path, (err, files) => {
    if (err) {
      res.writeHead(404);
      res.end('404');
    } else {
      files.sort().reverse();
      res.end(template.replace('[content]', cb(files)));
    }
  });
}

function getFileIndex(path, res) {
  accumulateContent(path, res, (files) => {
    let html = '<ul>';
    for (let i = 0; i < files.length; i++) {
      if (files[i] !== '.no-index' && files[i] !== '.squash') {
        let fileNameStripped = files[i].slice(0, -3);
        html += `<li><a href="${path}${fileNameStripped}">${fileNameStripped}</a></li>`;
      }
    }
    html += '</ul>';
    return html;
  });
}

function getSquash(path, res) {
  accumulateContent(path, res, (files) => {
    let squashed = '';
    for (let i = 0; i < files.length; i++) {
      squashed += fs.readFileSync(fsPath + path + '/' + files[i], 'utf8');
    }
    return md(squashed);
  });
}
