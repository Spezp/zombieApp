const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cookieSession = require('cookie-session');
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');


app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());


app.set("view engine", "ejs");
app.use('/urls', express.static('public'));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000
}));

let urlDatabase = {
  "b2xVn2": ["http://www.lighthouselabs.ca", "exampleUser"],
  "9sm5xK": ["http://www.google.com", "exampleUser"]
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
function findIdFromParam(tinyParam) {
  for (tinyAppKey in urlDatabase) {
    if(tinyAppKey === tinyParam){
      console.log('findid from param', urlDatabase[tinyAppKey][1], tinyAppKey);
      return urlDatabase[tinyAppKey][1];
    }
  }
  return undefined;
}
function generateRandomString() {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 6; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Check for match
function checkForMatch(database, input) {
  for (let id in database){
    for (userInfo in database[id]){
      if(database[id][userInfo] === input) {
        console.log("checkForMatch: MATCH FOUND!!");
        return true;
      }
    }
  }
  return false;
}

// recieves email from login and returns matching userID string
function findId(database, email) {
  for (let id in database){
    for (userInfo in database[id]){
      if(database[id][userInfo] === email) {
        //console.log(`Matched email: <${email}>, with Id:<${database[id].id}>`);
        return database[id].id;
      }
    }
  }
  return '!missing userID!';
}

app.get("/urls", (req, res) => {
  console.log(templateVars.user);
  console.log(templateVars.urls);
  res.render("urls_index", {templateVars, users});
});

app.get("/urls/new", (req, res) => {
  if(req.session.userID){
    res.render("urls_new", {templateVars, users});
  } else {
    res.render("urls_login", {templateVars, users});
  }
});

app.get("/urls/register", (req, res) => {
  res.render("urls_register", {templateVars, users});
});

app.get("/urls/login", (req, res) => {
  res.render("urls_login", {templateVars, users});
});

app.post("/urls", (req, res) => {
  // debug statement to see POST parameters
  let newRandString = generateRandomString();
  urlDatabase[newRandString] = [req.body.longURL, templateVars.user.userID];
  console.log('Tiny URL generated', newRandString, 'Original URL', req.body.longURL);
  res.redirect(`/urls/${newRandString}`);
});

app.post("/urls/:id/delete", (req, res) => {
  let authUser = findIdFromParam(req.params.id);
  if(authUser === req.session.userID){
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else{
    res.status(400);
    res.send('No Authorization.');
  }
});

// For updateding the URL provided by user while keeping the same TinyApp
app.post("/urls/:id/update", (req, res) => {
  let authUser = findIdFromParam(req.params.id);
  console.log(req.params.id, authUser, req.session.userID);
  if(authUser === req.session.userID){
    urlDatabase[req.params.id][0] = req.body.longURL;
    res.redirect("/urls");
  } else{
    res.status(400);
    res.send('No Authorization.');
  }

});

// Logs in user
app.post("/urls/login", (req, res) => {
  // Check for completed fields in form ---> if not `status403`
  if(req.body.email && req.body.password){
    const isUser = checkForMatch(users, req.body.email);
    const userEmailIDMatch = findId(users, req.body.email);
    let passMatch = bcrypt.compareSync(req.body.password, users[userEmailIDMatch].password);

    if (isUser && passMatch) {
      req.session.userID = userEmailIDMatch;
      templateVars.user = {
        userID: userEmailIDMatch,
        email: req.body.email
      };
      res.redirect("/urls");
    }
  } else {
    res.status(403);
    res.send('Wrong userID or password!');
  }
});

// Clears user login cookie
app.post("/urls/logout", (req, res) => {
  req.session = null;
  templateVars.user.userID = undefined;
  res.redirect("/urls");
});

// Handles Registration forms
app.post("/urls/register", (req, res) => {
  let newID = generateRandomString();
  let duplicateID = checkForMatch(users, req.body.email);

  // Avoids duplicate registrations && empty forms
  if(req.body.email && req.body.password && duplicateID === false) {
    users[newID] = {
      id: newID,
      'email': req.body.email,
      'password': bcrypt.hashSync(req.body.password, 10)
    };
    req.session.userID = newID;
    templateVars.user = {
      userID: newID,
      email: req.body.email
    };
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
  let authUser = findIdFromParam(req.params.id);
  templateVars.shortURL = req.params.id;
  console.log(templateVars.urls);
  if(authUser === req.session.userID){
    res.render("urls_show", {templateVars, users});
  } else {
    res.status(400);
    res.send('unauthorized access');
  }
});

// Redirects TinyApp to actual domain (longURL)
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase.shortURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
