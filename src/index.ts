import * as parse5 from 'parse5';

// Node type alias to work with Parse5's funky/complicated types. 
type Node = (parse5.AST.Default.Element & parse5.AST.Default.Node) | undefined

// Options you pass in.
interface Options {
    lang?: string
    pad?: string
}

// Pad the space above the node (to preserve node's line position in a file).
function padContent (node: Node, pad: string): string {
    if (!node) return ''

    const nodeContent = parse5.serialize(node);
    const nodeLocation = node.__location === undefined ? 0 : node.__location.line;

    let nodePadding = '';

    for (let i = 1; i <= nodeLocation; i++) {
        nodePadding += pad + (i === nodeLocation ? '' : '\r\n');
    }

    return nodePadding + nodeContent;
}

// Get an array of all the nodes (tags).
export function getNodes (input: string): parse5.AST.Node[] {
	const rootNode = parse5.parseFragment(input, { locationInfo: true }) as parse5.AST.Default.DocumentFragment
    
    return rootNode.childNodes
}

// Parse a vue file's contents.
export function parse (input: string, tag: string, options?: Options): string {
    // Set defaults.
    const lang = options ? options.lang : undefined
    const pad = options ? options.pad || '//' : '//'

	// Parse the .vue file nodes (tags) and find a match.
	const node = getNodes(input).find((node: parse5.AST.Default.Element) => {
        const tagFound = tag === node.nodeName
        const tagHasAttrs = ('attrs' in node)
        let langFound = false
        
        if (lang) {
            langFound = tagHasAttrs && node.attrs.find((attr: parse5.AST.Default.Attribute) => {
                return attr.name === 'lang' && attr.value === lang
            }) !== undefined;
        }

		return tagFound && langFound
    }) as Node;
    
	return padContent(node, pad);
}
