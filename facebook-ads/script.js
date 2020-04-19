class Helpers {

	/**
	 * Check if the current node is the one that could contain the sponsored text
	 * @param {HTMLElement|ChildNode} element
	 * @return {boolean}
	 */
	static isSponsoredNode( element ) {
		return element.tagName !== 'A' && ! element.id && element.getAttribute( 'role' ) !== 'presentation';
	}

	/**
	 * Check if the node is visible
	 * @param {HTMLElement|ChildNode} node
	 * @return {boolean}
	 */
	static isNodeVisible( node ) {
		let isVisible = false;

		if ( node.nodeType === Node.ELEMENT_NODE ) {
			const style = getComputedStyle( node );

			isVisible = ! ( style.position === 'absolute' && ( parseInt( style.top ) || parseInt( style.bottom ) ) );
		}

		return isVisible;
	}

	/**
	 * Check if node has only text in it
	 * @param {HTMLElement|ChildNode} node
	 * @return {boolean|boolean}
	 */
	static isNodeOnlyWithText( node ) {
		return node.nodeType === Node.ELEMENT_NODE && node.hasChildNodes() && node.childElementCount === 0 && node.firstChild.nodeType === Node.TEXT_NODE;
	}

	/**
	 * Recursive read of element text
	 * @param {HTMLElement|ChildNode} node
	 * @return {string}
	 */
	static readNodeText( node ) {

		let text = '';

		if ( node.nodeType === Node.ELEMENT_NODE ) {
			if ( node.childElementCount > 0 ) {
				node.childNodes.forEach( childNode => {
					text += Helpers.readNodeText( childNode );
				} )
			} else if ( Helpers.isNodeOnlyWithText( node ) && Helpers.isNodeVisible( node ) ) {
				text += node.innerText;
			}
		}

		return text.trim();
	}

	/**
	 * Return the article from a node that is inside
	 * @param {HTMLElement|ChildNode} node
	 * @return {HTMLElement}
	 */
	static getArticleFromNode( node ) {
		return node.closest( '[role="article"]' );
	}

	/**
	 * Read the title from the current article
	 * @param {HTMLElement|ChildNode} article
	 * @return {string}
	 */
	static getTitleFromArticleNode( article ) {
		const title = article.querySelector( 'h5' );

		return title ? title.innerText : '';
	}

	/**
	 * Return a throttled function by a specific time limit
	 * @param func
	 * @param limit
	 * @return {function(...[*]=)}
	 */
	static throttle( func, limit ) {
		let lastFunc, lastRan;

		return function () {
			const context = this,
				args = arguments

			if ( ! lastRan ) {
				func.apply( context, args )
				lastRan = Date.now()
			} else {
				clearTimeout( lastFunc )
				lastFunc = setTimeout( function () {
					if ( ( Date.now() - lastRan ) >= limit ) {
						func.apply( context, args )
						lastRan = Date.now()
					}
				}, limit - ( Date.now() - lastRan ) )
			}
		}
	}

}

( () => {

	const removeAds = () => {
		document.querySelectorAll( '[data-testid="testid--story-label"]' ).forEach( header => {
			header.childNodes.forEach( headerChildNode => {
				if ( headerChildNode.nodeType === Node.ELEMENT_NODE && Helpers.isSponsoredNode( headerChildNode ) ) {

					if ( Helpers.readNodeText( headerChildNode ) === 'Sponsored' ) {
						const article = Helpers.getArticleFromNode( header ),
							title = Helpers.getTitleFromArticleNode( article );

						if ( title ) {
							console.log( `${title} --- REMOVED` );
						}

						article.remove();
					}
				}
			} );
		} );
	};

	window.addEventListener( 'scroll', Helpers.throttle( removeAds, 4200 ) );
} )();
