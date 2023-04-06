const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const PORT = 4001;
const password = "password123"

const http = require('http').Server(app);
const cors = require('cors');
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "*"
    }
});
const mysql = require('mysql')
const db = mysql.createPool({
    host: 'sql7.freesqldatabase.com',
    user: 'sql7611538',
    password: 'eqLNXP6Y24',
    database: 'sql7611538'
});
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/api/get_messages', (req, res) => {
    const sqlInsert = "SELECT * FROM messages"
    db.query(sqlInsert, (err, result) => {
        res.send(result)
    })
})

app.post('/api/users/checkUser', (req, res) => {
    const sqlInsert = `SELECT * FROM users WHERE gmail = "${req.body.gmail}" AND pass = "${req.body.password}"`
    console.log(req.body.gmail, req.body.password)
    db.query(sqlInsert, [], (err, data) => {
        console.log(sqlInsert, data)
        if (err) return res.json(err);
        if (data[0] !== undefined) {
            return res.json("Real")
        } else {
            return res.json("Fake")
        }
    })
})

function generateId() {
    const len = 7
    let id = '';
    for (let i = 0; i < len; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
}

app.post('/api/users/signup', (req, res) => {
    const sqlInsert = 'INSERT INTO users (iduser, username, gmail, pass) VALUES (?)'
    const values = [
        generateId(),
        req.body.name,
        req.body.gmail,
        req.body.password
    ]
    console.log(values)
    db.query(sqlInsert, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    })
})

app.post('/api/users/login', (req, res) => {
    const sqlInsert = `SELECT * FROM users WHERE gmail = "${req.body.gmail}" AND pass = "${req.body.password}"`
    console.log(req.body.gmail, req.body.password)
    db.query(sqlInsert, [], (err, data) => {
        console.log(sqlInsert, data)
        if (err) return res.json(err);
        if (data[0] !== undefined) {
            console.log(data[0].username)
            return res.json({stat: "Success", name: data[0].username})
        } else {
            return res.json({stat: "Failed", name: null})
        }
    })
})



socketIO.on('connection', (socket) => {
    console.log(`${socket.id} user just connected!`);

    socket.on('message', (data) => {
        const sqlInsert = "INSERT INTO messages (owner, message) VALUES (?,?)"
        //console.log(message)
        db.query(sqlInsert, [data.name, data.text], (err, result) => {
            if (err) {
                console.log(err)
            } else {
                socketIO.emit('messageResponse', data);
                console.log(result)
            }
        })

    });
    socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data));
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});




http.listen(PORT, 'localhost', () => {
    console.log(`Server listening on ${PORT}`);
});
