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
    //window.history.pushState(null, '', window.location.href.split('/')[0] + '//' + window.location.href.split('/')[2]);
    loadChessboard();
    setInterval(loadChessboard, 2000); // Refresh the chessboard every 2 seconds

});

// Show History
async function history() {
    try {
        const response = await fetch('http://localhost:5000/history');
        const moveHistory = await response.json();

        if (moveHistory.length === 0) {
            alert('No moves have been made yet.');
            return;
        }

        const modalContent = moveHistory.map((move, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${move.player}</td>
                <td>${move.piece}</td>
                <td>${move.source.row}, ${move.source.col}</td>
                <td>${move.target.row}, ${move.target.col}</td>
                <td>${move.captured || '-'}</td>
            </tr>
        `).join('');

        const modalHTML = `
            <div id="index-history-modal" class="index-modal">
                <div class="index-modal-content">
                    <span class="index-close-button" onclick="closeModal()">×</span>
                    <h2>Move History</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Player</th>
                                <th>Piece</th>
                                <th>Source</th>
                                <th>Target</th>
                                <th>Captured</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${modalContent}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('index-history-modal').style.display = 'block';

    } catch (error) {
        console.error('Error showing history:', error);
    }
}

// Close the modal
function closeModal() {
    const modal = document.getElementById('index-history-modal');
    if (modal) modal.remove();
}

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
async function undo() {
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

        document.getElementById('index-top-info-box').innerText = 'Current Player: ' + current_player.charAt(0).toUpperCase() + current_player.slice(1);

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
                    pieceElement.dataset.piece = piece;

                    if (current_player === 'white' && isFlipped === false) {
                        if (piece === piece.toUpperCase()) pieceElement.draggable = false;
                        if (piece === piece.toLowerCase()) pieceElement.draggable = true;
                    } if (current_player === 'white' && isFlipped === true) {
                        if (piece === piece.toUpperCase()) pieceElement.draggable = false;
                        if (piece === piece.toLowerCase()) pieceElement.draggable = false;
                    } if (current_player === 'black' && isFlipped === false) {
                        if (piece === piece.toUpperCase()) pieceElement.draggable = false;
                        if (piece === piece.toLowerCase()) pieceElement.draggable = false;
                    } if (current_player === 'black' && isFlipped === true) {
                        if (piece === piece.toUpperCase()) pieceElement.draggable = true;
                        if (piece === piece.toLowerCase()) pieceElement.draggable = false;
                    }
                    
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

function togglePromotionModal(target) {
    const modalHTML = `
        <div id="index-history-modal" class="index-modal">
            <div class="index-modal-content">
                <span class="index-close-button" onclick="closePromotionModal()">×</span>
                <h2>Promote Your Pawn</h2>
                <p>Choose a piece to promote your pawn:</p>
                <div class="promotion-options">
                    <button class="index-button" onclick="promotePawn('Q')">Queen</button>
                    <button class="index-button" onclick="promotePawn('R')">Rook</button>
                    <button class="index-button" onclick="promotePawn('B')">Bishop</button>
                    <button class="index-button" onclick="promotePawn('N')">Knight</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('index-history-modal').style.display = 'block';

    console.log(target);
    const modal = document.getElementById('index-history-modal');
    modal.dataset.target = JSON.stringify(target);
}

function closePromotionModal() {
    const modal = document.getElementById('index-history-modal');
    if (modal) modal.remove();
}

function promotePawn(piece) {
    const modal = document.getElementById('index-history-modal');
    const target = JSON.parse(modal.dataset.target);

    // Send move with promotion
    makeMove({ row: target.row - 1, col: target.col }, target, piece);
    closePromotionModal()
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