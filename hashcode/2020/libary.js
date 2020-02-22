class Library {

	constructor( id, stall = 0, booksPerDay = 0, available = [] ) {

		this.id = id;
		this.stall = stall;
		this.booksPerDay = booksPerDay;
		this.available = available;
		this.wantToSend = [];

		this.sent = [];
	}

	setBooks( books = [], booksScore = [] ) {
		this.available = books.sort( ( b1, b2 ) => booksScore[ b2 ] - booksScore[ b1 ] );

		this.booksScore = 0;

		this.available.forEach( bookId => {
			this.booksScore += booksScore[ bookId ];
		} );

		this.availableBooks = this.available.length;

		this.scorePerDay = this.booksScore / this.booksPerDay;
	}

	getBooksToSend( ignore = [], allBooks = [] ) {
		let books = [];

		this.available.forEach( bookId => {
			if ( ! ignore.includes( bookId ) && books.length < this.booksPerDay && allBooks[ bookId ] >= 0 ) {
				books.push( bookId );
			}
		} );

		this.wantToSend = books;

		return books;
	}

	sendBooks( alsoSend = [] ) {
		this.available = this.available.filter( book => ! this.wantToSend.includes( book ) || ! alsoSend.includes( book ) );

		this.sent = this.sent.concat( this.wantToSend );

		this.wantToSend = [];
	}

	hasBookToSend() {
		return this.available.length > 0;
	}
}

module.exports = Library;
