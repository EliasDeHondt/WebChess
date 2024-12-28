/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2025
 */

// Load external content
document.addEventListener('DOMContentLoaded', function() {
    loadExternalContent("context-menu", "/App/Frontend/assets/includes/context-menu.html");
    loadExternalContent("footer", "https://eliasdh.com/assets/includes/external-footer.html");
    loadChessboard();
});

// Images for the chess pieces
const pieceImages = {
    'R': 'rook-dark.png',
    'N': 'knight-dark.png',
    'B': 'bishop-dark.png',
    'Q': 'queen-dark.png',
    'K': 'king-dark.png',
    'P': 'pawn-dark.png',
    'r': 'rook-light.png',
    'n': 'knight-light.png',
    'b': 'bishop-light.png',
    'q': 'queen-light.png',
    'k': 'king-light.png',
    'p': 'pawn-light.png',
};

/**
 * Loads the chessboard from the server and renders it on the page.
 *
 * @throws {Error}
 *   If there is an error loading the chessboard.
 */
async function loadChessboard() {
    try {
        const response = await fetch('http://localhost:5000/chessboard');
        const chessboardState = await response.json();

        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';

        chessboardState.forEach((row, rowIndex) => {
            row.forEach((piece, colIndex) => {
                const square = document.createElement('div');
                square.classList.add('index-square', (rowIndex + colIndex) % 2 === 0 ? 'index-white' : 'index-black');
                square.dataset.row = rowIndex;
                square.dataset.col = colIndex;

                if (piece) {
                    const pieceElement = document.createElement('img');
                    pieceElement.src = `/App/Frontend/assets/media/images/${pieceImages[piece]}`;
                    pieceElement.alt = piece;
                    pieceElement.classList.add('chess-piece');
                    pieceElement.draggable = true;
                    pieceElement.dataset.piece = piece;

                    pieceElement.addEventListener('dragstart', onDragStart);
                    square.appendChild(pieceElement);
                }

                square.addEventListener('dragover', onDragOver);
                square.addEventListener('drop', onDrop);
                chessboard.appendChild(square);
            });
        });
    } catch (error) {
        console.error('Error loading chessboard:', error);
    }
}

/**
 * Initiates the drag-and-drop operation by setting the data transfer object
 * with the piece being dragged and its source position on the chessboard.
 *
 * @param {DragEvent} event
 *   The dragstart event containing the target element being dragged.
 */
function onDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.dataset.piece);
    event.dataTransfer.setData('source', JSON.stringify({
        row: event.target.parentElement.dataset.row,
        col: event.target.parentElement.dataset.col,
    }));
}

/**
 * Prevents the default action of a dragover event, which is to open a file when
 * it is dropped onto the browser window. This is necessary because we want to
 * handle the drop event ourselves.
 *
 * @param {DragEvent} event
 *   The dragover event.
 */
function onDragOver(event) {
    event.preventDefault();
}

/**
 * Handles the drop event during a drag-and-drop operation.
 *
 * @param {DragEvent} event
 *   The drop event containing information about the source and target of the drag.
 *
 * Prevents the default behavior of the drop event, retrieves the piece being moved
 * and its source position, determines the target position, and initiates a move
 * on the chessboard by calling the makeMove function.
 */
function onDrop(event) {
    event.preventDefault();

    const piece = event.dataTransfer.getData('text/plain');
    const source = JSON.parse(event.dataTransfer.getData('source'));
    const target = {
        row: event.target.dataset.row,
        col: event.target.dataset.col,
    };

    makeMove(source, target, piece);
}

/**
 * Makes a move on the chessboard.
 *
 * @param {{row: number, col: number}} source
 *   The source position of the piece to be moved.
 * @param {{row: number, col: number}} target
 *   The target position of the piece to be moved.
 * @param {string} piece
 *   The piece to be moved.
 *
 * @throws {Error}
 *   If there is an error with the move.
 */
async function makeMove(source, target, piece) {
    try {
        const response = await fetch('http://localhost:5000/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source, target, piece }),
        });

        const result = await response.json();
        if (result.status === 'success') {
            loadChessboard();
        } else {
            alert('Invalid move!');
        }
    } catch (error) {
        console.error('Error making move:', error);
    }
}

/**
 * Resets the chessboard to its initial state by sending a POST request
 * to the backend '/reset' endpoint. If the reset is successful, it reloads
 * the chessboard. Otherwise, it alerts the user about a problem with resetting.
 * Logs an error message if the request fails.
 */
async function resetChessboard() {
    try {
        const response = await fetch('http://localhost:5000/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();
        if (result.status === 'success') {
            loadChessboard();
        } else {
            alert('There is a problem resetting the board.');
        }
    } catch (error) {
        console.error('Error while resetting the board:', error);
    }
}