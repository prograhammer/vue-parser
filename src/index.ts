import * as parse5 from 'parse5'

/**
 * Type alias to work with Parse5's funky types.
 */
export type Node = (parse5.AST.Default.Element & parse5.AST.Default.Node) | undefined

/**
 * Options for you.
 */
export interface Options {
  lang?: string | [string],
  emptyExport?: boolean // default: true
}

/**
 * Parse a vue file's contents.
 */
export function parse (input: string, tag: string, options?: Options): string {
  const emptyExport = options && options.emptyExport !== undefined ? options.emptyExport : true
  const node = getNode(input, tag, options)
  let parsed = padContent(node, input)

  // Add a default export of empty object if target tag script not found.
  // This fixes a TypeScript issue of "not a module".
  if (!parsed && tag === 'script' && emptyExport) {
    parsed = 'export default {}' + '\n'
  }

  return parsed
}

/**
 * Pad the space above node with slashes (preserves content line/col positions in a file).
 */
function padContent (node: Node, input: string): string {
  if (!node || !node.__location) return ''

  const nodeContent = input.substring(node.__location.startTag.endOffset, node.__location.endTag.startOffset)
  const preNodeContent = input.substring(0, node.__location.startTag.endOffset)
  const nodeLines = (preNodeContent.match(new RegExp('\n', 'g')) || []).length + 1

  let remainingSlashes = preNodeContent.replace(/[\s\S]/gi, '/')
  let nodePadding = ''

  for (let i = 1; i < nodeLines; i++) {
    nodePadding += '//' + '\n'
    remainingSlashes = remainingSlashes.substring(3)
  }

  return nodePadding + remainingSlashes + nodeContent
}

/**
 * Get an array of all the nodes (tags).
 */
export function getNodes (input: string): parse5.AST.Default.Element[] {
  const rootNode = parse5.parseFragment(input, { locationInfo: true }) as parse5.AST.Default.DocumentFragment

  return rootNode.childNodes as parse5.AST.Default.Element[]
}

/**
 * Get the node.
 */
export function getNode (input: string, tag: string, options?: Options): Node {
  // Set defaults.
  const lang = options ? options.lang : undefined

  // Parse the Vue file nodes (tags) and find a match.
  return getNodes(input).find((node: parse5.AST.Default.Element) => {
    const tagFound = tag === node.nodeName
    const tagHasAttrs = ('attrs' in node)
    const langEmpty = lang === undefined
    let langMatch = false

    if (lang) {
      langMatch = tagHasAttrs && node.attrs.find((attr: parse5.AST.Default.Attribute) => {
        return attr.name === 'lang' && Array.isArray(lang)
          ? lang.indexOf(attr.value) !== -1
          : attr.value === lang
      }) !== undefined
    }

	  return tagFound && (langEmpty || langMatch)
  }) as Node
}
