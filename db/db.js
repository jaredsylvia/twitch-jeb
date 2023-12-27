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
        this.db.run(`CREATE TABLE IF NOT EXISTS viewers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    }
    
    addViewer(username) {
        this.db.run(`INSERT INTO viewers (username) VALUES (?)`, [username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    getViewer(username) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM viewers WHERE username = ?`, [username], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    getAllViewers() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM viewers`, [], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getMostRecentViewer() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM viewers ORDER BY datetime(last_seen) DESC LIMIT 1`, [], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    getFollowers() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM viewers WHERE follower = TRUE`, [], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getMostRecentFollower() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM viewers WHERE follower = TRUE ORDER BY followingSince DESC LIMIT 1`, [], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    getSubscribers() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM viewers WHERE subscribed = TRUE`, [], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getMostRecentSubscriber() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM viewers WHERE subscribed = TRUE ORDER BY subSince DESC LIMIT 1`, [], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            }
            );
        });
    }

    addTimeout(username) {
        this.db.run(`UPDATE viewers SET timeout_count = timeout_count + 1,
        WHERE username = ?`, [username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    addDeletedMessage(username) {
        this.db.run(`UPDATE viewers SET deleted_messages = deleted_messages + 1,
        WHERE username = ?`, [username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
    
    setLastSeen(username) {
        this.db.run(`UPDATE viewers SET last_seen = CURRENT_TIMESTAMP
        WHERE username = ?`, [username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    setFollower(username, follower) {
        this.db.run(`UPDATE viewers SET follower = ?,
        followingSince = CURRENT_TIMESTAMP 
        WHERE username = ?`, [follower, username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    setSubscriber(username, subscribed) {
        this.db.run(`UPDATE viewers SET subscribed = ?,
        subSince = CURRENT_TIMESTAMP 
        WHERE username = ?`, [subscribed, username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    setModerator(username, isMod) {
        this.db.run(`UPDATE viewers SET isMod = ?,
        WHERE username = ?`, [isMod, username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    setVIP(username, isVIP) {
        this.db.run(`UPDATE viewers SET isVIP = ?,
        WHERE username = ?`, [isVIP, username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    setBroadcaster(username, isBroadcaster) {
        this.db.run(`UPDATE viewers SET isBroadcaster = ?,
        WHERE username = ?`, [isBroadcaster, username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
        
    setGiftedSubs(username, giftedSubs) {
        this.db.run(`UPDATE viewers SET giftedSubs = giftedSubs + ?,
        WHERE username = ?`, [giftedSubs, username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    addPoints(username, points) {
        this.db.run(`UPDATE viewers SET points = points + ? 
        WHERE username = ?`, [points, username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    getPoints(username) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT points FROM viewers WHERE username = ?`, [username], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row.points);
            });
        });
    }

    setViewingNow(username, viewing_now) {
        this.db.run(`UPDATE viewers SET viewing_now = ?
        WHERE username = ?`, [viewing_now, username], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
    
    addQuote(quote, author) {
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

           
    }

    getQuote(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM quotes WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    deleteQuote(id) {
        this.db.run(`DELETE FROM quotes WHERE id = ?`, [id], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    addGoal(goal_type, goal) {
        this.db.run(`INSERT INTO goals (goal_type, goal) VALUES (?, ?)`, [goal_type, goal], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
    
    getGoal(goal_type) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM goals WHERE goal_type = ? ORDER BY id DESC LIMIT 1`, [goal_type], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }
  
    addKOTH(kothActive, kothPlayers, kothWinner) {
        this.db.run(`INSERT INTO koth (kothActive, kothPlayers, kothWinner) VALUES (?, ?, ?)`, [kothActive, kothPlayers, kothWinner], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
   
    getKOTH() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM koth ORDER BY id DESC LIMIT 1`, [], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    addCoinFlip(coinflipActive, winningCoin, headsGuesses, tailsGuesses, firstWinner, firstLoser) {
        this.db.run(`INSERT INTO coinflips (coinflipActive, winningCoin, headsGuesses, tailsGuesses, firstWinner, firstLoser) VALUES (?, ?, ?, ?, ?, ?)`, [coinflipActive, winningCoin, headsGuesses, tailsGuesses, firstWinner, firstLoser], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    getCoinflip() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM coinflips ORDER BY id DESC LIMIT 1`, [], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    addRoulette(rouletteActive, roulettePlayers, rouletteWinner, roulettePool) {
        this.db.run(`INSERT INTO roulette (rouletteActive, roulettePlayers, rouletteWinner, roulettePool) VALUES (?, ?, ?, ?)`, [rouletteActive, roulettePlayers, rouletteWinner, roulettePool], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    getRoulette() {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM roulette ORDER BY id DESC LIMIT 1`, [], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    addDisclaimer(name, message) {
        this.db.run(`INSERT INTO disclaimers (name, message) VALUES (?, ?)`, [name, message], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }

    getDisclaimers() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM disclaimers`, [], (err, rows) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getDisclaimer(name) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM disclaimers WHERE name = ?`, [name], (err, row) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                }
                resolve(row);
            });
        });
    }
    
    deleteDisclaimer(name) {
        this.db.run(`DELETE FROM disclaimers WHERE name = ?`, [name], (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }


}

module.exports = Database;