# Lightweight Markdown Server


## Usage

Start server:

```
node index.js <path-to-pages> <port> <host>
```

Render markdown to stdout:

```
node render.js <path-md-file>
```

Render several files:

```
node build.js <src-dir> <dest-dir>
```


## Features

- Markdown parsing is done on the server on each request.
  - This is good, no manual recompiles; edit the `.md` file and thats it!
  - Caching can be easily implemented if needed.
- LaTeX style mathematics.
  - Uses MathJax by default, easily swapable for KaTeX etc.
  - Unlike most markdown parsers, this one is tweaked to not mess up the math.
- Smart URLs.
  - Strip file extension.
  - If the URL ends with slash: Look for `index.md`.
  - If the URL ends with slash and no `index.md` is present: Show directory listing. Disable this by creating a file `.no-index` in that directory.
  - If the URL does not end with slash, and points to a directory: Append slash and redirect. However, if a file `.squash` exists in that directory, a squashed view of all files in that directory is shown, with files sorted alphanumerically (suitable for files starting with a date string).


## Demo

Syntax highlighting:

```js
function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  })
}

await sleep(1000)
```

Some inline $\pi$ math, and display style
\[ f(a)={\frac {1}{2\pi i}}\oint _{\gamma }{\frac {f(z)}{z-a}}\,dz. \]

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque scelerisque, purus sed vulputate vestibulum, orci justo faucibus quam, at rutrum nulla mauris eu justo. Nullam luctus quam in lorem sagittis placerat. Sed nibh metus, convallis a sagittis sed, venenatis ac ex. Sed ut erat mollis, consequat nisi a, luctus neque. Maecenas sed odio semper, elementum ligula in, sollicitudin odio. In hac habitasse platea dictumst. Aenean luctus, nulla vitae molestie semper, dui felis ultrices dolor, eget venenatis nibh nisl vitae risus. Nulla ut molestie arcu. Suspendisse molestie ex sit amet ex egestas blandit. Phasellus malesuada at urna non auctor. Nulla neque libero, auctor vel urna vel, sodales imperdiet arcu.

Vivamus quis congue leo. Nulla facilisi. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Integer cursus nunc vitae neque tristique viverra. Etiam sapien mi, efficitur vitae viverra id, rhoncus at turpis. Ut quis augue et sapien dictum consectetur ut vel ligula. Maecenas varius facilisis neque sit amet condimentum. Integer porta, risus sit amet accumsan eleifend, augue justo cursus augue, eu pellentesque erat dui venenatis ipsum. Pellentesque vitae purus tellus. Vestibulum cursus pharetra libero accumsan tincidunt. Morbi nec lorem egestas, efficitur felis non, dapibus lorem. Mauris in nisl quis urna tempus pharetra vel sed libero. Aenean finibus sollicitudin lectus eu gravida. Phasellus nunc nisl, dictum vel justo quis, finibus mattis mi. Integer sollicitudin ligula id volutpat finibus.


## Todo

### LaTeX pass through

https://github.com/chjj/marked/pull/799

https://github.com/chjj/marked/commit/f0fd2644ae96179b3252431e8aaa53d9d5b0ee94


### Search

Using [lunr](https://lunrjs.com/) with pre-loaded index of all files, kept in memory. Trigger reload of index by `GET /reload-search-index`.

