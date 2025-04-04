document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const statusDisplay = document.getElementById('status');
    const resetButton = document.getElementById('reset');
    
    let board = [];
    let selectedPiece = null;
    let currentPlayer = 'white';
    let gameStatus = 'ongoing';
    let inCheck = false;
    let enPassantTarget = null;
    let castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
    };
    let moveHistory = [];
    
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
        inCheck = false;
        enPassantTarget = null;
        castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        moveHistory = [];
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
                
                // Highlight en passant target square
                if (enPassantTarget && enPassantTarget.row === row && enPassantTarget.col === col) {
                    square.classList.add('en-passant');
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
                const moveSuccess = makeMove(selectedPiece.row, selectedPiece.col, row, col);
                if (moveSuccess) {
                    selectedPiece = null;
                    clearHighlights();
                    if (gameStatus === 'ongoing') {
                        switchPlayer();
                        inCheck = isKingInCheck();
                        updateStatus();
                    }
                }
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
                if (isValidMove(row, col, r, c) && !wouldLeaveKingInCheck(row, col, r, c)) {
                    const index = r * 8 + c;
                    squares[index].classList.add('highlight');
                }
            }
        }
    }
    
    // Check if a move would leave the king in check
    function wouldLeaveKingInCheck(fromRow, fromCol, toRow, toCol) {
        const tempBoard = JSON.parse(JSON.stringify(board));
        const piece = tempBoard[fromRow][fromCol];
        
        // Make the move on the temporary board
        tempBoard[toRow][toCol] = piece;
        tempBoard[fromRow][fromCol] = '';
        
        // Handle en passant capture
        if (piece.toLowerCase() === 'p' && fromCol !== toCol && tempBoard[toRow][toCol] === '') {
            tempBoard[fromRow][toCol] = '';
        }
        
        // Handle castling
        if (piece.toLowerCase() === 'k' && Math.abs(fromCol - toCol) === 2) {
            if (toCol > fromCol) { // Kingside
                tempBoard[toRow][toCol-1] = tempBoard[toRow][7];
                tempBoard[toRow][7] = '';
            } else { // Queenside
                tempBoard[toRow][toCol+1] = tempBoard[toRow][0];
                tempBoard[toRow][0] = '';
            }
        }
        
        // Find the king's position
        const king = currentPlayer === 'white' ? 'K' : 'k';
        let kingPosition = null;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (tempBoard[r][c] === king) {
                    kingPosition = { row: r, col: c };
                    break;
                }
            }
            if (kingPosition) break;
        }
        
        if (!kingPosition) return false;
        
        // Check if any opponent's piece can attack the king
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = tempBoard[r][c];
                if (p && !isCurrentPlayerPiece(p)) {
                    if (isValidMove(r, c, kingPosition.row, kingPosition.col, tempBoard)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
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
    
    // Check if a move is valid (with all rules)
    function isValidMove(fromRow, fromCol, toRow, toCol, customBoard = null) {
        const boardToUse = customBoard || board;
        const piece = boardToUse[fromRow][fromCol].toLowerCase();
        const targetPiece = boardToUse[toRow][toCol];
        
        // Can't capture your own piece
        if (targetPiece && isCurrentPlayerPiece(targetPiece)) {
            return false;
        }
        
        // Check movement rules
        switch (piece) {
            case 'p': // Pawn
                const direction = boardToUse[fromRow][fromCol] === 'P' ? -1 : 1;
                const startRow = boardToUse[fromRow][fromCol] === 'P' ? 6 : 1;
                
                // Move forward one square
                if (fromCol === toCol && !targetPiece) {
                    if (toRow === fromRow + direction) return true;
                    // Initial two-square move
                    if (fromRow === startRow && 
                        toRow === fromRow + 2 * direction && 
                        !boardToUse[fromRow + direction][fromCol] && 
                        !targetPiece) {
                        return true;
                    }
                }
                // Capture diagonally
                if (Math.abs(toCol - fromCol) === 1 && 
                    toRow === fromRow + direction) {
                    // Normal capture
                    if (targetPiece && !isCurrentPlayerPiece(targetPiece)) {
                        return true;
                    }
                    // En passant
                    if (enPassantTarget && 
                        toRow === enPassantTarget.row && 
                        toCol === enPassantTarget.col &&
                        Math.abs(fromRow - enPassantTarget.row) === 1 &&
                        fromCol === enPassantTarget.col) {
                        return true;
                    }
                }
                return false;
                
            case 'r': // Rook
                return (fromRow === toRow || fromCol === toCol) && 
                       isPathClear(fromRow, fromCol, toRow, toCol, boardToUse);
                
            case 'n': // Knight
                return (Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 1) || 
                       (Math.abs(fromRow - toRow) === 1 && Math.abs(fromCol - toCol) === 2);
                
            case 'b': // Bishop
                return Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol) && 
                       isPathClear(fromRow, fromCol, toRow, toCol, boardToUse);
                
            case 'q': // Queen
                return (fromRow === toRow || fromCol === toCol || 
                        Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) && 
                       isPathClear(fromRow, fromCol, toRow, toCol, boardToUse);
                
            case 'k': // King
                // Normal king move
                if (Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1) {
                    return true;
                }
                // Castling
                if (Math.abs(fromCol - toCol) === 2 && fromRow === toRow) {
                    return canCastle(fromRow, fromCol, toCol);
                }
                return false;
                
            default:
                return false;
        }
    }
    
    // Check if castling is allowed
    function canCastle(row, fromCol, toCol) {
        const color = currentPlayer;
        const kingside = toCol > fromCol;
        
        // Check if castling rights exist
        if (!castlingRights[color][kingside ? 'kingside' : 'queenside']) {
            return false;
        }
        
        // Check if squares between king and rook are empty
        const startCol = kingside ? fromCol + 1 : toCol + 1;
        const endCol = kingside ? toCol - 1 : fromCol - 1;
        
        for (let col = startCol; col <= endCol; col++) {
            if (board[row][col] !== '') {
                return false;
            }
        }
        
        // Check if king is in check or would pass through check
        for (let col = Math.min(fromCol, toCol); col <= Math.max(fromCol, toCol); col++) {
            if (wouldLeaveKingInCheck(row, fromCol, row, col)) {
                return false;
            }
        }
        
        return true;
    }
    
    // Check if the path between two squares is clear
    function isPathClear(fromRow, fromCol, toRow, toCol, customBoard = null) {
        const boardToUse = customBoard || board;
        const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
        const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
        
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow || col !== toCol) {
            if (boardToUse[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        
        return true;
    }
    
    // Make a move on the board
    function makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        const isPawn = piece.toLowerCase() === 'p';
        const isKing = piece.toLowerCase() === 'k';
        const isRook = piece.toLowerCase() === 'r';
        
        // Check if capturing a king
        if (board[toRow][toCol].toLowerCase() === 'k') {
            board[toRow][toCol] = board[fromRow][fromCol];
            board[fromRow][fromCol] = '';
            renderBoard();
            gameStatus = 'gameover';
            updateStatus();
            return true;
        }

        // Make a copy of the board for validation
        const tempBoard = JSON.parse(JSON.stringify(board));
        
        // Make the move on the temporary board
        tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
        tempBoard[fromRow][fromCol] = '';
        
        // Handle en passant capture
        if (isPawn && fromCol !== toCol && tempBoard[toRow][toCol] === '') {
            tempBoard[fromRow][toCol] = '';
        }
        
        // Handle castling
        if (isKing && Math.abs(fromCol - toCol) === 2) {
            if (toCol > fromCol) { // Kingside
                tempBoard[toRow][toCol-1] = tempBoard[toRow][7];
                tempBoard[toRow][7] = '';
            } else { // Queenside
                tempBoard[toRow][toCol+1] = tempBoard[toRow][0];
                tempBoard[toRow][0] = '';
            }
        }
        
        // Check if this move would leave the current player in check
        const originalBoard = board;
        board = tempBoard;
        const wouldBeInCheck = isKingInCheck();
        board = originalBoard;
        
        if (wouldBeInCheck) {
            statusDisplay.textContent = "Invalid move - you can't put yourself in check!";
            return false;
        }

        // Execute the actual move
        const moveDetails = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece,
            captured: board[toRow][toCol],
            enPassant: false,
            castling: false,
            promotion: false
        };
        
        // Handle pawn promotion
        if (isPawn && (toRow === 0 || toRow === 7)) {
            const promotionPiece = promptPromotion();
            if (promotionPiece) {
                board[toRow][toCol] = currentPlayer === 'white' ? promotionPiece.toUpperCase() : promotionPiece.toLowerCase();
                moveDetails.promotion = true;
                moveDetails.promotedTo = board[toRow][toCol];
            } else {
                return false; // Promotion was canceled
            }
        } else {
            board[toRow][toCol] = board[fromRow][fromCol];
        }
        
        // Handle en passant capture
        if (isPawn && fromCol !== toCol && board[toRow][toCol] === '') {
            board[fromRow][toCol] = '';
            moveDetails.enPassant = true;
            moveDetails.captured = board[fromRow][toCol];
        }
        
        // Handle castling
        if (isKing && Math.abs(fromCol - toCol) === 2) {
            if (toCol > fromCol) { // Kingside
                board[toRow][toCol-1] = board[toRow][7];
                board[toRow][7] = '';
            } else { // Queenside
                board[toRow][toCol+1] = board[toRow][0];
                board[toRow][0] = '';
            }
            moveDetails.castling = true;
        }
        
        board[fromRow][fromCol] = '';
        
        // Update castling rights
        if (isKing) {
            castlingRights[currentPlayer].kingside = false;
            castlingRights[currentPlayer].queenside = false;
        }
        
        if (isRook) {
            if (fromCol === 0) { // Queenside rook
                castlingRights[currentPlayer].queenside = false;
            } else if (fromCol === 7) { // Kingside rook
                castlingRights[currentPlayer].kingside = false;
            }
        }
        
        // Set en passant target for next move
        enPassantTarget = null;
        if (isPawn && Math.abs(fromRow - toRow) === 2) {
            enPassantTarget = {
                row: fromRow + (toRow - fromRow) / 2,
                col: fromCol
            };
        }
        
        // Add move to history
        moveHistory.push(moveDetails);
        
        renderBoard();
        
        // Check if the opponent is now in check
        switchPlayer();
        inCheck = isKingInCheck();
        switchPlayer();
        
        // Check for game over conditions
        if (isKingCaptured()) {
            gameStatus = 'gameover';
        } else if (isCheckmate()) {
            gameStatus = 'checkmate';
        } else if (isStalemate()) {
            gameStatus = 'stalemate';
        }
        
        updateStatus();
        return true;
    }
    
    // Prompt for pawn promotion choice
    function promptPromotion() {
        // In a real implementation, you'd show a modal or UI element
        // For simplicity, we'll use a prompt here
        const validPieces = ['q', 'r', 'b', 'n'];
        let choice = '';
        
        while (!validPieces.includes(choice)) {
            choice = prompt('Promote pawn to (Q, R, B, N):', 'Q').toLowerCase();
            if (choice === null) return null; // User canceled
        }
        
        return choice;
    }
    
    // Check if the current player's king is in check
    function isKingInCheck() {
        let kingPosition = null;
        const king = currentPlayer === 'white' ? 'K' : 'k';
        
        // Find the king's position
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === king) {
                    kingPosition = { row, col };
                    break;
                }
            }
            if (kingPosition) break;
        }
        
        if (!kingPosition) return false;
        
        // Check if any opponent's piece can attack the king
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && !isCurrentPlayerPiece(piece)) {
                    if (isValidMove(row, col, kingPosition.row, kingPosition.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Check if a king has been captured
    function isKingCaptured() {
        let whiteKingFound = false;
        let blackKingFound = false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece === 'K') whiteKingFound = true;
                if (piece === 'k') blackKingFound = true;
            }
        }
        
        return !whiteKingFound || !blackKingFound;
    }
    
    // Switch the current player
    function switchPlayer() {
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    }
    
    // Update the status display
    function updateStatus() {
        if (gameStatus === 'gameover') {
            const whiteKingFound = board.some(row => row.includes('K'));
            const blackKingFound = board.some(row => row.includes('k'));
            
            if (!whiteKingFound) {
                statusDisplay.textContent = 'Game Over! Black wins by capturing the white king!';
                statusDisplay.className = 'check-warning';
            } else if (!blackKingFound) {
                statusDisplay.textContent = 'Game Over! White wins by capturing the black king!';
                statusDisplay.className = 'check-warning';
            }
        } else if (gameStatus === 'checkmate') {
            statusDisplay.textContent = `Checkmate! ${currentPlayer === 'white' ? 'Black' : 'White'} wins!`;
            statusDisplay.className = 'check-warning';
        } else if (gameStatus === 'stalemate') {
            statusDisplay.textContent = 'Stalemate! Game drawn.';
            statusDisplay.className = '';
        } else {
            let status = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
            if (inCheck) {
                status += " - CHECK!";
                statusDisplay.className = 'check-warning';
            } else {
                statusDisplay.className = '';
            }
            statusDisplay.textContent = status;
        }
    }
    
    // Simplified checkmate detection
    function isCheckmate() {
        // Check if the current player has any valid moves that don't leave them in check
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = board[fromRow][fromCol];
                if (piece && isCurrentPlayerPiece(piece)) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (isValidMove(fromRow, fromCol, toRow, toCol) && 
                                !wouldLeaveKingInCheck(fromRow, fromCol, toRow, toCol)) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        
        // If we get here and the king is in check, it's checkmate
        return inCheck;
    }
    
    // Simplified stalemate detection
    function isStalemate() {
        // Check if the current player has any valid moves that don't leave them in check
        for (let fromRow = 0; fromRow < 8; fromRow++) {
            for (let fromCol = 0; fromCol < 8; fromCol++) {
                const piece = board[fromRow][fromCol];
                if (piece && isCurrentPlayerPiece(piece)) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (isValidMove(fromRow, fromCol, toRow, toCol) && 
                                !wouldLeaveKingInCheck(fromRow, fromCol, toRow, toCol)) {
                                return false;
                            }
                        }
                    }
                }
            }
        }
        
        // If we get here and the king is not in check, it's stalemate
        return !inCheck;
    }
    
    // Reset the game
    resetButton.addEventListener('click', initializeBoard);
    
    // Initialize the game
    initializeBoard();
});