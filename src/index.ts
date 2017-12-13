import * as parse5 from 'parse5';

/**
 * Type alias to work with Parse5's funky types. 
 */
export type Node = (parse5.AST.Default.Element & parse5.AST.Default.Node) | undefined

/**
 * Options for you.
 */ 
export interface Options {
    lang?: string | [string]
    padStr?: string
}


/**
 * Parse a vue file's contents. 
 */ 
export function parse (input: string, tag: string, options?: Options): string {
    const node = getNode(input, tag, options)
	return padContent(node, input)
}

/**
 * Pad the space above node with given string (preserves content line position of a file).
 */ 
function padContent (node: Node, originalInput: string): string {
    if (!node || !node.__location) return ''
    
    const nodeContent = originalInput.substring(node.__location.startTag.endOffset, node.__location.endTag.startOffset);
    const preNodeContent = originalInput.substring(0, node.__location.startTag.endOffset);
    const nodeLocation = (preNodeContent.match(new RegExp('\n', 'g')) || []).length + 1;

    const spacePad = Math.floor((node.__location.startTag.endOffset - nodeLocation) / nodeLocation);
    const remainderSlashPad = ((node.__location.startTag.endOffset - nodeLocation) % nodeLocation) + 1
    const slashPadding = createPaddingSlashes(spacePad);
    
    let nodePadding = '';
    
    for (let i = 1; i <= nodeLocation; i++) {
        nodePadding += slashPadding + (i === nodeLocation ? createPaddingSlashes(remainderSlashPad) : '\n');
    }

    return nodePadding + nodeContent;
}

/**
 * Return a string of slashes the size of the given amount.
 */
function createPaddingSlashes(amount: number): string {
    let slashPadding = ''
    for (let x = 0; x < amount; x++) {
        slashPadding += '/';
    }
    return slashPadding;
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

    // Parse the .vue file nodes (tags) and find a match.
	return getNodes(input).find((node: parse5.AST.Default.Element) => {
        const tagFound = tag === node.nodeName
        const tagHasAttrs = ('attrs' in node)
        const langEmpty = lang === undefined
        let langMatch = false;
        
        if (lang) {
            langMatch = tagHasAttrs && node.attrs.find((attr: parse5.AST.Default.Attribute) => {
                return attr.name === 'lang' && Array.isArray(lang)
                    ? lang.indexOf(attr.value) !== -1
                    : attr.value === lang
            }) !== undefined;
        }

		return tagFound && (langEmpty || langMatch)
    }) as Node;
}
