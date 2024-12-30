/**
 * @author Elias De Hondt
 * @see https://eliasdh.com
 * @since 01/01/2025
 */

// Content Loader
function loadExternalContent(DivId, url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById(DivId).innerHTML = data;
        });
}

// Load external content
document.addEventListener('DOMContentLoaded', function() {
    loadExternalContent("context-menu", "https://eliasdh.com/assets/includes/context-menu.html");
    loadExternalContent("footer", "https://eliasdh.com/assets/includes/external-footer.html");
    loadChessboard();
    setInterval(loadChessboard, 2000); // Refresh the chessboard every 2 seconds
});

// Reset the chessboard
async function resetChessboard() {
    try {
        const response = await fetch('http://localhost:5000/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();
        if (result.status === 'success') loadChessboard();
        else alert('There is a problem resetting the board.');

    } catch (error) {
        console.error('Error while resetting the board:', error);
    }
}

// Undo the last move
async function Undo() {
    try {
        const response = await fetch('http://localhost:5000/undo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();
        if (result.status === 'success') loadChessboard();
        else alert('There is a problem undoing the move.');

    } catch (error) {
        console.error('Error while undoing the move:', error);
    }
}

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

let isFlipped = localStorage.getItem('isFlipped') === 'true';

function flipBoard() {
    isFlipped = !isFlipped;
    localStorage.setItem('isFlipped', isFlipped);
    updateBoardOrientation();
}

function updateBoardOrientation() {
    const chessboard = document.getElementById('chessboard');
    const rows = Array.from(chessboard.children);

    rows.reverse();
    rows.forEach(row => chessboard.appendChild(row));
}

async function loadChessboard() {
    try {
        const response = await fetch('http://localhost:5000/chessboard');
        const { chessboard: chessboardState, current_player } = await response.json();

        document.getElementById('index-current-player').innerText = current_player.charAt(0).toUpperCase() + current_player.slice(1);

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

                    if (current_player === 'white' && piece === piece.toUpperCase()) pieceElement.draggable = false;
                    if (current_player === 'black' && piece === piece.toLowerCase()) pieceElement.draggable = false;
                    
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
    
    if (isFlipped) updateBoardOrientation();
}

function onDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.dataset.piece);
    event.dataTransfer.setData('source', JSON.stringify({
        row: event.target.parentElement.dataset.row,
        col: event.target.parentElement.dataset.col,
    }));
}

function onDragOver(event) {
    event.preventDefault();
}

function onDrop(event) {
    event.preventDefault();

    let targetElement = event.target;
    if (targetElement.tagName === 'IMG') {
        targetElement = targetElement.parentElement;
    }

    const piece = event.dataTransfer.getData('text/plain');
    const source = JSON.parse(event.dataTransfer.getData('source'));
    const target = {
        row: targetElement.dataset.row,
        col: targetElement.dataset.col,
    };

    makeMove(source, target, piece);
}

async function makeMove(source, target, piece) {
    try {
        const response = await fetch('http://localhost:5000/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source, target, piece }),
        });

        const result = await response.json();

        if (result.status === 'success') {
            if ((piece === 'p' && target.row === 0) || (piece === 'P' && target.row === 7)) {
                // Trigger promotion popup
                togglePromotionPopup(target);
            } else {
                loadChessboard();
            }
        } else {
            alert('Invalid move!');
        }

    } catch (error) {
        console.error('Error making move:', error);
    }
}


function togglePromotionPopup(target) {
    const popup = document.getElementById('promotion-popup');
    popup.style.display = 'block';
    popup.dataset.target = JSON.stringify(target);
}

function promotePawn(piece) {
    const popup = document.getElementById('promotion-popup');
    const target = JSON.parse(popup.dataset.target);

    // Send move with promotion
    makeMove({ row: target.row - 1, col: target.col }, target, piece);

    // Close popup
    popup.style.display = 'none';
}


async function makePromotion(target, piece) {
    try {
        const response = await fetch('http://localhost:5000/promote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target, piece }),
        });

        const result = await response.json();
        if (result.status === 'success') loadChessboard();
    } catch (error) {
        console.error('Error promoting pawn:', error);
    }
}

function highlightKingInCheck() {
    const chessboard = [...document.querySelectorAll('.index-square')];

    chessboard.forEach(square => {
        const piece = square.querySelector('.chess-piece');
        if (piece && piece.dataset.piece === (current_player === 'white' ? 'k' : 'K')) {
            square.classList.add('king-in-check');
        } else {
            square.classList.remove('king-in-check');
        }
    });
}

