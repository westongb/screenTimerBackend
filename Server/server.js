require('dotenv').config({path:'../.env'});
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { check, validationResult} = require("express-validator/check");
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

var db
var userdb

app.use(cors());
app.use(bodyParser());
app.use(express.static('./Public'))

MongoClient.connect('mongodb+srv://Westongb:Abc123890@mature-masculinity-nteci.mongodb.net/Classes?retryWrites=true&w=majority',{ useUnifiedTopology: true },(err, client)=> {
    if (err) return console.log(err)
    db= client.db('ScreenTimer')
    collection = db.collection("Tasks")
    console.log("Connected to" + collection)
    


    app.get("/tasks/get", (req,res) =>{
        db.collection('Tasks').find({}).toArray(
            function(err, data){
            if (err) {return err}
            else { 
        //   console.log(data)
                res.json(data)
            }})   
    })

    app.post("/UserInfo/new", async (req,res) => {
        // console.log(req.body)
        const hashedPassword = await bcrypt.hash(req.body.Password, 10);
        console.log(hashedPassword);
        const user = { FirstName: req.body.FirstName,
            LastName: req.body.LastName,
            EmailAddress: req.body.EmailAddress,
            UserName: req.body.UserName,
            Password: hashedPassword}
        await db.collection('User').insertOne(
            user, (err, response) => {
           
            if (err) throw err;
            // console.log(response)
            db.collection('User').find({}).toArray( (err,data) =>{
                if (err) {return err}
            else { 
        //   console.log(data)
                res.json(data)
            }})   
        } )
    
    })

    app.post('/login/:userName', async(req, res, next) => {
        // console.log(req.params.userName)
        
        const errors = validationResult(req)
        
        if (!errors) {
            return res.status(400).json({
                errors: errors.array()
            })
        }
        try {
        //find user   
        let user = await db.collection('User').find({"UserName": req.params.userName}).next(
             async  (err, user) => {
            if (!err) {
              console.log(user)
              if(user === undefined){
                  res.send({userName:'Incorrect User Name'})
              }else{
                //compare passwords using bcrypt
                console.log(req.body.password)
                await bcrypt.compare(req.body.password, user.Password, function (err, result) {
                    console.log(result)
                    if (result === true) {
                       const accessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '36000s'})
                      res.send({'TokenAuth': accessToken})
                    } else {
                        res.send({password:'Incorrect password'});
            
                    }
                  });
            }} else {
                    console.log("didn't work")
            }
        })
        } catch (errors) {
            console.error(errors);
            res.status(500).json({
                message: "Server Error"
            })
        }
      });  

      function verifyToken(req, res, next) {
        const authHeader = req.headers['authorization'];
       const token = authHeader && authHeader.split(" ")[1]
       if (token == null) return res.sendStatus(401)
      
       jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
           if (err) return res.sendStatus(403)
           req.user = user
           next()
       })
      }



    app.listen(5000, ()=> {
        console.log('listening on 5000')
    });
})
