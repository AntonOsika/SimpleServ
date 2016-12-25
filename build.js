'use strict';

const fs = require('fs');
const render = require('./render.js');

if (process.argv.length < 4) {
  console.log('Missing arguments.');
  process.exit();
}

const src =  process.argv[2][0] === '/' ? process.argv[2] : process.cwd() + '/' + process.argv[2];
const dest = process.argv[3][0] === '/' ? process.argv[3] : process.cwd() + '/' + process.argv[3];


if (!src || !dest) {
  console.log('Specify src and dest');
  process.exit();
}

fs.readdir(src, (err, files) => {
  if (err) throw err;
  for (let i = 0, file; file = files[i]; i++) {
    if (file.substr(-3) === '.md') {
      fs.readFile(`${src}/${file}`, 'utf8', (err, data) => {
        if (err) throw err;
        console.log(`'${src}/${file}' -> '${dest}/${file.slice(0, -3)}.html'`);
        fs.writeFile(`${dest}/${file.slice(0, -3)}.html`, render(data));
      });
    }
  }
});

