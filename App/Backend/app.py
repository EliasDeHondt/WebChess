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

chessboard_state = copy.deepcopy(initial_state)
current_player = 'white'
move_history = []

@app.route('/history', methods=['GET'])
def get_move_history():
    return jsonify(move_history)

@app.route('/reset', methods=['POST'])
def reset_chessboard():
    global chessboard_state, current_player, move_history
    chessboard_state = copy.deepcopy(initial_state)
    current_player = 'white'
    move_history = []
    return jsonify({'status': 'success', 'chessboard': chessboard_state, 'current_player': current_player})

@app.route('/undo', methods=['POST'])
def undo_move():
    global move_history, current_player
    if not move_history:
        return jsonify({'status': 'failure', 'message': 'No moves to undo'}), 400

    last_move = move_history.pop()

    source = last_move['source']
    target = last_move['target']
    piece = last_move['piece']
    captured = last_move['captured']

    chessboard_state[int(source['row'])][int(source['col'])] = piece
    chessboard_state[int(target['row'])][int(target['col'])] = captured

    current_player = 'white' if current_player == 'black' else 'black'

    return jsonify({'status': 'success', 'chessboard': chessboard_state, 'current_player': current_player})

@app.route('/chessboard', methods=['GET'])
def get_chessboard():
    return jsonify({'chessboard': chessboard_state, 'current_player': current_player})

@app.route('/move', methods=['POST'])
def move_piece():
    global move_history, current_player
    data = request.get_json()
    source = data['source']
    target = data['target']
    piece = data['piece']

    if is_valid_move(source, target, piece):
        if piece in ('k', 'K') and abs(int(target['col']) - int(source['col'])) == 2:
            # Handle castling move
            row = int(source['row'])
            rook_col = 0 if int(target['col']) < int(source['col']) else 7
            rook_target_col = 3 if int(target['col']) < int(source['col']) else 5

            # Move the rook
            chessboard_state[row][rook_target_col] = chessboard_state[row][rook_col]
            chessboard_state[row][rook_col] = ""

        target_piece = chessboard_state[int(target['row'])][int(target['col'])]

        move_history.append({
            'player': current_player,
            'source': source,
            'target': target,
            'piece': piece,
            'captured': target_piece
        })

        # Check for promotion
        if piece.lower() == 'p' and int(target['row']) in (0, 7):
            return jsonify({'status': 'promotion', 'target': target})

        if target_piece != "":
            chessboard_state[int(target['row'])][int(target['col'])] = ""

        chessboard_state[int(target['row'])][int(target['col'])] = piece
        chessboard_state[int(source['row'])][int(source['col'])] = ""

        # Check for king-in-check
        king_in_check = check_king_in_check()

        current_player = 'white' if current_player == 'black' else 'black'

        return jsonify({'status': 'success', 'chessboard': chessboard_state, 'current_player': current_player, 'king_in_check': king_in_check})
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

    # Validate castling
    if piece in ('k', 'K') and abs(col_diff) == 2:
        return is_castling(source, target, piece)

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


rook_moved = {
    'white': {'kingside': False, 'queenside': False},
    'black': {'kingside': False, 'queenside': False},
}

def is_rook_castling_eligible(row, rook_col):
    global move_history
    rook_piece = chessboard_state[row][rook_col]
    if rook_piece not in ('r', 'R'):
        return False
    
    # Check if rook has moved by examining the move history
    for move in move_history:
        if (
            int(move['source']['row']) == row
            and int(move['source']['col']) == rook_col
        ):
            return False
    return True

def check_king_in_check():
    global chessboard_state
    king_positions = {'white': None, 'black': None}

    # Locate kings
    for row in range(8):
        for col in range(8):
            piece = chessboard_state[row][col]
            if piece == 'K':
                king_positions['white'] = {'row': row, 'col': col}
            elif piece == 'k':
                king_positions['black'] = {'row': row, 'col': col}

    for color, position in king_positions.items():
        opponent_color = 'black' if color == 'white' else 'white'
        if position and is_square_attacked(position, opponent_color):
            return color
    return None

def is_square_attacked(position, opponent_color):
    for row in range(8):
        for col in range(8):
            piece = chessboard_state[row][col]
            if piece == "" or (piece.islower() and opponent_color == 'white') or (piece.isupper() and opponent_color == 'black'):
                continue
            if is_valid_move({'row': row, 'col': col}, position, piece):
                return True
    return False

def is_castling(source, target, piece):
    if piece not in ('k', 'K'):
        return False

    row = int(source['row'])
    col_diff = int(target['col']) - int(source['col'])

    # Castling requires a 2-square horizontal move
    if abs(col_diff) != 2:
        return False

    rook_col = 0 if col_diff < 0 else 7

    # Check if the rook is eligible for castling
    if not is_rook_castling_eligible(row, rook_col):
        return False

    # Check if the path between king and rook is clear
    if not is_path_clear(source, {'row': source['row'], 'col': rook_col}):
        return False

    # Ensure the king is not in check and does not move through a square under attack
    if check_king_in_check():  # Use check_king_in_check to check if the king is in check
        return False
    return True



def handle_pawn_move(source, target, piece):
    row_diff = int(target['row']) - int(source['row'])
    col_diff = int(target['col']) - int(source['col'])

    direction = -1 if piece.islower() else 1
    start_row = 6 if piece.islower() else 1
    last_row = 0 if piece.islower() else 7

    # Normal move
    if row_diff == direction and col_diff == 0 and chessboard_state[int(target['row'])][int(target['col'])] == "":
        return True

    # Double step
    if (
        row_diff == 2 * direction
        and col_diff == 0
        and int(source['row']) == start_row
        and chessboard_state[int(target['row'])][int(target['col'])] == ""
        and chessboard_state[int(source['row']) + direction][int(source['col'])] == ""
    ):
        return True

    # Capture move
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

    # En passant
    if (
        abs(col_diff) == 1
        and row_diff == direction
        and chessboard_state[int(target['row'])][int(target['col'])] == ""
        and move_history
        and move_history[-1]['piece'].lower() == 'p'
        and abs(int(move_history[-1]['source']['row']) - int(move_history[-1]['target']['row'])) == 2
        and move_history[-1]['target']['row'] == str(int(source['row']))
        and move_history[-1]['target']['col'] == str(int(target['col']))
    ):
        # Remove the captured pawn
        captured_pawn_row = int(source['row'])
        captured_pawn_col = int(target['col'])
        chessboard_state[captured_pawn_row][captured_pawn_col] = ""
        return True

    return False

@app.route('/promote', methods=['POST'])
def promote_pawn():
    global chessboard_state
    data = request.get_json()
    target = data['target']
    new_piece = data['piece']

    if new_piece not in ('q', 'r', 'b', 'n', 'Q', 'R', 'B', 'N'):
        return jsonify({'status': 'invalid_promotion'}), 400

    row = int(target['row'])
    col = int(target['col'])
    if chessboard_state[row][col] not in ('p', 'P') or (row != 0 and row != 7):
        return jsonify({'status': 'invalid_promotion'}), 400

    chessboard_state[row][col] = new_piece
    return jsonify({'status': 'success', 'chessboard': chessboard_state})

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