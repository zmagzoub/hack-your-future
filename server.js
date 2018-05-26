//Imports
const express = require('express');
const app = express();
const fetch = require('node-fetch');
const config = require('config');
//Read config
const blackboxServerUrl = config.get('blackbox-server-url') || "";
//Business logic
var users = [{
    userId: 0,
    balance: 100
}, {
    userId: 1,
    balance: 150
}, {
    userId: 2,
    balance: 100
}];

function findUserById(userId) {
    for (var i = 0; i < users.length; i++) {
        userId = parseInt(userId);
        const userFound = users[i].userId == userId;
        if (userFound) {
            return users[i];
        }
    }
    return null; //Cannot find user!
}

function updateBalance(req, res) {
    if (req.query.length < 2) {
        res.send("Invalid query parameters!")
        return;
    }
    const userId = req.query["userId"];
    const amount = parseInt(req.query["amount"]);
    if (userId == null || amount == null) {
        res.send("Invalid request!")
    } else {
        const user = findUserById(userId)
        //Calling  an external service which could take some time to finish.
        fetch("https://httpbin.org/delay/" + Math.floor((Math.random() * 2) + 1))
            .then(function (response) {
                if (response.ok) {
                    var responseStr = "Adding " + amount + " to user " + userId + "...\n";
                    user.balance += amount;
                    responseStr += "User " + userId + " has " + user.balance;
                    res.send(responseStr);
                } else {
                    res.send("Something bad happened...")
                }
            })
            .catch(function (error) {
                console.log(error)
                res.send(error)
            })
    }
}

function balances(req, res) {
    res.send(JSON.stringify(users));
}

function invokeBlackboxService(req, res) {
    const userId = req.query["userId"];
    if (!userId) {
        res.send("userId parameter was null");
    }
    if (blackboxServerUrl) {
        fetch(blackboxServerUrl + "/updates")
            .then((promise) => {
                if (promise.ok) {
                    promise.json().then(function (updatedUsers) {
                        users = updatedUsers;
                        for (var i = 0; i < users.length; i++) {
                            if (users[i].userId == userId) {
                                res.send("User with id: " + userId + " has " + users[i].balance);
                                return;
                            }
                        }
                        res.send("User with id " + userId + "  does not exist");
                    }).catch(function (err) {
                        res.send("Something bad happened...")
                    })
                } else {
                    res.send("Something bad happened...")
                }
            })
            .catch(function (error) {
                console.log(error)
                res.send(error)
            });
    } else {
        res.send("Add blackbox server url to config json!");
    }
}

//Routes
app.get('/updatebalance/', updateBalance);
app.get('/balances', balances);
app.get('/blackbox', invokeBlackboxService);

app.listen(3000, () => console.log('Server is listening on port 3000!'))