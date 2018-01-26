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

const templateVars = {
  urls: urlDatabase,
  user: {
    userID: undefined,
    email: undefined
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

app.get("/urls", (req, res) => {
  res.render("urls_index", {templateVars, users});
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {templateVars, users});
});

app.get("/urls/register", (req, res) => {
  res.render("urls_register", {templateVars, users});
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
  res.redirect("/urls");
});

// Clears user login cookie
app.post("/urls/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/urls");
});

// Handles Registration forms
app.post("/urls/register", (req, res) => {
  let newID = generateRandomString();
  let duplicateID = false;
  for (id in users){
    for (userInfo in users[id]){
      if(userInfo === "email" && users[id][userInfo] === req.body.email) {
        duplicateID = true;
        console.log('User entered email already in use!');
      }
    }
  }

  // Avoids duplicate registrations && empty forms
  if(req.body.email && req.body.password && duplicateID === false) {
    users[newID] = {
      id: newID,
      'email': req.body.email,
      'password': req.body.password
    };
    console.log('here');
    res.cookie("userID", newID);
    console.log(req.cookies);
    templateVars.user = {
      userID: req.cookies["userID"]
    };
    console.log(templateVars.user);
    res.redirect("/urls");

  } else if(duplicateID) {
    res.status(400);
    res.send('Email already in use!');

  } else {
    res.status(400);
    res.send('None shall pass. Enter a valid email/password.');
  }
});

// Redirect after generating new TinyApp
app.get("/urls/:id", (req, res) => {
  templateVars.shortURL = req.params.id;
  templateVars.longURL = urlDatabase[req.params.id];
  res.render("urls_show", {templateVars, users});
});

// Redirects TinyApp to actual domain (longURL)
app.get("/u/:shortURL", (req, res) => {
  console.log(templateVars.longURL);
  res.redirect(templateVars.longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
