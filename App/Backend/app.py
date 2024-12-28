############################
# @author Elias De Hondt   #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
from flask import Flask, jsonify, request   # type: ignore
from flask_cors import CORS                 # type: ignore
import copy                                 # type: ignore

app = Flask(__name__)
CORS(app)

initial_state = [
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["r", "n", "b", "q", "k", "b", "n", "r"],
]

chessboard_state =  copy.deepcopy(initial_state)

@app.route('/reset', methods=['POST'])
def reset_chessboard():
    global chessboard_state
    chessboard_state = copy.deepcopy(initial_state)
    return jsonify({'status': 'success', 'chessboard': chessboard_state})

@app.route('/chessboard', methods=['GET'])
def get_chessboard():
    return jsonify(chessboard_state)

@app.route('/move', methods=['POST'])
def move_piece():
    data = request.get_json()
    source = data['source']
    target = data['target']
    piece = data['piece']

    print(f"Source: {source}, Target: {target}, Piece: {piece}")

    if is_valid_move(source, target, piece):
        target_piece = chessboard_state[int(target['row'])][int(target['col'])]
        
        if target_piece != "":
            chessboard_state[int(target['row'])][int(target['col'])] = ""

        chessboard_state[int(target['row'])][int(target['col'])] = piece
        chessboard_state[int(source['row'])][int(source['col'])] = ""

        return jsonify({'status': 'success', 'chessboard': chessboard_state})
    else:
        return jsonify({'status': 'invalid_move'}), 400

def is_valid_move(source, target, piece):
    row_diff = int(target['row']) - int(source['row'])
    col_diff = int(target['col']) - int(source['col'])

    # Target piece to check for ally capture or empty square
    target_piece = chessboard_state[int(target['row'])][int(target['col'])]

    # Ensure the move does not capture an allied piece
    if (piece.islower() and target_piece.islower()) or (piece.isupper() and target_piece.isupper()):
        return False

    # Validate piece-specific movement
    if piece == 'p' or piece == 'P':  # Pawn
        return handle_pawn_move(source, target, piece)
    elif piece == 'n' or piece == 'N':  # Knight
        return abs(row_diff) == 2 and abs(col_diff) == 1 or abs(row_diff) == 1 and abs(col_diff) == 2
    elif piece == 'b' or piece == 'B':  # Bishop
        return abs(row_diff) == abs(col_diff) and is_path_clear(source, target)
    elif piece == 'r' or piece == 'R':  # Rook
        return (row_diff == 0 or col_diff == 0) and is_path_clear(source, target)
    elif piece == 'q' or piece == 'Q':  # Queen
        return (
            (abs(row_diff) == abs(col_diff) or row_diff == 0 or col_diff == 0)
            and is_path_clear(source, target)
        )
    elif piece == 'k' or piece == 'K':  # King
        return max(abs(row_diff), abs(col_diff)) == 1
    return False

def handle_pawn_move(source, target, piece):
    row_diff = int(target['row']) - int(source['row'])
    col_diff = int(target['col']) - int(source['col'])

    # White pawn moves up, black pawn moves down
    direction = -1 if piece.islower() else 1
    start_row = 6 if piece.islower() else 1

    # Normal move (single step forward)
    if row_diff == direction and col_diff == 0 and chessboard_state[int(target['row'])][int(target['col'])] == "":
        return True

    # Double step on the first move
    if (
        row_diff == 2 * direction
        and col_diff == 0
        and int(source['row']) == start_row
        and chessboard_state[int(target['row'])][int(target['col'])] == ""
        and chessboard_state[int(source['row']) + direction][int(source['col'])] == ""
    ):
        return True

    # Capture move (diagonal)
    if (
        row_diff == direction
        and abs(col_diff) == 1
        and chessboard_state[int(target['row'])][int(target['col'])] != ""
        and (
            (piece.islower() and chessboard_state[int(target['row'])][int(target['col'])].isupper()) or
            (piece.isupper() and chessboard_state[int(target['row'])][int(target['col'])].islower())
        )
    ):
        return True
    return False

def is_path_clear(source, target):
    row_diff = int(target['row']) - int(source['row'])
    col_diff = int(target['col']) - int(source['col'])
    row_step = (row_diff // abs(row_diff)) if row_diff != 0 else 0
    col_step = (col_diff // abs(col_diff)) if col_diff != 0 else 0

    current_row = int(source['row']) + row_step
    current_col = int(source['col']) + col_step

    while current_row != int(target['row']) or current_col != int(target['col']):
        if chessboard_state[current_row][current_col] != "":
            return False
        current_row += row_step
        current_col += col_step
    return True

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)