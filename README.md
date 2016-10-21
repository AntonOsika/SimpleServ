# Lightweight Markdown Server


## Usage

Start server

    node index.js <path-to-pages> <port> <host>

Render markdown to stdout

    node render.js <path-md-file>


## Features

- Markdown parsing is done on the server on each request.
  - This is good, no manual recompiles; edit the `.md` file and thats it!
  - However, caching would be nice. On the other hand, a more performant solution is to serve the compiled files from a static host (such as [GitHub Pages](https://pages.github.com/)).
- LaTeX style mathematics.
  - Uses MathJax by default, easily swapable for KaTeX etc.
  - Unlike most markdown parsers, this one is tweaked to not mess up the math.
- Smart urls.
  - Strip file extension.
  - If url ends with slash, look for `index.md`.
  - If url ends with slash and no `index.md` is present, show directory listing. Disable this by creating a file `.no-index` in that directory.
  - If url does not end with slash, and points to a directory, append slash and redirect. However, if a file `.squash` exists in that directory, a squashed view of all files in that directory is shown.
