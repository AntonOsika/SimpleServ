const fs = require('fs')
const url = require('url')
const path = require('path')
const http = require('http')
const render = require('./render.js')
const marked = require('./marked-math-support.js')
const mimes = require('./mimes.js')
const async = require('async')
const ejs = require('ejs')


if (!process.argv[2]) process.argv[2] = '.'
const fsPath = process.argv[2][0] === '/' ? process.argv[2] : process.cwd() + '/' + process.argv[2]
const port = process.argv[3] || 8000
const host = process.argv[4] || ''


http.createServer((req, res) => {

  let reqPath = decodeURI(req.url)

  // Lowercase reqPath (but not query) for consistency and SEO
  if (reqPath.toLowerCase() !== reqPath) {
    const parsedPath = url.parse(reqPath)
    parsedPath.pathname = parsedPath.pathname.toLowerCase()
    reqPath = url.format(parsedPath)
    res.statusCode = 301
    res.setHeader('Location', reqPath)
    res.end()
    return
  }

  if (reqPath[reqPath.length - 1] !== '/') {
    async.series([getRaw, getMd, getHtml, getRedirect, getSquashed, get404])
  } else {
    async.series([redirectWithoutTrailingSlash, getIndexMd, getIndexHtml, getIndexEjs, getListing, get404])
  }

  function getMd(cb) {
    fs.readFile(fsPath + reqPath + '.md', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', 'text/html; charset=utf-8')
      res.end(render(data))
    })
  }

  function getHtml(cb) {
    fs.readFile(fsPath + reqPath + '.html', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', 'text/html; charset=utf-8')
      res.end(data)
    })
  }

  function getRaw(cb) {
    fs.readFile(fsPath + reqPath, (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', mimes.getMime(reqPath) + '; charset=utf-8')
      res.end(data)
    })
  }

  function getSquashed(cb) {
    fs.stat(fsPath + reqPath, (err, stats) => {
      if (err || !stats.isDirectory()) {
        res.statusCode = 404
        return res.end('404')
      }
      fs.stat(fsPath + reqPath + '/.squash', (err, stats) => {
        if (err) {
          res.statusCode = 303
          res.setHeader('Location', reqPath + '/')
          res.end()
        } else {
          getSquash(reqPath, res)
        }
      })
    })
  }

  function getIndexMd(cb) {
    fs.readFile(fsPath + reqPath + 'index.md', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', 'text/html; charset=utf-8')
      res.end(render(data))
    })
  }

  function getIndexEjs(cb) {
    fs.readFile(fsPath + reqPath + 'index.md.ejs', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      fs.readdir(fsPath + reqPath, (err, files) => {
        if (err) {
          res.setHeader('content-Type', 'text/plain; charset=utf-8')
          res.statusCode = 500
          res.end('500\n\n' + err)
        } else {
          files = files.filter(file => file.endsWith('.md'))
          Promise.all(files.map((file) => getFileMetadata(fsPath + reqPath + file))).then(filesData => {
            filesData.sort(x => x.date).reverse()
            res.setHeader('content-Type', 'text/html; charset=utf-8')
            res.end(render(ejs.render(data, { files: filesData })))
          }).catch((err) => {
            res.setHeader('content-Type', 'text/plain; charset=utf-8')
            res.statusCode = 500
            res.end('500\n\n' + err)
          })
        }
      })
    })
  }

  function getIndexHtml(cb) {
    fs.readFile(fsPath + reqPath + 'index.html', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', 'text/html; charset=utf-8')
      res.end(data)
    })
  }

  function getListing(cb) {
    fs.access(fsPath + reqPath + '.no-index', err => {
      if (err) {
        cb(true)
        getFileIndex(reqPath, res)
      } else {
        cb(false)
      }
    })
  }

  function get404(cb) {
    cb(true)
    res.statusCode = 404
    res.end('404')
  }

  function getRedirect(cb) {
    fs.readFile(fsPath + reqPath + '.redirect', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.statusCode = 303
      res.setHeader('Location', data.trim())
      res.end()
    })
  }

  function redirectWithoutTrailingSlash(cb) {
    fs.access(fsPath + reqPath, err => {
      if (!err) return cb(false)
      cb(true)
      res.statusCode = 303
      res.setHeader('Location', reqPath.substr(0, reqPath.length - 1))
      res.end()
    })
  }

}).listen(port, host, () => console.log(`Listening on ${host}:${port}`))


function accumulateContent(reqPath, res, cb) {
  fs.readdir(fsPath + reqPath, (err, files) => {
    if (err) {
      res.statusCode = 404
      res.end('404')
    } else {
      files.sort().reverse()
      const html = cb(files)
      res.end(html)
    }
  })
}

function getFileIndex(reqPath, res) {
  accumulateContent(reqPath, res, (files) => {
    let html = '<ul>'
    for (let i = 0; i < files.length; i++) {
      if (files[i] !== '.no-index' && files[i] !== '.squash') {
        let fileName = files[i]
        const removeIndexes = ['.md', '.html', '.redirect']
        for (const removeIndex of removeIndexes) {
          if (fileName.endsWith(removeIndex)) {
            fileName = fileName.slice(0, -removeIndex.length)
          }
        }
        html += `<li><a href="${reqPath}${fileName}">${fileName}</a></li>`
      }
    }
    html += '</ul>'
    return render(html)
  })
}

function getSquash(reqPath, res) {
  accumulateContent(reqPath, res, (files) => {
    let squashed = ''
    for (let i = 0; i < files.length; i++) {
      squashed += fs.readFileSync(fsPath + reqPath + '/' + files[i], 'utf8')
    }
    return marked(squashed)
  })
}

async function getFileMetadata(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return reject(err)

      const firsth1Match = data.match(/^#\s*([^\n]*)/m)
      const name = path.basename(filePath).slice(0, -3)
      let title
      if (firsth1Match && firsth1Match.length > 0) {
        title = firsth1Match[1]
      } else {
        title = name
      }

      const metaDataMatch = data.match(/^\<\!\-\-([\s\S]*?)\-\-\>/)
      if (metaDataMatch && metaDataMatch.length === 2) {
        try {
          metaData = JSON.parse(metaDataMatch[1])
          if (!metaData.title) metaData.title = title
          metaData.name = name
          return resolve(metaData)
        } finally {}
      }
      resolve({ title, name })
    })
  })
}
