//constants
const express = require("express");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail } = require('./helpers.js');
const app = express();
const PORT = 8080; // default port 8080
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "sNntWA",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "sNntWA",
  },
};
const users = {};

//configuration
app.set("view engine", "ejs");

//middleware
app.use(express.urlencoded({ extended: true })); //creates and populates req.body
app.use(cookieSession({
  name: 'session',
  keys: [
    'sdkljflsdkfjgunlserfalfuijgurtnauewhfiwe',
    'sdfksjdfl kjsnhtyhgs h tyesbg krua gaer ',
    ' fkdsfjg kjgfg;akfjd jafg l; fdslf jsdf '
  ],
  //Cookie options
  maxAge: 24 * 60 * 60 * 1000 //24 hours
}));

//function to generate random 6 character id for a new longURL
const generateRandomString = function() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    let randomNum = Math.floor(Math.random() * chars.length);
    randomString += chars[randomNum];
  }
  return randomString;
};


//function used to serach urlDatabase and return object with only urls belonging to user passed into it
const urlsForUser = function(id) {
  const userObj = {};
  for (const url in urlDatabase) {
    const obj = urlDatabase[url];
    if (obj.userID === id) {
      userObj[url] = obj.longURL;
    }
  }
  return userObj;
};

//Display of urls form
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send("<h1>Please <a href='http://localhost:8080/login'>login</a> to access this page</h1>");
  }
  const templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

//Submission of urls form (for adding a new url)
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send("You must be logged in to shorten URLs");
  }
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect('/urls');
});

//Display of urls/new form
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  }
});

//Submit gotoregister form (register button)
app.post("/gotoregister", (req, res) => {
  res.redirect("/register");
});

//Display register form
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_register");
  }
});

//Submit register form
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "" || password === "") {
    return res.status(400).send('You must provide a username and password to register');
  } else if (getUserByEmail(email, users)) {
    return res.status(400).send("The email provided is already registered");
  } else {
    const randomID = generateRandomString();
    users[randomID]  = {
      id: randomID,
      email: email,
      password: hashedPassword
    };
    console.log(users)
    req.session.user_id = randomID;
    res.redirect("/urls");
  }
});

//Submit gotologin form (login button)
app.post("/gotologin", (req, res) => {
  res.redirect("/login");
});

//Display login form
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_login");
  }
});

//Submission of login form
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  console.log(user)
  if (!user) {
    res.status(403).send("A user with that e-mail was not found.");
  } else if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else {
      res.status(403).send("Password is incorrect");
    }
  }
});


//Submit of logout form (logout button)
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//Submit urls/:id/delete (delete button on main page)
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userObj = urlsForUser(req.session.user_id);
  if (!urlDatabase[id]) {
    res.status(404).send("This page does not exist");
  } else if (!req.session.user_id) {
    res.status(401).send("<h1>Please <a href='http://localhost:8080/login'>login</a> to access this page</h1>");
  } else if (!userObj[id]) {
    res.status(401).send("This URL has not been stored in your shortened urls and you cannot delete it.");
  } else {
    delete urlDatabase[id];
    res.redirect("/urls");
  } 
});

//Submit urls/:id/edit form (edit button on main page)
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

//Display urls/:id form
app.get("/urls/:id", (req, res) => {
  const userObj = urlsForUser(req.session.user_id);
  if (userObj[req.params.id]) {
    const templateVars = {
      id: req.params.id, 
      longURL: userObj[req.params.id],
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(401).send("This URL has not been stored in your shortened urls and cannot display");
  }
});

//Display u/:id form (actual website of longURL)
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

//Submit urls/:id form (submit edit of exisiting longURL)
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userObj = urlsForUser(req.session.user_id);
  if (!urlDatabase[id]) {
    res.status(404).send("This page does not exist");
  } else if (!req.session.user_id) {
    res.status(401).send("<h1>Please <a href='http://localhost:8080/login'>login</a> to access this page</h1>");
  } else if (!userObj[id]) {
    res.status(401).send("This URL has not been stored in your shortened urls and you cannot make changes to it.");
  } else {
    console.log(urlDatabase)
    urlDatabase[id].longURL = req.body.newURL;
    console.log(urlDatabase)
    res.redirect("/urls");
  }
});

//Listener (generate server)
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});