//const INPUT = 'a_example';
//const INPUT = 'b_read_on';
//const INPUT = 'c_incunabula';
//const INPUT = 'd_tough_choices';
//const INPUT = 'e_so_many_books';
const INPUT = 'f_libraries_of_the_world';

const BEST_SCORES = {
	'a_example': 21,
	'b_read_on': 5822900,
	'c_incunabula': 5467966,
	'd_tough_choices': 4667585,
	'e_so_many_books': 3117975,
	'f_libraries_of_the_world': 2806707
};

const Library = require( './libary' ),
	writeSolution = require( './write' );

let NR_BOOKS, NR_LIBRARIES, DAYS;
let booksScore = [];
let libraries = [];

const read = ( fileName = '' ) => {
	return new Promise( ( resolve, reject ) => {
		const fs = require( 'fs' ),
			parseLine = line => line.split( ' ' ).map( nr => parseInt( nr ) );

		fs.readFile( `./in/${fileName}.txt`, 'utf8', ( err, contents ) => {
			const lines = contents.split( /\r?\n/ ),
				firstData = parseLine( lines[ 0 ] );

			NR_BOOKS = firstData[ 0 ];
			NR_LIBRARIES = firstData[ 1 ];
			DAYS = firstData[ 2 ];

			booksScore = parseLine( lines[ 1 ] );

			let libIndex = 0;

			while ( libIndex < NR_LIBRARIES ) {
				const data = parseLine( lines[ ( libIndex + 1 ) * 2 ] ),
					currentLib = new Library( libIndex, data[ 1 ], data[ 2 ] );

				currentLib.setBooks( parseLine( lines[ ( libIndex + 1 ) * 2 + 1 ] ), booksScore );

				libraries.push( currentLib );

				libIndex ++;
			}

			resolve( 'Finished Reading' );
		} );
	} )
};

const determineLibraryOrder = ( field = 'registerTime', order = 'ASC', secondField = 'scorePerDay', secondOrder = 'ASC' ) => {
	return Array.from( libraries )
	            .sort( ( library1, library2 ) => {

		            if ( library1[ field ] === library2[ field ] ) {
			            return secondOrder === 'ASC' ? library1[ secondField ] - library2[ secondField ] : library2[ secondField ] - library1[ secondField ]
		            }

		            return order === 'ASC' ? library1[ field ] - library2[ field ] : library2[ field ] - library1[ field ];
	            } )
	            .map( l => l.id );
};

read( INPUT ).then( success => {

	let solutions = [];

	Library.sortingFields.forEach( field => {
		Library.sortingFields.forEach( secondField => {
			if ( field !== secondField ) {
				[ 'ASC', 'DESC' ].forEach( order => {
					[ 'ASC', 'DESC' ].forEach( secondOrder => {
						const solutionLabel = `Order by ${field}:${order} AND ${secondField}:${secondOrder}`;

						console.time( solutionLabel );

						solutions.push( {
							field: field,
							order: order,
							secondField: secondField,
							secondOrder: secondOrder,
							...doSolution( determineLibraryOrder( field, order, secondField, secondOrder ), DAYS )
						} );

						libraries.forEach( library => library.reset() );

						console.timeEnd( solutionLabel );
					} );
				} );
			}
		} );
	} );

	solutions = solutions.sort( ( s1, s2 ) => s2.score - s1.score );

	solutions.forEach( solution => console.log( `${solution.score} --- ${solution.field} --- ${solution.order} --- ${solution.secondField} --- ${solution.secondOrder}` ) );

	const bestSolution = solutions.shift();

	if ( bestSolution.score > BEST_SCORES[ INPUT ] ) {
		console.log( `gg.wp ${bestSolution.score}` );
	} else {
		console.log( `None of the solutions was better than the current high score!` );
	}

	doSolution( determineLibraryOrder( bestSolution.field, bestSolution.order, bestSolution.secondField, bestSolution.secondOrder ), DAYS );
	writeSolution( INPUT, bestSolution.librariesSendingOrder, libraries )
} );

const doSolution = ( order, days ) => {
	let librariesSendingOrder = [],
		/** @type {Library} */
		libraryInSignUp = null,
		librariesThatSend = [],
		bookAvailability = Array( NR_BOOKS ).fill( true );

	while ( days -- ) {
		if ( libraryInSignUp === null && libraries.length ) {
			const libId = order.shift();
			libraryInSignUp = libraries.find( lib => lib.id === libId ); //we can do better
		}
		let booksToSend = [];

		librariesThatSend.forEach( library => {
			booksToSend = booksToSend.concat( library.getBooksToSend( booksToSend, bookAvailability ) );
		} );

		librariesThatSend.forEach( library => {
			library.sendBooks( booksToSend );

			if ( ! library.hasBookToSend() ) {
				librariesThatSend = librariesThatSend.filter( library => ! library.id );
			}
		} );

		booksToSend.forEach( bookId => {
			bookAvailability[ bookId ] = false;
		} );

		if ( libraryInSignUp ) {
			/* another sign up day has passed */
			libraryInSignUp.registerTime --;

			/* if we finish signing */
			if ( libraryInSignUp.registerTime === 0 ) {
				/* next day, this library will start sending */
				librariesThatSend.push( libraryInSignUp );
				/* we need for the solution to know who sent and in what order */
				librariesSendingOrder.push( libraryInSignUp.id );
				/* and we need another library to start signing */
				libraryInSignUp = null;
			}
		}
	}

	return {
		score: solutionScore( librariesSendingOrder ),
		librariesSendingOrder: librariesSendingOrder
	};
};

const solutionScore = ( librariesOrder ) => {
	let score = 0;

	librariesOrder.forEach( libraryId => {
		const lib = libraries.find( l => l.id === libraryId );

		lib.sent.forEach( bookId => {
			score += booksScore[ bookId ];
		} );
	} );

	return score;
};



