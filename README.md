# SimpleServ

*Simple multipurpose HTTP server with Markdown support*

Primarily developed as the server for [viktorqvarfordt.com](http://viktorqvarfordt.com).


## Usage

Start server:

```
node index.js <path-to-pages> <port> <host>
```

You'll need to style your markdown-rendered html (have a look at `template.html`), I use [this](http://viktorqvarfordt.com/assets/styles-md.css) css file.


## Features

- Markdown parsing is done on the server on each request.
  - This is good, no manual recompiles; edit the `.md` file and thats it.
  - Because of this, if you serve many requests, it is probably a good idea to run the server behind a cache proxy.
- Code syntax highlighting.
- LaTeX style mathematics.
  - Uses MathJax by default, easily swapable for KaTeX etc.
  - Unlike most markdown parsers, this one is tweaked to not mess up the math.
- Raw files are served with the proper mime type.
- Smart URLs:
  - Strip file extension when suitable (`.md`, `.html`)
  - 301 redirect all paths to lower case, for consistency and SEO.
  - If the URL ends with slash: Look for `index.md`.
  - If the URL ends with slash and no `index.md` is present: Show directory listing. Disable this by creating a file `.no-index` in that directory.
  - If the URL does not end with slash, and points to a directory: Append slash and redirect. However, if a file `.squash` exists in that directory, a squashed view of all files in that directory is shown, with files sorted alphanumerically (suitable for files starting with a date string).
- Dynamic index: If a folder contains a file `index.md.ejs`, then this file can be programmed with [ejs](https://github.com/mde/ejs), receiving a list of all files in the same directory. [Example](http://viktorqvarfordt.com/blog/index.md.ejs).
- Parsing of file metadata, see the function `getFileMetadata` in the code, for use e.g. in dynamic indexes.


## Todo

### Search

Using [lunr](https://lunrjs.com/) with pre-loaded index of all files, kept in memory. Trigger reload of index by `GET /reload-search-index` and periodically.


### Refactor async

Use native `async/await` rather than [async](https://github.com/caolan/async/).


### LaTeX pass through

https://github.com/chjj/marked/pull/799

https://github.com/chjj/marked/commit/f0fd2644ae96179b3252431e8aaa53d9d5b0ee94


### Something fishy with dollar sign followed by single quote inside code

Having `$'` inside a raw block will break the markdown renderer. Probably a bug in [marked](https://github.com/chjj/marked).

