module.exports = ( fileName, librariesOrder, allLibraries ) => {

	const fs = require( 'fs' );
	let nrOfSolutions = 0,
		solution = '';

	librariesOrder.forEach( libraryId => {
		const library = allLibraries.find( lib => lib.id === libraryId );
		if ( library.sent.length ) {
			solution += libraryId + ' ' + library.sent.length + "\n";
			solution += library.sent.join( ' ' ) + "\n";

			nrOfSolutions ++;
		}
	} );

	solution = nrOfSolutions + "\n" + solution;

	fs.writeFile( `./out/${fileName}.out`, solution, function ( err ) {
		if ( err ) {
			return console.log( err );
		} else {
			console.log( "The file was saved!" );
		}
	} );
};

