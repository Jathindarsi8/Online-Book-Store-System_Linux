//jshint esversion: 6

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");
const path = require('path');
const ejs = require('ejs');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

let alert = "hidden bg-blue-500";
let cartAlert = "hidden";
let username = "";
let displayEmail = ""
let selected = [];

// database packages and connections start
const mysql = require('mysql2');
const { captureRejectionSymbol } = require("events");

var connection = mysql.createConnection(
    {
        host: "localhost",
        user: "root",
        password: "Jathin@0987",
        port: '3306',
        database: "online_book_store"
    }
);

connection.connect(
    function (err) {
        if (err) throw err;
        console.log("Connected!");
    }
);

connection.on('error', function (err) {
    console.log("[mysql error]", err);
});

// database connections and packages end


app.get("/login", function (req, res) {
    res.render("pages/login.ejs",{alert: alert});
});

app.post("/login", function (req, res) {

    const email = req.body.email;

    // login verification
    let query = `SELECT UNAME, PASSWORD, EMAIL from users WHERE EMAIL=?`;

    connection.query(query, [email], (err, row, fields) => {
        if (err) throw err;
        if (row[0] != undefined && row[0].PASSWORD == req.body.password) {
            console.log("Validated succesfully!");
            cartAlert = "hidden";
            username = row[0].UNAME;
            displayEmail = row[0].EMAIL;

            console.log(row[0].UNAME + ", " + email);
            let dataquery = `SELECT * FROM inventory`
            connection.query(dataquery, (err, row, fields) => {
                if (err) throw err;
                console.log(row);
                console.log(row.slice(0, 5));
                res.render("pages/index.ejs", {
                    books: row,
                    recbooks: row.slice(0, 5),
                    cartAlert: cartAlert,
                    username: username,
                    email: displayEmail
                });
            });
        }
        else {
            console.log("Invalid credentials");
            alert = "block";
            res.render("pages/login.ejs", { alert: alert});
        }

    }
    );

});

app.get("/register", function (req, res) {
    res.render("pages/register.ejs", {info: ""});

});

app.post("/register", function (req, res1) {

    const firstName = req.body.fName;
    const lastName = req.body.lName;
    const email = req.body.email;
    const pass = req.body.password;

    // database code starts

    let fullName = firstName + " " + lastName;

    // mysql queries
    let query1 = `SELECT * from users WHERE EMAIL=?`;
    let query2 = `INSERT INTO users(UNAME, PASSWORD, EMAIL) VALUES(?,?,?)`;

    connection.query(query1, [email], (err, res2) => {
            if (err) console.log(err);
            if (res2.length != 0) {
                console.log("Email already in use");
                res1.render("pages/register.ejs", {
                    info: "Email already in use"
                });
            }
            else {
                connection.query(query2, [fullName, pass, email], (err, res3) => {
                        if (err) throw err;
                        console.log("Row inserted with id = " + res3.insertId);
                        /*let dataquery = `SELECT * FROM inventory`
                        connection.query(dataquery, (err, row, fields) => {
                                if (err) throw err;
                                console.log(row);
                                console.log(row.slice(0, 5));
                                res1.render("pages/index.ejs", {
                                    books: row,
                                    recbooks: row.slice(0, 5),
                                    cartAlert: cartAlert
                                });
                            }
                        );*/
                        res1.render("pages/register.ejs", {
                            info: "Successfully registered, please Sign In"
                        });
                    }
                );
            }
        }
    )

    // mysql insert query

});

app.get("/index", function (req, res) {
    let dataquery = `SELECT * FROM inventory`
    connection.query(dataquery, (err, row, fields) => {
        if (err) throw err;
        console.log(row);
        console.log(row.slice(0, 5));
        connection.query(`SELECT * FROM Stars`, (err, star, fields) => {
            console.log(star);
            res.render("pages/index.ejs", {
                books: row,
                recbooks: row.slice(0, 5),
                cartAlert: cartAlert,
                stars: star,
                username: username,
                email: displayEmail
            });
        })
    }
    );

});

app.post("/index", function (req, res) {
    console.log("here");
    cartAlert = "hidden";
    res.render("pages/index.ejs", {
        cartAlert: cartAlert,
        username: username,
        email: displayEmail
    });

});

app.post('/addToCart', (req, res) => {
    selected.push(req.body.bookId);
    cartAlert = "block";
    console.log(selected);
    let dataquery = `SELECT * FROM inventory`
    connection.query(dataquery, (err, row, fields) => {
        if (err) throw err;
        console.log(row);
        res.render("pages/index.ejs", {
            books: row,
            recbooks: row.slice(0, 5),
            cartAlert: cartAlert,
            username: username,
            email: displayEmail
        });
    }
    );
});


app.get("/about", function (req, res) {
    res.render("pages/about.ejs", { 
        cartAlert: cartAlert,
        username: username,
        email: displayEmail
    });

});

app.post("/about", function (req, res) {
    res.render("pages/about.ejs", { 
        cartAlert: cartAlert,
        username: username,
        email: displayEmail
    });
});

app.get("/cart", function (req, res) {
    let dataquery = `SELECT * FROM inventory WHERE IDX in (`;
    for(var i=0; i<selected.length; i++){
        if(i!=selected.length-1) dataquery = dataquery + selected[i] + ",";
        else dataquery = dataquery + selected[i] + ')';
    };
    console.log(dataquery);
    connection.query(dataquery, (err, row, fields) => {
        if (err) throw err;
        console.log(row);
        res.render("pages/cart.ejs", {books: row, cartAlert: cartAlert});
    });
});
// app.post("/cart", function (req, res) {
    
// })

app.get("/", function (req, res) {
    res.render("pages/register.ejs", {info: ""});
});


// app.post("/", function (req, res) {

//     res.sendFile(__dirname + "/register.html");

// database code stops

// res.redirect("/");

// const jsonData = JSON.stringify(data);

// const url = "https://us21.api.mailchimp.com/3.0/lists/581364c71e";

// const options = {
//     method: "POST",
//     auth: "shaad:bbbcd6564f6545286e94bd244b8e81a3-us21",
// }

// const request = https.request(url, options, function(response){

//     if (response.statusCode === 200) {
//         res.sendFile(__dirname + "/success.html");
//     }

//     else
//     {
//         res.sendFile(__dirname + "/failure.html");
//     }


//     response.on("data", function(data){
//         console.log(JSON.parse(data));
//     })
// })

// request.write(jsonData);
// request.end();


// })


app.listen(3000, function () {
    console.log("Server is running on port 3000");
});


// API Key
// bbbcd6564f6545286e94bd244b8e81a3-us21


// Audience ID
// 581364c71e

