'use strict'

const fs = require('fs')
const marked = require('./marked-math-support.js')
const mkToc = require('markdown-toc')
const hljs = require('highlight.js')

const templateHtml = fs.readFileSync(__dirname + '/template.html', 'utf8')
let googleAnalyticsScript
try {
  googleAnalyticsScript = fs.readFileSync(__dirname + '/googleAnalyticsScript.html', 'utf8')
} catch (err) {}


// Transform text to URL-friendly text. E.g. "Foo bar" -> "foo-bar".
function slugify(str) {
  return str.toLowerCase()
            .replace(/[^\w]+/g, '-')
            .replace(/-+$/, '')
            .replace(/^-+/, '')
}


// Init marked
const renderer = new marked.Renderer()

renderer.heading = function(text, level, raw) {
  return `<h${level} id="${this.options.headerPrefix + slugify(raw)}">${text}</h${level}>\n`
}

marked.setOptions({
  renderer: renderer,
  langPrefix: '',
  highlight: function (code, lang) {
    if (lang) {
      return hljs.highlight(lang, code).value
    }
    // } else {
    //   return hljs.highlightAuto(code).value
    // }
  }
})

// For marked-math-support
marked.setOptions({
  mathDelimiters: [['$', '$'], ['\\(', '\\)'], ['\\[', '\\]'], ['$$', '$$'], 'beginend']
})


function insertToc(text) {
  const tocRegex = /<!--\s*toc\s*-->/
  const tocMatch = tocRegex.exec(text)
  if (tocMatch) {
    const tocMd = mkToc(text, {
      slugify: slugify
    }).content
    text = text.replace(tocRegex, tocMd)
  }
  return text
}


function insertCustomIncludes(text) {
  let includeMatch
  while (includeMatch = text.match('<<include +([^>]+)>>')) {
    let fileContent = fs.readFileSync(expandTilde(includeMatch[1])).toString()
    text = text.replace(includeMatch[0], () => fileContent) // Use a funciton to avoid $ substitution by replace
  }
  return text
}

function setTitle(text, html) {
  const titleMatch = (/<!--\s*title:\s*(.+?)\s*-->/).exec(text)
  let title
  if (titleMatch) {
    title = titleMatch[1]
  } else {
    const firsth1Match = (/^#\s*([^\n]*)/m).exec(text)
    if (firsth1Match) {
      title = firsth1Match[1]
    }
  }
  html = html.replace('<!-- [title] -->', `<title>${title}</title>`)
  return html
}

function render(text) {
  text = insertToc(text)
  // text = insertCustomIncludes(text)
  let html = templateHtml
  html = setTitle(text, html)

  // Replace &#39; and &#39; back to ' and ", marked messses this up, see https://github.com/chjj/marked/issues/269
  const htmlContent = marked(text).replace(/&#39;/g, "'").replace(/&quot;/, '"')
  html = html.replace('<!-- [content] -->', htmlContent);

  if (googleAnalyticsScript) {
    html = html.replace('  </head>', googleAnalyticsScript + '\n\n  </head>')
  }

  return html
}


module.exports = render

if (!module.parent) {
  const path = process.argv[2]
  if (path) {
    console.log(render(fs.readFileSync(path, 'utf8')))
  } else {
    console.log('Specify file to htmlify')
  }
}





// function md(text, headerShift) {
//   if (headerShift) {
//     var renderer = new marked.Renderer()
//     renderer.heading = function (text, level) {
//       return `<h${level+headerShift}>${text}</h${level+headerShift}>`
//     }
//     return marked(text, { renderer: renderer })
//   }
//   return marked(text)
// }
