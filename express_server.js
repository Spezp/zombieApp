const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

app.set("view engine", "ejs");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


// Generate Random String and returns a six digit alphanumeric string.

function generateRandomString() {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 6; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

console.log(generateRandomString());

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies.username };
  console.log(req.cookies.username);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies.username };
  res.render("urls_new", templateVars);
});

app.get("/urls/register", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies.username };
  res.render("urls_register", templateVars);
});


app.post("/urls", (req, res) => {
  // debug statement to see POST parameters
  let newRandString = generateRandomString();
  urlDatabase[newRandString] = req.body.longURL;
  res.redirect(`/urls/${newRandString}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// For updateding the URL provided by user while keeping the same TinyApp
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

// Logs in user
app.post("/urls/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// Clears user login cookie
app.post("/urls/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

// Handles Registration forms
app.post("/urls/register", (req, res) => {
  let newID = generateRandomString();
  console.log(`ID: ${newID} email: ${req.body.email} password: ${req.body.password}`);
  users[newID] = {
    id: newID,
    'email': req.body.email,
    'password': req.body.password
  };
  res.cookie("userID", newID);
  res.redirect("/urls");
  console.log(users);
});


app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    urls: urlDatabase,
    username: req.cookies.username
  };
  console.log(templateVars.longURL);
  res.render("urls_show", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
