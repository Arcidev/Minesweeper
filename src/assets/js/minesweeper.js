function createMinefield(rows, columns, mines) {
    var minefield = {};
    minefield.rows = [];
    minefield.rowsCount = rows;
    minefield.columnsCount = columns;
    minefield.gameWon = null;
    
    for(var i = 0; i < rows; i++) {
        var row = {};
        row.spots = [];
        
        for(var j = 0; j < columns; j++) {
            var spot = {};
            spot.revealed = false;
            spot.content = "empty";
            spot.hiddenContent = "covered";
            spot.minesCount = 0;
            spot.row = i;
            spot.column = j;
            row.spots.push(spot);
        }
        
        minefield.rows.push(row);
    }
    
    placeMines(minefield, mines);
    calculateNumbers(minefield);
    return minefield;
}

function getSpot(minefield, row, column) {
    return minefield.rows[row].spots[column];
}

function placeRandomMine(minefield) {
    var row = Math.round(Math.random() * (minefield.rowsCount - 1));
    var column = Math.round(Math.random() * (minefield.columnsCount - 1));
    
    var spot = getSpot(minefield, row, column);
    spot.content = "mine";
}

function placeMines(minefield, mines) {
    for(var i = 0; i < mines; i++) {
        placeRandomMine(minefield);
    }
}

function loopNeighbors(minefield, spot, func) {
    for (var i = Math.max(spot.row - 1, 0); i <= Math.min(spot.row + 1, minefield.rowsCount - 1); i++) {
        for (var j = Math.max(spot.column - 1, 0); j <= Math.min(spot.column + 1, minefield.columnsCount - 1); j++) {
            if (i === spot.row && j === spot.column) {
                continue; // Ignore self
            }
            
            var processedSpot = getSpot(minefield, i, j);           
            func(processedSpot);
        }
    }
}

function calculateNumber(minefield, row, column) {
    var thisSpot = getSpot(minefield, row, column);
    
    // If the content is mine then leave it be
    if(thisSpot.content === "mine") {
        return;
    }
    
    var mineCount = 0;
    loopNeighbors(minefield, thisSpot, function(processedSpot) {
        if(processedSpot.content === "mine") {
            mineCount++;
        }
    });

    if(mineCount > 0) {
        thisSpot.content = "number-" + mineCount;
        thisSpot.minesCount = mineCount;
    }
}

function calculateNumbers(minefield) {
    for(var i = 0; i < minefield.rowsCount; i++) {
        for(var j = 0; j < minefield.columnsCount; j++) {
            calculateNumber(minefield, i, j);
        }
    }
}

function hasWon(minefield) {
    for(var y = 0; y < 9; y++) {
        for(var x = 0; x < 9; x++) {
            var spot = getSpot(minefield, y, x);
            if(!spot.revealed && spot.content !== "mine") {
                return false;
            }
        }
    }
    
    return true;
}

function loopUncoveredNeighbors(minefield, spot, func) {
    loopNeighbors(minefield, spot, function(processedSpot) {
        if (processedSpot.revealed) {
            return;
        }

        func(processedSpot);
    })
}

function uncoverSpot(minefield, spot) {
    if (minefield.gameWon !== null || spot.revealed || spot.hiddenContent === "flag-mine") {
        return; // Game is over
    }
    
    spot.revealed = true;
    
    if(spot.content === "mine") {
        minefield.gameWon = false;
        spot.content = "mine-wrong";
        return;
    }
    
    if (spot.content == "empty") {
        var queue = [spot];
        while (queue.length > 0) {
            var s = queue.shift();
            loopUncoveredNeighbors(minefield, s, function(processedSpot) {
                processedSpot.revealed = true;
                if (processedSpot.content === "empty") {
                    queue.push(processedSpot);
                }
            });
        }
    }
    
    if(hasWon(minefield)) {
        minefield.gameWon = true;
    }
}

function rightClick(minefield, spot) {
    if (minefield.gameWon !== null) {
        return;
    }
    
    if (!spot.revealed) {
        if (spot.hiddenContent === "covered") {
            spot.hiddenContent = "flag-mine";
            return;
        }
        
        if (spot.hiddenContent === "flag-mine") {
            spot.hiddenContent = "flag-suspect";
            return;
        }
        
        if (spot.hiddenContent === "flag-suspect") {
            spot.hiddenContent = "covered";
            return;
        }
        
        return;
    }

    doubleClick(minefield, spot);
}

function doubleClick(minefield, spot) {
    if (minefield.gameWon !== null || !spot.revealed || !spot.content.startsWith("number")) {
        return;
    }
    
    var toReveal = [];
    var wrongFlags = [];
    var minesChecked = 0;
    loopUncoveredNeighbors(minefield, spot, function(processedSpot) {
        if (processedSpot.hiddenContent === "flag-mine") {
            minesChecked++;
            if (processedSpot.content !== "mine") {
                wrongFlags.push(processedSpot);
            }
            return;
        }
        toReveal.push(processedSpot);
    });
    
    if (minesChecked >= spot.minesCount) {
        toReveal.forEach(function(item) {
            uncoverSpot(minefield, item);
        });
    }
    
    if (minefield.gameWon === false) {
        wrongFlags.forEach(function(item) {
            item.hiddenContent = "flag-mine-wrong";
        });
    }
}
