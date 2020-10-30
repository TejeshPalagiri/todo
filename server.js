require('dotenv').config();
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bodyparser = require('body-parser');
const cors = require('cors');
const serveStatic = require('serve-static');
const mongodb = require('mongodb').MongoClient;
const assert = require('assert');
const dbName = "tododocs";
const dbURL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@chatapp.rz0qg.gcp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
let database;
const port = 3000;

mongodb.connect(dbURL, { useUnifiedTopology: true }, (err, conn)=>{
    if(err){
        console.log("Connection failed to database", err);
    } else {
        console.log("Connection Successfull");
        database = conn.db(dbName);
    }
});

const data = ['tejesh', 'charan', 'uma', 'prasanna'];

app.use(cors());
app.use(bodyparser.json());
app.use(express.json());




app.post('/api/login', (req, res)=>{
    const user = {user: "tejesh"};          

    const accessToken = jwt.sign(user, process.env.ACESS_TOKEN_SECRET);
    res.json(accessToken);
});


app.get('/api/data', authtoken, (req, res)=>{
    res.send(data);
});


function authtoken(req, res, next){

    if (!(req.headers['authorization'])) {
        console.log("User Not allowed1");
        return res.status(401).send("Unauthorized request");
      }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    req.token = token;

    if (token === null || token === "null") {
        console.log("User Not allowed2");
        return res.status(401).send("Unauthorized request");
      }

    jwt.verify(token, process.env.ACESS_TOKEN_SECRET, (err, user)=>{
        if (err) {
            console.log("JWT Error", error);
            return res.status(401).send("Unauthorized request");
        } else {
            req.user = user;
            next();
        }
    });

}

app.get('/api',(req, res)=>{
    res.send("Hello");
});

app.get('/api/addtodo', authtoken, (req, res)=>{
    database.collection('tododocs').insertOne({
        "name":123,
        "text": "Hello world check"
    }, (err, result) => {
        if(err){
            console.log("Failed to insert data", err);
        } else {
            console.log("Inserted on  document");
            res.send({
                "message": "document inserted successfully"
            })
        }
    })
});

app.get('/api/gettodo', authtoken, (req, res)=>{
    database.collection('tododocs').find({}).toArray((err, result) => {
        if(err){
            console.log("Failed to get data", err);
        } else {
            console.log(result);
            res.send(result)
        }
    });
})

app.use(serveStatic(__dirname + '/dist/todo'));
app.get("*", function (request, response) {
  response.sendFile(__dirname + "/dist//todo/index.html")
});


app.listen(port, ()=>{
    console.log("Running on port:", port);
})