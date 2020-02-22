class Photo {
	constructor( id, type = '' ) {
		this.id = id;
		this.type = type;
		this.tags = {};
		this.used = false;
	}

	hasTag( tag ) {
		return typeof this.tags[ tag ] !== 'undefined';
	}

	addTag( tag ) {
		this.tags[ tag ] = true;
	}

	isV() {
		return this.type === 'V'
	}

	isH() {
		return this.type === 'H';
	}

	isUsed() {
		return this.used;
	}

	use() {
		this.used = true;
	}

	capacity() {
		return this.isH() ? 1 : 0.5;
	}
}

class Tag {
	constructor( name ) {
		this.name = name;
		this.photos = {};
	}

	addPhoto( photo ) {
		this.photos[ photo ] = true;
	}

	hasPhoto( photo ) {
		return typeof this.photos[ photo ] !== 'undefined';
	}

	removePhoto( photo ) {
		delete this.photos( photo );
	}
}

class Slide {
	constructor( photo ) {
		this.photos = [];
		this.capacity = 0;
		this.tags = {};

		if ( photo ) {
			this.addPhoto( photo );
		}
	}

	output() {
		let output = '';

		this.photos.forEach( photo => {
			output += ` ${photo.id}`;
		} );

		return output.trim();
	}

	use() {
		this.photos.forEach( photo => {
			photo.use();
		} );
	}

	addPhoto( photo ) {
		this.photos.push( photo );
		this.capacity += photo.capacity();

		for ( let tag in photo.tags ) {
			this.tags[ tag ] = true;
		}
	}

	hasTag( tag ) {
		return typeof this.tags[ tag ] !== 'undefined';
	}

	isFull() {
		return this.capacity === 1;
	}
}

class HashCode {

	constructor( file ) {
		this.file = file;
		this.photos = [];
		this.tags = [];
		this.score = {};
		this.slides = [];
		this.verticals = [];
		this.improved = 0;
	}

	readFile() {
		let tagIds = {}, tagIndex = 0;
		const fs = require( 'fs' ),
			input = fs.readFileSync( this.file ).toString().split( "\n" ),
			N = parseInt( input[ 0 ] );

		for ( let i = 1; i <= N; i ++ ) {
			const parts = input[ i ].split( ' ' );

			this.photos[ i - 1 ] = new Photo( i - 1, parts[ 0 ] );
			this.score[ i - 1 ] = {};

			let tags = parts.filter( ( value, index ) => index > 1 );

			tags.forEach( tag => {
				if ( typeof tagIds[ tag ] === 'undefined' ) {
					tagIds[ tag ] = tagIndex ++;
				}

				const tagId = tagIds[ tag ];

				if ( typeof this.tags[ tagId ] === 'undefined' ) {
					this.tags[ tagId ] = new Tag( tagId );
				}

				this.tags[ tagId ].addPhoto( i - 1 );
				this.photos[ i - 1 ].addTag( tagId );
			} );

			if ( parts[ 0 ] === 'V' ) {
				this.verticals.push( i - 1 );
			}
		}
	}

	interest( A, B ) {
		const comparePhotos = A instanceof Photo && B instanceof Photo;

		if ( comparePhotos && typeof this.score[ A.id ][ B.id ] !== 'undefined' ) {
			return this.score[ A.id ][ B.id ];
		}

		let inA = 0, inB = 0, inAB = 0;

		for ( let t in A.tags ) {
			if ( B.hasTag( t ) ) {
				inAB ++;
			} else {
				inA ++;
			}
		}

		for ( let t in B.tags ) {
			if ( ! A.hasTag( t ) ) {
				inB ++;
			}
		}

		const min = Math.min( inA, inB, inAB );

		if ( comparePhotos ) {
			this.score[ A.id ][ B.id ] = Math.min( inA, inB, inAB );
			this.score[ B.id ][ A.id ] = this.score[ A.id ][ B.id ];
		}

		return min;
	}

	solve() {
		console.time( 'read' );
		this.readFile();
		console.timeEnd( 'read' );

		console.time( 'order' );
		this.orderSlides();
		console.timeEnd( 'order' );

		console.log( 'improved: ', this.improved );

		this.write();

		this.calcPoints( this.slides );
	}

	/**
	 * Find the next related slide. If nothing is found, null is returned
	 * @param slide
	 * @returns {Object}
	 */
	findNext( slide ) {
		let score = 0, nextSlide = null, interest;

		if ( typeof slide === 'undefined' ) {
			slide = this.slides[ this.slides.length - 1 ];
		}

		let ops = 0;

		for ( let tag in slide.tags ) {
			ops += Object.values( this.tags[ tag ].photos ).length;
			for ( let j in this.tags[ tag ].photos ) {

				const p = this.photos[ j ];

				if ( ! p.isUsed() ) {
					const newSlide = this.createSlide( p );
					interest = this.interest( slide, newSlide );

					if ( interest > score ) {
						score = interest;
						nextSlide = newSlide;
					}
				}
			}
		}
		console.log( '----->', ops );

		return nextSlide;
	}

	/**
	 * Usually we add the slide at the end of the list, but maybe there is a better place.
	 * @param slide
	 * @param improved
	 * @param lookBack
	 */
	insertSlide( slide, improved = false, lookBack = 240 ) {
		let pos = this.slides.length,
			score = 0;

		if ( improved ) {
			const end = this.slides.length > lookBack ? this.slides.length - lookBack : 0;
			for ( let i = this.slides.length - 1; i > end; i -- ) {
				/* new score = the score of the previous slide with the current slide + the score of the slide with the current slide */
				const newScore = this.interest( this.photos[ this.slides[ i - 1 ] ], slide ) + this.interest( slide, this.photos[ this.slides[ i ] ] ),
					/* old score = the score between the current slide and the previous */
					oldScore = this.interest( this.photos[ this.slides[ i - 1 ] ], this.photos[ this.slides[ i ] ] );

				/* if by inserting the slide here we get a better score, then we will do that. but this score has to be better the all the other inserting scores */
				if ( newScore > oldScore && newScore > score ) {
					score = newScore;
					pos = i;
				}
			}
		}

		if ( pos !== this.slides.length ) {
			this.improved ++;
		}

		this.slides.splice( pos, 0, slide );
	}

	orderSlides() {
		let nextSlide, current;

		this.photos.forEach( photo => {
			if ( photo.id % 10000 === 0 ) {
				console.log( `Slides done: ${this.slides.length}` );
			}

			if ( ! photo.isUsed() ) {

				current = this.createSlide( photo );

				if ( current.isFull() ) {
					current.use();

					this.insertSlide( current );

					nextSlide = this.findNext();

					while ( nextSlide ) {
						nextSlide.use();
						this.insertSlide( nextSlide );
						nextSlide = this.findNext();
					}
				}
			}
		} );
	}

	createSlide( photo ) {
		const slide = new Slide( photo );

		if ( ! slide.isFull() ) {
			const newPhoto = this.findAnotherVertical( photo );
			slide.addPhoto( newPhoto );
		}

		return slide;
	}

	findAnotherVertical( photo, improved = false ) {
		let newPhoto = null, best = 0;

		if ( improved ) {
			for ( let id of this.verticals ) {
				if ( id !== photo.id && ! this.photos[ id ].isUsed() ) {
					const s = this.interest( photo, this.photos[ id ] );

					if ( s >= best ) {
						best = s;
						newPhoto = this.photos[ id ];
					}
				}
			}
		} else {
			for ( let id of this.verticals ) {
				if ( id !== photo.id && ! this.photos[ id ].isUsed() ) {
					newPhoto = this.photos[ id ];

					break;
				}
			}
		}

		return newPhoto;
	}

	/**
	 * You only live once.
	 */
	yolo() {

		const shuffle = array => {
			let currentIndex = array.length, temporaryValue, randomIndex;

			/* While there remain elements to shuffle */
			while ( currentIndex > 0 ) {
				// Pick a remaining element...
				randomIndex = Math.floor( Math.random() * currentIndex );
				currentIndex -= 1;

				// And swap it with the current element.
				[ array[ currentIndex ], array[ randomIndex ] ] = [ array[ randomIndex ], array[ currentIndex ] ]
			}

			return array;
		};

		let slide = [], score = 0, best;
		for ( let i = 0; i < this.photos.length; i ++ ) {
			slide[ i ] = i;
		}

		for ( let i = 1; i < 2400; i ++ ) {
			const arr = shuffle( slide );
			let s = 0;

			for ( let j = 0; j < arr.length - 1; j ++ ) {
				s += this.interest( this.photos[ arr[ j ] ], this.photos[ arr[ j + 1 ] ] );
			}

			if ( s > score ) {
				best = arr;
				score = s;
			}
		}

		console.log( 'score: ' + score );

		this.write( best );
	}

	/**
	 * Write the slides into the output file
	 */
	write() {
		const fs = require( 'fs' );

		let output = this.slides.length + "\n";
		this.slides.forEach( slide => {
			output += slide.output() + "\n";
		} );

		fs.writeFile( this.file.replace( './data/', 'result-' ), output, function ( err ) {
			if ( err ) {
				return console.log( err );
			}

			console.log( "The file was saved!" );
		} );
	}

	/**
	 * Calculate the score for the slides
	 * @param slides
	 * @returns {number}
	 */
	calcPoints( slides ) {
		let score = 0;

		for ( let i = 1; i < slides.length; i ++ ) {
			score += this.interest( slides[ i ], slides[ i - 1 ] );
		}

		console.log( `score: ${score}` );

		return score;
	}
}

const files = {
		a: './data/a_example.txt',
		b: './data/b_lovely_landscapes.txt', //203775
		c: './data/c_memorable_moments.txt', //1445
		d: './data/d_pet_pictures.txt', //227907
		e: './data/e_shiny_selfies.txt' //215715
	},
	code = new HashCode( files.d );

code.solve();
