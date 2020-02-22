module.exports = ( fileName, order, allLibraries ) => {

	const fs = require( 'fs' );
	let sols = 0;

	let solution = '';

	order.forEach( libraryId => {
		const library = allLibraries.find( lib => lib.id === libraryId );
		if ( library.sent.length ) {
			solution += libraryId + ' ' + library.sent.length + "\n";
			solution += library.sent.join( ' ' ) + "\n";

			sols ++;
		}
	} );

	solution = sols + "\n" + solution;

	fs.writeFile( `./${fileName}.out`, solution, function ( err ) {
		if ( err ) {
			return console.log( err );
		} else {
			console.log( "The file was saved!" );
		}
	} );
};

