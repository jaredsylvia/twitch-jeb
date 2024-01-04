require('dotenv').config();
const sqlite3 = require('sqlite3');

class Database {
    constructor(path) {
        this.db = new sqlite3.Database(path, (err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Connected to database.');
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Closed database connection.');
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            try {
                this.db.run(`CREATE TABLE IF NOT EXISTS viewers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userid INTEGER,
                    username TEXT NOT NULL UNIQUE,
                    points INTEGER DEFAULT 0,
                    follower BOOLEAN DEFAULT FALSE,
                    followingSince DATETIME,
                    subscribed BOOLEAN DEFAULT FALSE,
                    subSince DATETIME,
                    giftedSubs INTEGER DEFAULT 0,
                    isMod BOOLEAN DEFAULT FALSE,
                    isVIP BOOLEAN DEFAULT FALSE,
                    isBroadcaster BOOLEAN DEFAULT FALSE,
                    timeout_count INTEGER DEFAULT 0,
                    deleted_messages INTEGER DEFAULT 0,
                    viewing_now BOOLEAN DEFAULT FALSE,            
                    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS quotes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    quote TEXT NOT NULL UNIQUE,
                    author TEXT NOT NULL,
                    date DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);
                        
                this.db.run(`CREATE TABLE IF NOT EXISTS goals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    goal_type,
                    goal INTEGER DEFAULT 0,
                    date DATETIME DEFAULT CURRENT_TIMESTAMP            
                )`);
                
                this.db.run(`CREATE TABLE IF NOT EXISTS koth (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    kothActive BOOLEAN DEFAULT FALSE,
                    kothPlayers TEXT DEFAULT '',
                    kothWinner TEXT DEFAULT '',
                    date DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS coinflips (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    coinflipActive BOOLEAN DEFAULT FALSE,
                    winningCoin TEXT DEFAULT '',
                    headsGuesses TEXT DEFAULT '',
                    tailsGuesses TEXT DEFAULT '',
                    firstWinner TEXT DEFAULT '',
                    firstLoser TEXT DEFAULT '',
                    date DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS roulette (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    rouletteActive BOOLEAN DEFAULT FALSE,
                    roulettePlayers TEXT DEFAULT '',
                    rouletteWinner TEXT DEFAULT '',
                    roulettePool INTEGER DEFAULT 0,
                    date DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS disclaimers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    message TEXT NOT NULL,
                    date DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                resolve();
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }
    
    addViewer(username) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT INTO viewers (username) VALUES (?)`, [username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getViewer(username) {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM viewers WHERE username = ?`, [username], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(row);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }                
    }

    getAllViewers() {
        try {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM viewers`, [], (err, rows) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(rows);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getMostRecentViewer() {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM viewers ORDER BY datetime(last_seen) DESC LIMIT 1`, [], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(row);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getFollowers() {
        try {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM viewers WHERE follower = TRUE`, [], (err, rows) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(rows);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getMostRecentFollower() {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM viewers WHERE follower = TRUE ORDER BY followingSince DESC LIMIT 1`, [], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(row);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getSubscribers() {
        try {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM viewers WHERE subscribed = TRUE`, [], (err, rows) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(rows);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getMostRecentSubscriber() {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM viewers WHERE subscribed = TRUE ORDER BY subSince DESC LIMIT 1`, [], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(row);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    addTimeout(username) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET timeout_count = timeout_count + 1
                WHERE username = ?`, [username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    addDeletedMessage(username) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET deleted_messages = deleted_messages + 1
                WHERE username = ?`, [username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setLastSeen(username) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET last_seen = CURRENT_TIMESTAMP
                WHERE username = ?`, [username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setFollower(username, follower) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET follower = ?,
                followingSince = CURRENT_TIMESTAMP 
                WHERE username = ?`, [follower, username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setSubscriber(username, subscribed) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET subscribed = ?,
                subSince = CURRENT_TIMESTAMP 
                WHERE username = ?`, [subscribed, username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setModerator(username, isMod) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET isMod = ?
                WHERE username = ?`, [isMod, username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setVIP(username, isVIP) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET isVIP = ?
                WHERE username = ?`, [isVIP, username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setBroadcaster(username, isBroadcaster) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET isBroadcaster = ?
                WHERE username = ?`, [isBroadcaster, username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setGiftedSubs(username, giftedSubs) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET giftedSubs = giftedSubs + ?
                WHERE username = ?`, [giftedSubs, username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setUserID(username, userid) {
        console.log(`Setting userid for ${username} to ${userid}`);
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET userid = ?
                WHERE username = ?`, [userid, username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve(userid);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    addPoints(username, points) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`UPDATE viewers SET points = points + ?
                WHERE username = ?`, [points, username], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getPoints(username) {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT points FROM viewers WHERE username = ?`, [username], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                        return;
                    }
    
                    if (row && row.points !== undefined) {
                        resolve(row.points);
                    } else {
                        // Username not found or points not defined
                        resolve(0); 
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    setViewingNow(username, viewing_now) {
        try {
            return new Promise((resolve, reject) => {
                try {
                    this.db.run(`UPDATE viewers SET viewing_now = ?
                    WHERE username = ?`, [viewing_now, username], (err) => {
                        if (err) {
                            console.error(err.message);
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                } catch (err) {
                    console.log(err);
                    reject(err);
                }
                });
            } catch (err) {
                console.log(err);
                return Promise.reject(err);
            }
    }
    
    addQuote(quote, author) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT INTO quotes (quote, author) VALUES (?, ?)`, [quote, author], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    //find quote id and return it
                    this.db.get(`SELECT id FROM quotes WHERE quote = ?`, [quote], (err, row) => {
                        if (err) {
                            console.error(err.message);
                            reject(err);
                        }
                        resolve(row.id);
                    });
                    
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }  
    }

    getQuote(id) {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM quotes WHERE id = ?`, [id], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(row);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }        
    }

    deleteQuote(id) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`DELETE FROM quotes WHERE id = ?`, [id], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }        
    }

    addGoal(goal_type, goal) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT INTO goals (goal_type, goal) VALUES (?, ?)`, [goal_type, goal], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }
    
    getGoal(goal_type) {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM goals WHERE goal_type = ? ORDER BY id DESC LIMIT 1`, [goal_type], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    }
                    resolve(row);
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }
  
    addKOTH(kothActive, kothPlayers, kothWinner) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT INTO koth (kothActive, kothPlayers, kothWinner) VALUES (?, ?, ?)`, [kothActive, kothPlayers, kothWinner], (err) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }
   
    getKOTH() {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM koth ORDER BY id DESC LIMIT 1`, [], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    addCoinFlip(coinflipActive, winningCoin, headsGuesses, tailsGuesses, firstWinner, firstLoser) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT INTO coinflips (coinflipActive, winningCoin, headsGuesses, tailsGuesses, firstWinner, firstLoser) VALUES (?, ?, ?, ?, ?, ?)`, [coinflipActive, winningCoin, headsGuesses, tailsGuesses, firstWinner, firstLoser], (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getCoinflip() {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM coinflips ORDER BY id DESC LIMIT 1`, [], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    addRoulette(rouletteActive, roulettePlayers, rouletteWinner, roulettePool) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT INTO roulette (rouletteActive, roulettePlayers, rouletteWinner, roulettePool) VALUES (?, ?, ?, ?)`, [rouletteActive, roulettePlayers, rouletteWinner, roulettePool], (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getRoulette() {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM roulette ORDER BY id DESC LIMIT 1`, [], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    addDisclaimer(name, message) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`INSERT INTO disclaimers (name, message) VALUES (?, ?)`, [name, message], (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getDisclaimers() {
        try {
            return new Promise((resolve, reject) => {
                this.db.all(`SELECT * FROM disclaimers`, [], (err, rows) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }                    
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    getDisclaimer(name) {
        try {
            return new Promise((resolve, reject) => {
                this.db.get(`SELECT * FROM disclaimers WHERE name = ?`, [name], (err, row) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                    resolve(row);
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }
    
    deleteDisclaimer(name) {
        try {
            return new Promise((resolve, reject) => {
                this.db.run(`DELETE FROM disclaimers WHERE name = ?`, [name], (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return Promise.reject(err);
        }
    }


}

module.exports = Database;