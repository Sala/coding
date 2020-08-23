<?php

/**
 * Plugin Name: Chess API
 * Plugin URI: https://salagean.dev
 * Description: Chess Api
 * Author URI: https://salagean.dev
 * Version: 2.3.0
 * Text Domain: chess-api
 */

define( 'CHESS_API_NAMESPACE', 'chess-api' );
define( 'CHESS_GAME_TYPE', 'chess-game' );

add_action( 'rest_api_init', 'chess_api_init' );

function chess_api_init() {

	register_rest_route( CHESS_API_NAMESPACE, '/reset',
		[
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'remove_all_games',
				'permission_callback' => '__return_true',
			],
		]
	);

	register_rest_route( CHESS_API_NAMESPACE, '/game',
		[
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'chess_api_read_all_games',
				'permission_callback' => '__return_true',
			],
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => 'chess_api_create_game',
				'permission_callback' => '__return_true',
			],
		]
	);

	register_rest_route( CHESS_API_NAMESPACE, '/game/(?P<id>[\d]+)', [
		[
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'chess_api_read_game',
			'permission_callback' => '__return_true',
		],
		[
			'methods'             => WP_REST_Server::EDITABLE,
			'callback'            => 'chess_api_update_game',
			'permission_callback' => '__return_true',
		],
	] );
}

/**
 * Read all games
 *
 * @param WP_REST_Request $request data about the request
 *
 * @return WP_Error|WP_REST_Response
 */
function chess_api_read_all_games( $request ) {

	$games = get_posts( [
			'posts_per_page' => - 1,
			'post_type'      => CHESS_GAME_TYPE,

		]
	);

	return new WP_REST_Response( $games, 200 );
}

/**
 * Create game
 *
 * @param WP_REST_Request $request data about the request
 *
 * @return WP_Error|WP_REST_Response
 */
function chess_api_create_game( $request ) {

	$name = $request->get_param( 'name' );

	if ( ! empty( $name ) ) {
		$id = wp_insert_post( [
			'post_title'  => $name,
			'post_type'   => CHESS_GAME_TYPE,
			'post_status' => 'publish',
		] );

		update_post_meta( $id, 'is_chess_game', true );

		$response = new WP_REST_Response( get_post( $id ), 200 );
	} else {
		$response = new WP_REST_Response( 'No name specified', 400 );
	}

	return $response;
}

/**
 * Read game
 *
 * @param WP_REST_Request $request data about the request
 *
 * @return WP_Error|WP_REST_Response
 */
function chess_api_read_game( $request ) {

	$game_id = $request->get_param( 'id' );

	$game        = get_post( $game_id );
	$game->moves = get_post_meta( $game_id, 'game_moves', true );

	return new WP_REST_Response( $game, 200 );
}


/**
 * Update game
 *
 * @param WP_REST_Request $request data about the request
 *
 * @return WP_Error|WP_REST_Response
 */
function chess_api_update_game( $request ) {

	$game_id = $request->get_param( 'id' );
	$move    = $request->get_param( 'move' );
	$reset   = $request->get_param( 'reset' );

	$game = get_post( $game_id );

	if ( ! empty( $game ) ) {

		if ( ! empty( $reset ) ) {
			update_post_meta( $game_id, 'game_moves', [] );
		}

		if ( ! empty( $move ) ) {
			$moves = get_post_meta( $game_id, 'game_moves', true );

			if ( empty( $moves ) ) {
				$moves = [];
			}

			$moves[] = $move;
			update_post_meta( $game_id, 'game_moves', $moves );
		}

	} else {
		$moves = [];
	}

	return new WP_REST_Response( $moves, 200 );
}

/**
 * Remove all games
 *
 * @param WP_REST_Request $request data about the request
 *
 * @return WP_Error|WP_REST_Response
 */
function remove_all_games( $request ) {
	$games = get_posts( [
			'posts_per_page' => - 1,
			'post_type'      => CHESS_GAME_TYPE,
		]
	);

	foreach ( $games as $game ) {
		wp_trash_post( $game->ID );
	}

	return new WP_REST_Response( 'Success', 200 );
}
