//constants
const express = require("express");
const cookieParser = require('cookie-parser');
//lecture
// const bcrypt = require('bcrypt.js');
// const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const users = {};

//configuration
app.set("view engine", "ejs");

//middleware
app.use(express.urlencoded({ extended: true })); //creates and populates req.body
app.use(cookieParser());
// app.use(morgan('dev'));
// app.use(cookieSession({
//   name: 'authentication-app-session-cookie',
//   keys: ['hatgkpnflgneksgllr35nf3'],
//   //Cookie options
//   maxAge: 24 * 60 * 60 *1000 //24 hours
// }));


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

const getUserByEmail = function(email) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

//Code to test that server is working
// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });


//Display of urls form
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL; //add new url and random string to urlDatabase
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  res.render("urls_register")
});

app.post("/gotoregister", (req, res) => {
  res.redirect("/register");
});

app.post("/gotologin", (req, res) => {
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //comments are from lecture
  // const salt = bcrypt.genSaltSync(10);
  // const hash = bcrypt.hashSync(password, salt);

  if (email === "" || password === "") {
    return res.status(400).send('You must provide a username and password to register');
  } else if (getUserByEmail(email)) {
    return res.status(400).send("The email provided is already registered");
  } else {
    const randomID = generateRandomString();
    users[randomID]  = {
      id: randomID,
      email,
      password // password: hash;
    }
    res.cookie("user_id", randomID);
    res.redirect("/urls");
  }
});

//Display login form
app.get("/login", (req, res) => {
  res.render("urls_login");
});

//Submission of login form
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //email cannot be found
  const user = getUserByEmail(email);
  if (!user) {
    res.status(403).send("A user with that e-mail was not found.");
  } else if (user) {
    if (user.password === password) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      res.status(403).send("Password is incorrect");
    }
  }
});


//Submssion of logout form
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id, 
    longURL: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.newURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls")
});


//Listener (generate server)
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});