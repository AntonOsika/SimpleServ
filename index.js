'use strict'

const fs = require('fs')
const http = require('http')
const render = require('./render.js')
const marked = require('./marked-math-support.js')
const mimes = require('./mimes.js')
const async = require('async')

if (!process.argv[2]) process.argv[2] = '.'
const fsPath = process.argv[2][0] === '/' ? process.argv[2] : process.cwd() + '/' + process.argv[2]
const port = process.argv[3] || 8000
const host = process.argv[4] || ''


http.createServer((req, res) => {

  const path = decodeURI(req.url)

  if (path[path.length - 1] !== '/') {
    async.series([getRaw, getMd, getHtml, getRedirect, getSquashed, get404])
  } else {
    async.series([redirectWithoutTrailingSlash, getIndexMd, getIndexHtml, getListing, get404])
  }

  function getMd(cb) {
    fs.readFile(fsPath + path + '.md', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', 'text/html; charset=utf-8')
      res.end(render(data))
    })
  }

  function getHtml(cb) {
    fs.readFile(fsPath + path + '.html', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', 'text/html; charset=utf-8')
      res.end(data)
    })
  }

  function getRaw(cb) {
    fs.readFile(fsPath + path, (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', mimes.getMime(path) + '; charset=utf-8')
      res.end(data)
    })
  }

  function getSquashed(cb) {
    fs.stat(fsPath + path, (err, stats) => {
      if (err || !stats.isDirectory()) {
        res.statusCode = 404
        return res.end('404')
      }
      fs.stat(fsPath + path + '/.squash', (err, stats) => {
        if (err) {
          res.statusCode = 303
          res.setHeader('Location', path + '/')
          res.end()
        } else {
          getSquash(path, res)
        }
      })
    })
  }

  function getIndexMd(cb) {
    fs.readFile(fsPath + path + 'index.md', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', 'text/html; charset=utf-8')
      res.end(render(data))
    })
  }

  function getIndexHtml(cb) {
    fs.readFile(fsPath + path + 'index.html', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.setHeader('content-Type', 'text/html; charset=utf-8')
      res.end(data)
    })
  }

  function getListing(cb) {
    fs.access(fsPath + path + '.no-index', err => {
      if (err) {
        cb(true)
        getFileIndex(path, res)
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
    fs.readFile(fsPath + path + '.redirect', 'utf8', (err, data) => {
      if (err) return cb(false)
      cb(true)
      res.statusCode = 303
      res.setHeader('Location', data.trim())
      res.end()
    })
  }

  function redirectWithoutTrailingSlash(cb) {
    fs.access(fsPath + path, err => {
      if (!err) return cb(false)
      cb(true)
      res.statusCode = 303
      res.setHeader('Location', path.substr(0, path.length - 1))
      res.end()
    })
  }

}).listen(port, host, () => console.log(`Listening on ${host}:${port}`))


function accumulateContent(path, res, cb) {
  fs.readdir(fsPath + path, (err, files) => {
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

function getFileIndex(path, res) {
  accumulateContent(path, res, (files) => {
    let html = '<ul>'
    for (let i = 0; i < files.length; i++) {
      if (files[i] !== '.no-index' && files[i] !== '.squash') {
        let fileName = files[i]
        if (fileName.substr(-3) === '.md') {
          fileName = fileName.slice(0, -3)
        }
        html += `<li><a href="${path}${fileName}">${fileName}</a></li>`
      }
    }
    html += '</ul>'
    return render(html)
  })
}

function getSquash(path, res) {
  accumulateContent(path, res, (files) => {
    let squashed = ''
    for (let i = 0; i < files.length; i++) {
      squashed += fs.readFileSync(fsPath + path + '/' + files[i], 'utf8')
    }
    return marked(squashed)
  })
}
