class Library {

	static get sortingFields() {
		return [ 'booksPerDay', 'registerTime', 'booksScore', 'scorePerDay', 'availableBooks' ];
	}

	constructor( id, registerTime = 0, booksPerDay = 0, available = [] ) {
		this.id = id;
		this.registerTime = registerTime;
		this.booksPerDay = booksPerDay;
		this.available = available;
		this.wantToSend = [];

		this.sent = [];

		this.backup = {
			registerTime: registerTime
		};
	}

	setBooks( books = [], booksScore = [] ) {
		this.available = books.sort( ( b1, b2 ) => booksScore[ b2 ] - booksScore[ b1 ] );

		this.booksScore = 0;

		this.available.forEach( bookId => {
			this.booksScore += booksScore[ bookId ];
		} );

		this.availableBooks = this.available.length;

		this.scorePerDay = this.booksScore / this.booksPerDay;

		this.backup.available = this.available;
	}

	getBooksToSend( ignore = [], allBooks = [] ) {
		let booksToSend = [];

		this.available.forEach( bookId => {
			if ( booksToSend.length < this.booksPerDay && allBooks[ bookId ] && ! ignore.includes( bookId ) ) {
				booksToSend.push( bookId );
			}
		} );

		this.wantToSend = booksToSend;

		return booksToSend;
	}

	sendBooks( alsoSend = [] ) {
		this.available = this.available.filter( book => ! this.wantToSend.includes( book ) || ! alsoSend.includes( book ) );

		this.sent = this.sent.concat( this.wantToSend );

		this.wantToSend = [];
	}

	hasBookToSend() {
		return this.available.length > 0;
	}

	reset() {
		this.sent = [];
		this.available = Array.from( this.backup.available );
		this.registerTime = this.backup.registerTime;
	}
}

module.exports = Library;
