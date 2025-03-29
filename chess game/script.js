document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const statusDisplay = document.getElementById('status');
    const resetButton = document.getElementById('reset');
    
    let board = [];
    let selectedPiece = null;
    let currentPlayer = 'white';
    let gameStatus = 'ongoing';
    
    // Initialize the chess board
    function initializeBoard() {
        board = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
        
        currentPlayer = 'white';
        gameStatus = 'ongoing';
        selectedPiece = null;
        renderBoard();
        updateStatus();
    }
    
    // Render the chess board
    function renderBoard() {
        chessboard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = board[row][col];
                if (piece) {
                    square.textContent = getPieceSymbol(piece);
                    square.style.color = piece === piece.toLowerCase() ? 'black' : 'white';
                }
                
                square.addEventListener('click', () => handleSquareClick(row, col));
                chessboard.appendChild(square);
            }
        }
    }
    
    // Get Unicode symbol for a piece
    function getPieceSymbol(piece) {
        const symbols = {
            'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
            'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
        };
        return symbols[piece] || '';
    }
    
    // Handle square clicks
    function handleSquareClick(row, col) {
        if (gameStatus !== 'ongoing') return;
        
        const piece = board[row][col];
        
        // If no piece is selected, select this piece if it's the current player's
        if (!selectedPiece) {
            if (piece && isCurrentPlayerPiece(piece)) {
                selectedPiece = { row, col };
                highlightValidMoves(row, col);
                updateBoardDisplay();
            }
        } 
        // If a piece is already selected
        else {
            // If clicking on the same piece, deselect it
            if (selectedPiece.row === row && selectedPiece.col === col) {
                selectedPiece = null;
                clearHighlights();
                updateBoardDisplay();
                return;
            }
            
            // If clicking on another piece of the same color, select that piece instead
            if (piece && isCurrentPlayerPiece(piece)) {
                selectedPiece = { row, col };
                clearHighlights();
                highlightValidMoves(row, col);
                updateBoardDisplay();
                return;
            }
            
            // Check if the move is valid
            if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
                makeMove(selectedPiece.row, selectedPiece.col, row, col);
                selectedPiece = null;
                clearHighlights();
                switchPlayer();
                updateStatus();
            }
        }
    }
    
    // Check if a piece belongs to the current player
    function isCurrentPlayerPiece(piece) {
        const isWhite = piece === piece.toUpperCase();
        return (currentPlayer === 'white' && isWhite) || (currentPlayer === 'black' && !isWhite);
    }
    
    // Highlight valid moves for a piece
    function highlightValidMoves(row, col) {
        const squares = document.querySelectorAll('.square');
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isValidMove(row, col, r, c)) {
                    const index = r * 8 + c;
                    squares[index].classList.add('highlight');
                }
            }
        }
    }
    
    // Clear all highlights
    function clearHighlights() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('highlight');
        });
    }
    
    // Update the board display (selected piece highlights)
    function updateBoardDisplay() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('selected');
        });
        
        if (selectedPiece) {
            const index = selectedPiece.row * 8 + selectedPiece.col;
            squares[index].classList.add('selected');
        }
    }
    
    // Check if a move is valid (simplified rules)
    function isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol].toLowerCase();
        const targetPiece = board[toRow][toCol];
        
        // Can't capture your own piece
        if (targetPiece && isCurrentPlayerPiece(targetPiece)) {
            return false;
        }
        
        // Simplified movement rules
        switch (piece) {
            case 'p': // Pawn
                const direction = board[fromRow][fromCol] === 'P' ? -1 : 1;
                // Move forward one square
                if (fromCol === toCol && !targetPiece) {
                    if (toRow === fromRow + direction) return true;
                    // Initial two-square move
                    if ((fromRow === 1 || fromRow === 6) && 
                        toRow === fromRow + 2 * direction && 
                        !board[fromRow + direction][fromCol] && 
                        !targetPiece) {
                        return true;
                    }
                }
                // Capture diagonally
                if (Math.abs(toCol - fromCol) === 1 && 
                    toRow === fromRow + direction && 
                    targetPiece && !isCurrentPlayerPiece(targetPiece)) {
                    return true;
                }
                return false;
                
            case 'r': // Rook
                return (fromRow === toRow || fromCol === toCol) && 
                       isPathClear(fromRow, fromCol, toRow, toCol);
                
            case 'n': // Knight
                return (Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 1) || 
                       (Math.abs(fromRow - toRow) === 1 && Math.abs(fromCol - toCol) === 2);
                
            case 'b': // Bishop
                return Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol) && 
                       isPathClear(fromRow, fromCol, toRow, toCol);
                
            case 'q': // Queen
                return (fromRow === toRow || fromCol === toCol || 
                        Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) && 
                       isPathClear(fromRow, fromCol, toRow, toCol);
                
            case 'k': // King
                return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
                
            default:
                return false;
        }
    }
    
    // Check if the path between two squares is clear
    function isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
        const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
        
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow || col !== toCol) {
            if (board[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        
        return true;
    }
    
    // Make a move on the board
    function makeMove(fromRow, fromCol, toRow, toCol) {
        // Check for pawn promotion
        if (board[fromRow][fromCol].toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
            board[toRow][toCol] = currentPlayer === 'white' ? 'Q' : 'q';
        } else {
            board[toRow][toCol] = board[fromRow][fromCol];
        }
        
        board[fromRow][fromCol] = '';
        renderBoard();
        
        // Check for checkmate or stalemate (simplified)
        if (isCheckmate()) {
            gameStatus = 'checkmate';
        } else if (isStalemate()) {
            gameStatus = 'stalemate';
        }
    }
    
    // Switch the current player
    function switchPlayer() {
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    }
    
    // Update the status display
    function updateStatus() {
        if (gameStatus === 'checkmate') {
            statusDisplay.textContent = `Checkmate! ${currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
        } else if (gameStatus === 'stalemate') {
            statusDisplay.textContent = 'Stalemate! Game drawn.';
        } else {
            statusDisplay.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
        }
    }
    
    // Simplified checkmate detection
    function isCheckmate() {
        // In a real game, this would check if the king is in check with no valid moves
        return false;
    }
    
    // Simplified stalemate detection
    function isStalemate() {
        // In a real game, this would check if the current player has no valid moves and is not in check
        return false;
    }
    
    // Reset the game
    resetButton.addEventListener('click', initializeBoard);
    
    // Initialize the game
    initializeBoard();
});