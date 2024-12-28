############################
# @author Elias De Hondt   #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
from flask import Flask, jsonify, request   # type: ignore
from flask_cors import CORS                 # type: ignore

app = Flask(__name__)
CORS(app)

chessboard_state = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
]

@app.route('/reset', methods=['POST'])
def reset_chessboard():
    """
    Resets the chessboard to its initial state.

    Returns a JSON response with the status code and the initial chessboard state.
    """
    initial_state = [
        ["r", "n", "b", "q", "k", "b", "n", "r"],
        ["p", "p", "p", "p", "p", "p", "p", "p"],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["P", "P", "P", "P", "P", "P", "P", "P"],
        ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ]
    global chessboard_state
    chessboard_state = initial_state
    return jsonify({'status': 'success', 'chessboard': chessboard_state})


@app.route('/chessboard', methods=['GET'])
def get_chessboard():
    """
    Returns the current state of the chessboard as a JSON response.

    Returns a JSON object with the current state of the chessboard, where
    each element is a string representing the piece at the corresponding
    position on the board ('' for an empty space, 'r' for a rook, 'n' for a
    knight, 'b' for a bishop, 'q' for a queen, 'k' for a king, 'p' for a
    pawn, 'R', 'N', 'B', 'Q', 'K', 'P' for the corresponding white pieces).
    """
    return jsonify(chessboard_state)

@app.route('/move', methods=['POST'])
def move_piece():
    """
    Makes a move on the chessboard.

    Expects a JSON object with 'source', 'target', and 'piece' properties.
    'source' and 'target' are dictionaries with 'row' and 'col' properties
    representing the positions on the chessboard.
    'piece' is a string representing the piece to be moved.

    Returns a JSON object with the status of the move and the current state of
    the chessboard. If the move is valid, the status is 'success', otherwise it
    is 'invalid_move' and a 400 status code is returned.
    """
    data = request.get_json()
    source = data['source']
    target = data['target']
    piece = data['piece']

    if is_valid_move(source, target, piece):
        chessboard_state[int(target['row'])][int(target['col'])] = piece
        chessboard_state[int(source['row'])][int(source['col'])] = ""
        return jsonify({'status': 'success', 'chessboard': chessboard_state})
    else:
        return jsonify({'status': 'invalid_move'}), 400

def is_valid_move(source, target, piece):
    """
    Checks if a move is valid according to the chess rules.

    Parameters
    ----------
    source : dict
        A dictionary with 'row' and 'col' properties representing the position on the chessboard where the piece is moved from.
    target : dict
        A dictionary with 'row' and 'col' properties representing the position on the chessboard where the piece is moved to.
    piece : str
        A string representing the piece to be moved.

    Returns
    -------
    bool
        True if the move is valid, False otherwise.
    """

    row_diff = abs(int(target['row']) - int(source['row']))
    col_diff = abs(int(target['col']) - int(source['col']))

    if piece.lower() == 'p':
        if piece.isupper():
            return row_diff == 1 and col_diff == 0 and int(target['row']) < int(source['row'])
        else:
            return row_diff == 1 and col_diff == 0 and int(target['row']) > int(source['row'])
        
    # TODO: Implement the rest of the chess rules! @DenTjorven
    return True

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)