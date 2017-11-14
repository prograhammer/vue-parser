import * as parse5 from 'parse5';

// Type alias to work with Parse5's funky types. 
type Node = (parse5.AST.Default.Element & parse5.AST.Default.Node) | undefined

// Options for you.
interface Options {
    lang?: string
    padStr?: string
}

// Pad the space above node with given string (preserves content line position of a file).
function padContent (node: Node, padStr: string): string {
    if (!node) return ''

    const nodeContent = parse5.serialize(node);
    const nodeLocation = node.__location === undefined ? 0 : node.__location.line;

    let nodePadding = '';

    for (let i = 1; i <= nodeLocation; i++) {
        nodePadding += padStr + (i === nodeLocation ? '' : '\r\n');
    }

    return nodePadding + nodeContent;
}

// Get an array of all the nodes (tags).
export function getNodes (input: string): parse5.AST.Default.Element[] {
	const rootNode = parse5.parseFragment(input, { locationInfo: true }) as parse5.AST.Default.DocumentFragment
    
    return rootNode.childNodes as parse5.AST.Default.Element[]
}

// Get the node.
export function getNode (input: string, tag: string, options?: Options): Node {
    // Set defaults.
    const lang = options ? options.lang : undefined

    // Parse the .vue file nodes (tags) and find a match.
	return getNodes(input).find((node: parse5.AST.Default.Element) => {
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
}

// Parse a vue file's contents.
export function parse (input: string, tag: string, options?: Options): string {
    const padStr = options ? options.padStr || '//' : '//'  // <-- Default pads with slashes for comments.   
    const node = getNode(input, tag, options)
    
	return padContent(node, padStr)
}
