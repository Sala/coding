//const INPUT = 'a_example';
//const INPUT = 'b_read_on';
//const INPUT = 'c_incunabula';
//const INPUT = 'd_tough_choices';
//const INPUT ='e_so_many_books';
const INPUT = 'f_libraries_of_the_world';

const BEST_SCORES = {
	'a_example': 21,
	'b_read_on': 5822900,
	'c_incunabula': 5467966,
	'd_tough_choices': 4667585,
	'e_so_many_books': 2697524,
	'f_libraries_of_the_world': 2466902
};

const Library = require( './libary' ),
	prepareSolution = require( './out' );

let NR_BOOKS, NR_LIBRARIES, DAYS;
let books = [];
let libraries = [];

const read = ( fileName = '' ) => {
	return new Promise( ( resolve, reject ) => {
		const fs = require( 'fs' ),
			parseLine = line => line.split( ' ' ).map( nr => parseInt( nr ) );

		fs.readFile( fileName, 'utf8', ( err, contents ) => {
			const lines = contents.split( /\r?\n/ ),
				firstData = parseLine( lines[ 0 ] );

			NR_BOOKS = firstData[ 0 ];
			NR_LIBRARIES = firstData[ 1 ];
			DAYS = firstData[ 2 ];

			books = parseLine( lines[ 1 ] );

			let libIndex = 0;

			while ( libIndex < NR_LIBRARIES ) {
				const data = parseLine( lines[ ( libIndex + 1 ) * 2 ] ),
					currentLib = new Library( libIndex, data[ 1 ], data[ 2 ] );

				currentLib.setBooks( parseLine( lines[ ( libIndex + 1 ) * 2 + 1 ] ), books );

				libraries.push( currentLib );

				libIndex ++;
			}

			resolve( 'Finished Reading' );
		} );

	} )
};

let libraryInSignUp = false,
	librariesThatSend = [],
	/* the ones that have sent something */
	librariesSendingBooks = [];

const determineLibraryOrder = () => {

	const field = 'availableBooks',
		order = 'D';

	return libraries
		.sort( ( lib1, lib2 ) => {
			return order === 'A' ? lib1[ field ] - lib2[ field ] : lib2[ field ] - lib1[ field ];
		} )
		.map( l => l.id );
};

read( `${INPUT}.txt` ).then( success => {

	const order = determineLibraryOrder();

	console.time( 'Solution time' );

	while ( DAYS -- ) {
		if ( libraryInSignUp === false && libraries.length ) {
			const libId = order.shift();
			libraryInSignUp = libraries.find( lib => lib.id === libId ); //we can do better
		}
		let booksToSend = [];

		librariesThatSend.forEach( library => {
			booksToSend = booksToSend.concat( library.getBooksToSend( booksToSend, books ) );
		} );

		librariesThatSend.forEach( library => {
			library.sendBooks( booksToSend );

			if ( ! library.hasBookToSend() ) {
				librariesThatSend = librariesThatSend.filter( library => ! library.id );
			}
		} );

		booksToSend.forEach( bookId => {
			books[ bookId ] = books[ bookId ] * ( - 1 );
		} );

		if ( libraryInSignUp ) {
			/* another sign up day has passed */
			libraryInSignUp.stall --;

			/* if we finish signing */
			if ( libraryInSignUp.stall === 0 ) {
				/* next day, this library will start sending */
				librariesThatSend.push( libraryInSignUp );
				/* we need for the solution to know who sent and in what order */
				librariesSendingBooks.push( libraryInSignUp.id );
				/* and we need another library to start signing */
				libraryInSignUp = false;

			}
		}
	}

	const score = solutionScore();

	if ( score > BEST_SCORES[ INPUT ] ) {
		console.log( `gg.wp ${score}` );
		prepareSolution( INPUT, librariesSendingBooks, libraries )
	} else {
		console.log( `CLIK DREAPTA DELET DATEN MORTI MATI NU STAM LA DISCUTI ${score - BEST_SCORES[ INPUT ]}` );
	}

	console.timeEnd('Solution time')
} );

const solutionScore = () => {
	let score = 0;

	librariesSendingBooks.forEach( libraryId => {
		const lib = libraries.find( l => l.id === libraryId );

		lib.sent.forEach( bookId => {
			score += - 1 * books[ bookId ];
		} );
	} );

	return score;
};



