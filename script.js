let pigeonData = JSON.parse(localStorage.getItem('pigeonData')) || [];
let playerTotalTimes = JSON.parse(localStorage.getItem('playerTotalTimes')) || {};  // Ensure this is initialized
let currentDate = document.getElementById('date-select')?.value || '2025-04-02';
let pigeonDataByDate = JSON.parse(localStorage.getItem('pigeonDataByDate')) || {
    '2025-04-02': [],
    '2025-04-04': [],
    '2025-04-06': []
};
let playerTotalTimesByDate = JSON.parse(localStorage.getItem('playerTotalTimesByDate')) || {
    '2025-04-02': {},
    '2025-04-04': {},
    '2025-04-06': {}
};

function switchDate(date) {
    currentDate = date;

    // Create default objects if date doesn't exist yet
    if (!pigeonDataByDate[currentDate]) pigeonDataByDate[currentDate] = [];
    if (!playerTotalTimesByDate[currentDate]) playerTotalTimesByDate[currentDate] = {};

    updatePlayerTimes();
}

function addPigeonTime() {
    let playerName = document.getElementById('player-name').value.trim();
    let landingTime = document.getElementById('landing-time').value;
    let pigeonName = document.getElementById('pigeon-name').value.trim();

    if (!playerName || !landingTime || !pigeonName) {
        alert("Please fill in all fields: player name, pigeon name, and landing time!");
        return;
    }

    let landingDate = new Date('1970-01-01T' + landingTime + 'Z');
    let eightPM = new Date('1970-01-01T20:00:00Z');
    let startTime = new Date('1970-01-01T06:00:00Z');

    if (landingDate > eightPM) {
        alert("Pigeon cannot land after 8 PM. No time awarded.");
        return;
    }

    let pigeonData = pigeonDataByDate[currentDate];
    let playerTotalTimes = playerTotalTimesByDate[currentDate];

    pigeonData.push({ playerName, pigeonName, landingTime, landingDate });
    let playerTotal = playerTotalTimes[playerName] || 0;
    playerTotalTimes[playerName] = playerTotal + (landingDate - startTime) / 60000;

    pigeonDataByDate[currentDate] = pigeonData;
    playerTotalTimesByDate[currentDate] = playerTotalTimes;

    localStorage.setItem('pigeonDataByDate', JSON.stringify(pigeonDataByDate));
    localStorage.setItem('playerTotalTimesByDate', JSON.stringify(playerTotalTimesByDate));

    updatePlayerTimes();
}

function updatePlayerTimes() {
    let gridContainer = document.getElementById('pigeon-grid');
    gridContainer.innerHTML = ''; // Clear previous grid

    let pigeonData = pigeonDataByDate[currentDate];
    let playerTotalTimes = playerTotalTimesByDate[currentDate];

    let allPlayerNames = Object.keys(playerTotalTimes);
    let playerMap = {};

    // Group pigeons by player and limit to 7 pigeons
    allPlayerNames.forEach(playerName => {
        let playerPigeons = pigeonData.filter(data => data.playerName === playerName);
        playerMap[playerName] = playerPigeons.slice(0, 7); // Limit to 7 pigeons per player
    });

    // Find max number of pigeons to know how many pigeon columns needed
    let maxPigeonCount = Math.max(0, ...Object.values(playerMap).map(p => p.length));

    // Create the table
    let table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    table.style.width = '100%';
    table.style.textAlign = 'center';
    table.style.fontFamily = 'Arial, sans-serif';

    // Header row
    let headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th style="border: 1px solid #000; padding: 8px;">Player</th>`;
    for (let i = 0; i < maxPigeonCount; i++) {
        headerRow.innerHTML += `<th style="border: 1px solid #000; padding: 8px;">Pigeon ${i + 1}</th>`;
    }
    headerRow.innerHTML += `<th style="border: 1px solid #000; padding: 8px;">Total Time</th>`;
    table.appendChild(headerRow);

    // Player rows
    allPlayerNames.forEach(player => {
        let row = document.createElement('tr');
        row.innerHTML = `<td style="border: 1px solid #000; padding: 8px;"><strong>${player}</strong></td>`;

        let pigeons = playerMap[player];

        for (let i = 0; i < maxPigeonCount; i++) {
            let cell = document.createElement('td');
            cell.style.border = '1px solid #ccc';
            cell.style.padding = '8px';

            let pigeon = pigeons[i];
            if (pigeon) {
                cell.innerHTML = `"${pigeon.pigeonName}"<br>${pigeon.landingTime} `;

                let deleteBtn = document.createElement('button');
                deleteBtn.textContent = '❌';
                deleteBtn.title = "Remove this pigeon";
                deleteBtn.style.marginLeft = '5px';
                deleteBtn.style.fontSize = '12px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.background = 'transparent';
                deleteBtn.style.border = 'none';
                deleteBtn.style.color = 'red';

                deleteBtn.onclick = () => {
                    if (confirm(`Are you sure you want to remove "${pigeon.pigeonName}" from ${player}'s record?`)) {
                        // ✅ Remove pigeon by matching values, not reference
                        pigeonDataByDate[currentDate] = pigeonDataByDate[currentDate].filter(p =>
                            !(p.playerName === pigeon.playerName && p.pigeonName === pigeon.pigeonName && p.landingTime === pigeon.landingTime)
                        );
                
                        // 🔁 Recalculate total times and refresh
                        recalculatePlayerTimes(currentDate);
                        updatePlayerTimes();
                        calculateWinner();
                    }
                };
                

                cell.appendChild(deleteBtn);
            }

            row.appendChild(cell);
        }

        // Total time for the player
        let totalMinutes = 0;
        pigeons.forEach(pigeon => {
            if (pigeon.landingTime) {
                totalMinutes += convertTimeToMinutes(pigeon.landingTime);
            }
        });

        let hours = Math.floor(totalMinutes / 60);
        let minutes = totalMinutes % 60;

        let totalCell = document.createElement('td');
        totalCell.style.border = '1px solid #000';
        totalCell.style.padding = '8px';
        totalCell.innerHTML = `<strong>${hours}h ${minutes}m</strong>`;
        row.appendChild(totalCell);

        table.appendChild(row);
    });

    gridContainer.appendChild(table);
}

function recalculatePlayerTimes(date) {
    let pigeonData = pigeonDataByDate[date] || [];
    let playerTotalTimes = {};

    pigeonData.forEach(pigeon => {
        if (!playerTotalTimes[pigeon.playerName]) {
            playerTotalTimes[pigeon.playerName] = 0;
        }
        playerTotalTimes[pigeon.playerName] += convertTimeToMinutes(pigeon.landingTime);
    });

    playerTotalTimesByDate[date] = playerTotalTimes;
}
function convertTimeToMinutes(landingTime) {
    // Create a Date object for the start time (6 AM)
    let startTime = new Date('1970-01-01T06:00:00'); // 6 AM

    // Create a Date object for the landing time
    let landingDate = new Date('1970-01-01T' + landingTime);

    // If the landing time is earlier than 6 AM, adjust the date for the next day
    if (landingDate < startTime) {
        landingDate.setDate(landingDate.getDate() + 1);
    }

    // Calculate the difference in minutes between the landing time and the 6 AM start time
    let timeDifference = (landingDate - startTime) / 60000; // Convert milliseconds to minutes

    return timeDifference;
}



function removePigeon(pigeon) {
    let pigeonData = pigeonDataByDate[currentDate];
    let playerTotalTimes = playerTotalTimesByDate[currentDate];

    pigeonData = pigeonData.filter(data => data !== pigeon);
    playerTotalTimes[pigeon.playerName] -= (pigeon.landingDate - new Date('1970-01-01T06:00:00Z')) / 60000;

    pigeonDataByDate[currentDate] = pigeonData;
    playerTotalTimesByDate[currentDate] = playerTotalTimes;

    localStorage.setItem('pigeonDataByDate', JSON.stringify(pigeonDataByDate));
    localStorage.setItem('playerTotalTimesByDate', JSON.stringify(playerTotalTimesByDate));

    updatePlayerTimes();
}

function calculateWinner() {
    let selectedDate = document.getElementById('date-selector').value;
    if (!selectedDate || !pigeonDataByDate[selectedDate] || pigeonDataByDate[selectedDate].length === 0) {
        document.getElementById('reward-info').textContent = "No pigeons recorded for the selected date.";
        return;
    }

    // Get filtered pigeon data for the selected date
    let filteredPigeonData = pigeonDataByDate[selectedDate];

    // --- 1. Calculate Player with Most Hours ---
    let playerTotalTimes = playerTotalTimesByDate[selectedDate];
    let maxPlayer = Object.keys(playerTotalTimes).reduce((a, b) => 
        playerTotalTimes[a] > playerTotalTimes[b] ? a : b
    );
    let totalTime = playerTotalTimes[maxPlayer];
    let hours = Math.floor(totalTime / 60);
    let minutes = totalTime % 60;

    // --- 2. Find First Pigeon for Each Player ---
    let firstPigeonData = {}; // Object to store the first pigeon for each player

    // Sort pigeons for each player by landing time and select the first pigeon
    filteredPigeonData.forEach((pigeon) => {
        // If this is the first pigeon for the player, store it
        if (!firstPigeonData[pigeon.playerName]) {
            firstPigeonData[pigeon.playerName] = pigeon;
        }
    });

    // --- Compare First Pigeons (Find the Latest of the First Pigeons) ---
    let latestFirstPigeonPlayer = Object.keys(firstPigeonData).reduce((latestPlayer, currentPlayer) => {
        let currentFirstPigeonTime = new Date('1970-01-01T' + firstPigeonData[currentPlayer].landingTime + 'Z');
        let latestFirstPigeonTime = new Date('1970-01-01T' + firstPigeonData[latestPlayer].landingTime + 'Z');

        // Compare the first pigeons of each player (latest time)
        if (currentFirstPigeonTime > latestFirstPigeonTime) {
            return currentPlayer;
        }
        return latestPlayer;
    });

    // Get the winning first pigeon info
    let winningFirstPigeon = firstPigeonData[latestFirstPigeonPlayer];
    let winningFirstPigeonName = winningFirstPigeon.pigeonName;
    let winningFirstPigeonTime = winningFirstPigeon.landingTime;

    // --- 3. Find Latest Landed Pigeon Before 8 PM ---
    let latestPigeon = null;
    let eightPM = new Date('1970-01-01T20:00:00Z');
    
    filteredPigeonData.forEach(pigeon => {
        let landingTime = new Date('1970-01-01T' + pigeon.landingTime + 'Z');
        if (landingTime <= eightPM && (!latestPigeon || landingTime > new Date('1970-01-01T' + latestPigeon.landingTime + 'Z'))) {
            latestPigeon = pigeon;
        }
    });

    // --- Display Results ---
    let rewardInfo = document.getElementById('reward-info');
    rewardInfo.innerHTML = `
        <div><strong>1st Winner (Most Hours):</strong> ${maxPlayer} with ${hours}h ${minutes}m</div>
        ${latestFirstPigeonPlayer ? ` 
            <div style="margin-top: 10px;">
                <strong style="color: blue;">Pehla Bahadur:</strong> ${latestFirstPigeonPlayer} 
                <strong style="font-weight: bold; color: #000;">"${winningFirstPigeonName}"</strong> at <strong style="font-weight: bold; color: #000;">${winningFirstPigeonTime}</strong>
            </div>
        ` : '<div style="margin-top: 10px;">No first pigeons found for comparison.</div>'}
        ${latestPigeon ? ` 
            <div style="margin-top: 10px;">
                <strong style="color: green;">Akhri Bahadur:</strong> 
                <strong style="font-weight: bold; color: #000;">"${latestPigeon.pigeonName}"</strong> by 
                <strong style="font-weight: bold; color: #000;">${latestPigeon.playerName}</strong> at 
                <strong style="font-weight: bold; color: #000;">${latestPigeon.landingTime}</strong>
            </div>
        ` : '<div style="margin-top: 10px;">No pigeon landed before 8 PM.</div>'}
    `;
        }


// Function to get the first pigeon landed for a specific player
// Since we already determined the first pigeons in the main function, we do not need this for comparison.


// Function to get the first pigeon landed for a specific player
function getWinningPigeonInfo(playerName, date) {
    // Get all pigeons for the selected player on the specified date
    let playerPigeons = pigeonDataByDate[date].filter(data => data.playerName === playerName);

    // If no pigeons for the player, return "N/A"
    if (playerPigeons.length === 0) {
        return { winningPigeonName: 'N/A', winningPigeonTime: 'N/A' };
    }

    // Sort pigeons by landing time to find the first pigeon that landed
    playerPigeons.sort((a, b) => {
        let timeA = new Date('1970-01-01T' + a.landingTime + 'Z');
        let timeB = new Date('1970-01-01T' + b.landingTime + 'Z');
        return timeA - timeB;  // Sort ascending (earliest first)
    });

    // The first pigeon in the sorted list is the one that landed first
    let firstPigeon = playerPigeons[0];

    // Return the first pigeon’s name and landing time
    return { winningPigeonName: firstPigeon.pigeonName, winningPigeonTime: firstPigeon.landingTime };
}


function clearAllRecords() {
    pigeonDataByDate = {
        '2025-04-02': [],
        '2025-04-04': [],
        '2025-04-06': []
    };
    playerTotalTimesByDate = {
        '2025-04-02': {},
        '2025-04-04': {},
        '2025-04-06': {}
    };
    localStorage.removeItem('pigeonDataByDate');
    localStorage.removeItem('playerTotalTimesByDate');
    updatePlayerTimes();
}

window.onload = function() {
    let dateInput = document.getElementById('date-select');
    
    // Check if the date input exists, otherwise default to July 1
    if (dateInput) {
        // Set default date to July 1 if no date is selected
        if (!dateInput.value) {
            dateInput.value = '2025-04-02';
        }
        currentDate = dateInput.value;
        switchDate(currentDate);  // Load data for the current date
        updatePlayerTimes();
    }
};
function calculateFirstPigeonWinner(selectedDate) {
    // If no date is selected or there are no records for the selected date, show an alert
    if (!selectedDate || !pigeonDataByDate[selectedDate] || pigeonDataByDate[selectedDate].length === 0) {
        document.getElementById('first-pigeon-winner-info').textContent = "No pigeons recorded for the selected date.";
        return;
    }

    // Get all the pigeons for the selected date
    let filteredPigeonData = pigeonDataByDate[selectedDate];

    // --- Find the first pigeons for each player ---
    let firstPigeonData = {};

    filteredPigeonData.forEach((data) => {
        // If player already has a first pigeon, don't update it
        if (!firstPigeonData[data.playerName]) {
            firstPigeonData[data.playerName] = data;
        }
    });

    // --- Find the first pigeon that landed last before 8 PM ---
    let winnerPlayer = Object.keys(firstPigeonData).reduce((latestPlayer, currentPlayer) => {
        let currentFirstPigeonTime = new Date('1970-01-01T' + firstPigeonData[currentPlayer].landingTime + 'Z');
        let latestFirstPigeonTime = new Date('1970-01-01T' + firstPigeonData[latestPlayer].landingTime + 'Z');
        
        // Compare landing times of the first pigeons (before 8:00 PM)
        if (currentFirstPigeonTime > latestFirstPigeonTime && currentFirstPigeonTime.getHours() < 20) {
            return currentPlayer;
        }
        return latestPlayer;
    });

    // Get the landing time of the winner's first pigeon
    let { winningPigeonName, winningPigeonTime } = getWinningPigeonInfo(winnerPlayer, selectedDate);

    // Calculate total time for the winner
    let totalTime = playerTotalTimesByDate[selectedDate][winnerPlayer];
    let hours = Math.floor(totalTime / 60);
    let minutes = Math.round(totalTime % 60);

    // Display the first pigeon winner's result in the new section
    document.getElementById('first-pigeon-winner-info').innerHTML = `
        <strong>Pehla Bahadur:</strong>  
        "${winningPigeonName}" by  ${winnerPlayer} at ${winningPigeonTime}.
    `;
}

function onDateChange() {
    currentDate = document.getElementById('date-selector').value;

    if (!pigeonDataByDate[currentDate]) pigeonDataByDate[currentDate] = [];
    if (!playerTotalTimesByDate[currentDate]) playerTotalTimesByDate[currentDate] = {};

    updatePlayerTimes();   // Show all players + pigeons for the date
    calculateWinner();     // ✅ Show the winner pigeon for the selected date
}
function getWinningPigeonInfo(playerName, date) {
    // Get all pigeons for the selected player on the specified date
    let playerPigeons = pigeonDataByDate[date].filter(data => data.playerName === playerName);

    // If no pigeons for the player, return "N/A"
    if (playerPigeons.length === 0) {
        return { winningPigeonName: 'N/A', winningPigeonTime: 'N/A' };
    }

    // Create a Date object for 8:00 PM (UTC)
    const latestAllowedTime = new Date('1970-01-01T20:00:00Z');

    // Filter pigeons to ensure only those landing before 8:00 PM are considered
    let validPigeons = playerPigeons.filter(pigeon => {
        let pigeonTime = new Date('1970-01-01T' + pigeon.landingTime + 'Z');
        return pigeonTime < latestAllowedTime;
    });

    // If no pigeons land before 8:00 PM, return "N/A"
    if (validPigeons.length === 0) {
        return { winningPigeonName: 'N/A', winningPigeonTime: 'N/A' };
    }

    // Find the pigeon that landed last (latest time)
    let winningPigeon = validPigeons.reduce((latestPigeon, currentPigeon) => {
        let latestTime = new Date('1970-01-01T' + latestPigeon.landingTime + 'Z');
        let currentTime = new Date('1970-01-01T' + currentPigeon.landingTime + 'Z');
        return currentTime > latestTime ? currentPigeon : latestPigeon;
    });

    // Return the winning pigeon name and landing time
    return { winningPigeonName: winningPigeon.pigeonName, winningPigeonTime: winningPigeon.landingTime };
}
function getOverallWinnerPigeon(date) {
    // Get all pigeons from all players for the selected date
    let allPigeons = pigeonDataByDate[date];

    // Create a Date object for 8:00 PM (UTC)
    const latestAllowedTime = new Date('1970-01-01T20:00:00Z');

    // Filter pigeons to ensure only those landing before 8:00 PM are considered
    let validPigeons = allPigeons.filter(pigeon => {
        let pigeonTime = new Date('1970-01-01T' + pigeon.landingTime + 'Z');
        return pigeonTime < latestAllowedTime;
    });

    // If no pigeons land before 8:00 PM, return "N/A"
    if (validPigeons.length === 0) {
        return { winningPigeonName: 'N/A', winningPigeonTime: 'N/A' };
    }

    // Find the pigeon that landed last (latest time)
    let winningPigeon = validPigeons.reduce((latestPigeon, currentPigeon) => {
        let latestTime = new Date('1970-01-01T' + latestPigeon.landingTime + 'Z');
        let currentTime = new Date('1970-01-01T' + currentPigeon.landingTime + 'Z');
        return currentTime > latestTime ? currentPigeon : latestPigeon;
    });

    return { winningPigeonName: winningPigeon.pigeonName, winningPigeonTime: winningPigeon.landingTime };
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("📋 Pigeon Landing Competition Report", pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    let y = 25;

    const pigeonData = pigeonDataByDate[currentDate];
    const playerTotalTimes = playerTotalTimesByDate[currentDate];

    if (!pigeonData || pigeonData.length === 0) {
        doc.text("No data available for the selected date.", 14, y);
        doc.save("pigeon-results.pdf");
        return;
    }

    // Group by player
    const players = Object.keys(playerTotalTimes);
    const pigeonCount = 7; // max pigeons
    const tableHead = ['Player'];

    for (let i = 1; i <= pigeonCount; i++) {
        tableHead.push(`Pigeon ${i}`);
    }
    tableHead.push('Total Time');

    const tableBody = players.map(player => {
        const row = [player];
        const pigeons = pigeonData.filter(p => p.playerName === player);
        for (let i = 0; i < pigeonCount; i++) {
            row.push(pigeons[i] ? pigeons[i].landingTime : '');
        }
        const totalTime = playerTotalTimes[player];
        const h = Math.floor(totalTime / 60);
        const m = totalTime % 60;
        row.push(`${h}h ${m}m`);
        return row;
    });

    doc.autoTable({
        head: [tableHead],
        body: tableBody,
        startY: y,
        theme: 'grid',
        styles: { halign: 'center' },
        headStyles: { fillColor: [100, 149, 237], textColor: 255 }, // Cornflower blue
    });

    let finalY = doc.previousAutoTable.finalY + 10;

    // WINNER INFO
    let winner = players.reduce((a, b) => playerTotalTimes[a] > playerTotalTimes[b] ? a : b);
    let totalMin = playerTotalTimes[winner];
    let winH = Math.floor(totalMin / 60);
    let winM = totalMin % 60;

    // Pehla Bahadur (latest of all first pigeons)
    const firstPigeons = {};
    pigeonData.forEach(p => {
        if (!firstPigeons[p.playerName]) {
            firstPigeons[p.playerName] = p;
        }
    });

    let pehlaBahadurPlayer = Object.keys(firstPigeons).reduce((latest, curr) => {
        const currTime = new Date('1970-01-01T' + firstPigeons[curr].landingTime + 'Z');
        const latestTime = new Date('1970-01-01T' + firstPigeons[latest].landingTime + 'Z');
        return currTime > latestTime ? curr : latest;
    });
    const pehlaBahadur = firstPigeons[pehlaBahadurPlayer];

    // Akhri Bahadur (latest pigeon before 8 PM)
    let akhriBahadur = null;
    const eightPM = new Date('1970-01-01T20:00:00Z');
    pigeonData.forEach(p => {
        const landTime = new Date('1970-01-01T' + p.landingTime + 'Z');
        if (landTime <= eightPM && (!akhriBahadur || landTime > new Date('1970-01-01T' + akhriBahadur.landingTime + 'Z'))) {
            akhriBahadur = p;
        }
    });

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(" Highlights", 14, finalY);

    doc.setFontSize(11);
    finalY += 8;
    doc.text(` Winner of the Day: ${winner} (${winH}h ${winM}m)`, 14, finalY);

    if (pehlaBahadur) {
        finalY += 7;
        doc.text(` Pehla Bahadur: "${pehlaBahadur.pigeonName}" by ${pehlaBahadurPlayer} at ${pehlaBahadur.landingTime}`, 14, finalY);
    }

    if (akhriBahadur) {
        finalY += 7;
        doc.text(` Akhri Bahadur: "${akhriBahadur.pigeonName}" by ${akhriBahadur.playerName} at ${akhriBahadur.landingTime}`, 14, finalY);
    }

    doc.save("pigeon-competition-results.pdf");
}

window.onload = function () {
    currentDate = document.getElementById('date-selector').value; // Make sure currentDate is set
    updatePlayerTimes();  // Load player records on page load
};



function calculateFinalWinner() {
    const allDates = ['2025-04-02', '2025-04-04', '2025-04-06'];
    const allPlayersTotalTimes = {};
    const dailyWinnersTable = document.getElementById('daily-winners-table').getElementsByTagName('tbody')[0];
    const totalTimesTable = document.getElementById('total-times-table').getElementsByTagName('tbody')[0];
    
    dailyWinnersTable.innerHTML = '';
    totalTimesTable.innerHTML = '';

    allDates.forEach(date => {
        const pigeonData = pigeonDataByDate[date] || [];
        const playerTotalTimes = playerTotalTimesByDate[date] || {};

        // Filter pigeons that landed before 8:00 PM
        const pigeonsBefore8pm = pigeonData.filter(p => {
            const landing = new Date(p.landingDate);
            const cutoff = new Date(`${date}T20:00:00`);
            return landing <= cutoff;
        });

        if (pigeonsBefore8pm.length === 0) return;

        // Find the pigeon that landed the latest (just before 8 PM)
        let lastPigeon = pigeonsBefore8pm.reduce((latest, current) => {
            return new Date(current.landingDate) > new Date(latest.landingDate) ? current : latest;
        });

        // Add row to daily winner table
        const row = dailyWinnersTable.insertRow();
        row.insertCell(0).textContent = date;
        row.insertCell(1).textContent = lastPigeon.playerName;
        row.insertCell(2).textContent = lastPigeon.pigeonName;
        row.insertCell(3).textContent = lastPigeon.landingTime;

        // Accumulate total player time across all dates
        for (let player in playerTotalTimes) {
            allPlayersTotalTimes[player] = (allPlayersTotalTimes[player] || 0) + playerTotalTimes[player];
        }
    });

    // Identify player with the most total time
    let finalWinner = Object.keys(allPlayersTotalTimes).reduce((maxPlayer, currentPlayer) => {
        return allPlayersTotalTimes[currentPlayer] > allPlayersTotalTimes[maxPlayer] ? currentPlayer : maxPlayer;
    });

    // Build the total time table
    for (let player in allPlayersTotalTimes) {
        let row = totalTimesTable.insertRow();
        let totalMinutes = allPlayersTotalTimes[player];
        let hours = Math.floor(totalMinutes / 60);
        let minutes = Math.round(totalMinutes % 60);
        row.insertCell(0).textContent = player;
        row.insertCell(1).textContent = `${hours}h ${minutes}m`;
        let winnerCell = row.insertCell(2);
        if (player === finalWinner) {
            winnerCell.textContent = "Winner!";
            winnerCell.style.color = "red";
            winnerCell.style.fontWeight = "bold";
        } else {
            winnerCell.textContent = "";
        }
    }

    document.getElementById('final-winner-info').style.display = 'block';
}

function downloadFinalResultPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);

    doc.text("Pigeon Landing Competition - Final Results", 10, 10);
    let yPosition = 20;

    // Add Daily Winners Table
    doc.setFontSize(12);
    doc.text("Daily Winners:", 10, yPosition);
    yPosition += 10;

    // Add Table for Daily Winners
    const dailyWinnersTable = document.getElementById('daily-winners-table').getElementsByTagName('tbody')[0];
    if (dailyWinnersTable.rows.length > 0) {
        doc.setDrawColor(0);
        doc.setFillColor(240, 240, 240); // Light gray fill
        doc.rect(10, yPosition, 180, 10, 'FD'); // Header row
        doc.text("Date", 12, yPosition + 7);
        doc.text("Winner", 70, yPosition + 7);
        doc.text("Time", 130, yPosition + 7);
        yPosition += 12;

        Array.from(dailyWinnersTable.rows).forEach((row, index) => {
            doc.setDrawColor(180); // Row border color
            doc.setFillColor(255, 255, 255); // White fill for rows
            doc.rect(10, yPosition, 180, 10, 'FD');
            doc.text(row.cells[0].textContent, 12, yPosition + 7); // Date
            doc.text(row.cells[1].textContent, 70, yPosition + 7); // Winner
            doc.text(row.cells[2].textContent, 130, yPosition + 7); // Time
            yPosition += 12;
        });
    } else {
        doc.text("No daily winners data available.", 10, yPosition);
        yPosition += 10;
    }

    // Add Total Times Table
    doc.text("Final:", 10, yPosition);
    yPosition += 10;
   

    // Add Table for Total Times
    const totalTimesTable = document.getElementById('total-times-table').getElementsByTagName('tbody')[0];
    if (totalTimesTable.rows.length > 0) {
        doc.setDrawColor(0);
        doc.setFillColor(240, 240, 240); // Light gray fill
        doc.rect(10, yPosition, 180, 10, 'FD'); // Header row
        doc.text("Player", 12, yPosition + 7);
        doc.text("Total Time", 70, yPosition + 7);
        doc.text("Winner", 130, yPosition + 7);
        yPosition += 12;

        Array.from(totalTimesTable.rows).forEach((row, index) => {
            doc.setDrawColor(180); // Row border color
            doc.setFillColor(255, 255, 255); // White fill for rows
            doc.rect(10, yPosition, 180, 10, 'FD');
            doc.text(row.cells[0].textContent, 12, yPosition + 7); // Player
            doc.text(row.cells[1].textContent, 70, yPosition + 7); // Total Time
            doc.text(row.cells[2].textContent, 130, yPosition + 7); // Winner (highlighted)
            yPosition += 12;
        });
    } else {
        doc.text("No total times data available.", 10, yPosition);
        yPosition += 10;
    }

    // Save the PDF
    doc.save("Pigeon_Competition_Final_Results.pdf");
}function changeLanguage() {
    let language = document.getElementById('language-selector').value;

    // Translate text to Urdu or English based on selection
    if (language === 'ur') {
        document.getElementById('title').textContent = "گلوبل کبوتر کھیل ٹورنامنٹ بساکھ 2025 گجر خان";
        document.getElementById('start-time').textContent = "شروع کا وقت: 6:00 صبح";
        document.getElementById('end-time').textContent = "اختتام کا وقت: 8:00 شام";
        document.getElementById('select-date-label').textContent = "تاریخ منتخب کریں:";
        document.getElementById('input-heading').textContent = "کھلاڑی اور کبوتر کی معلومات درج کریں";
        document.getElementById('player-name-label').textContent = "کھلاڑی کا نام:";
        document.getElementById('pigeon-name-label').textContent = "کبوتر کا نام:";
        document.getElementById('landing-time-label').textContent = "کبوتر کا لینڈنگ وقت (HH:mm):";
        document.getElementById('add-pigeon-button').textContent = "کبوتر شامل کریں";
        document.getElementById('calculate-winner-button').textContent = "فاتح کا حساب کریں";
        document.getElementById('clear-all-button').textContent = "تمام ریکارڈ صاف کریں";
        document.getElementById('download-pdf-button').textContent = "نتائج پی ڈی ایف کے طور پر ڈاؤن لوڈ کریں";
        document.getElementById('final-results-heading').textContent = "حتمی نتائج";
        document.getElementById('total-times-heading').textContent = "تمام کھلاڑیوں کا کل وقت:";
        document.getElementById('final-winner-button').textContent = "حتمی فاتح کا حساب کریں";
        document.getElementById('download-final-pdf-button').textContent = "حتمی نتائج پی ڈی ایف کے طور پر ڈاؤن لوڈ کریں";
    } else {
        // Default to English
        document.getElementById('title').textContent = "Global Pigeon Sports Tournament Besakh 2025 Gujar Khan";
        document.getElementById('start-time').textContent = "Start time: 6:00 AM";
        document.getElementById('end-time').textContent = "End time: 8:00 PM";
        document.getElementById('select-date-label').textContent = "Select Date:";
        document.getElementById('input-heading').textContent = "Enter Player and Pigeon Information";
        document.getElementById('player-name-label').textContent = "Player Name:";
        document.getElementById('pigeon-name-label').textContent = "Pigeon Name:";
        document.getElementById('landing-time-label').textContent = "Landing Time (HH:mm):";
        document.getElementById('add-pigeon-button').textContent = "Add Pigeon";
        document.getElementById('calculate-winner-button').textContent = "Calculate Winner";
        document.getElementById('clear-all-button').textContent = "Clear All Records";
        document.getElementById('download-pdf-button').textContent = "Download Results as PDF";
        document.getElementById('final-results-heading').textContent = "Final Results";
        document.getElementById('total-times-heading').textContent = "Total Times for All Players:";
        document.getElementById('final-winner-button').textContent = "Calculate Final Winner";
        document.getElementById('download-final-pdf-button').textContent = "Download Final Results PDF";
    }
}
