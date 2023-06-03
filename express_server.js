//constants
const express = require("express");
const cookieParser = require('cookie-parser');
//lecture
// const bcrypt = require('bcrypt.js');
// const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "sNntWA",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "sNntWX",
  },
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

//****FUNCTIONS****
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

//function to find object of individual user's information inside users object
const getUserByEmail = function(email) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

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
  if (!req.cookies.user_id) {
    res.status(401).send("<h1>Please <a href='http://localhost:8080/login'>login</a> to access this page</h1>")
  }
  const templateVars = {
    urls: urlsForUser(req.cookies.user_id),
    user: users[req.cookies.user_id]
  };
  console.log(urlsForUser(req.cookies.user_id))
  res.render("urls_index", templateVars);
});

//Submission of urls form (for adding a new url)
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.status(401).send("You must be logged in to shorten URLs")
  }
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  }
  res.redirect(`/urls/${id}`);
});

//Display of urls/new form
app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login")
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_new", templateVars);
  }
});

//Submit gotoregister form (register button)
app.post("/gotoregister", (req, res) => {
  res.redirect("/register");
})

//Display register form
app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls")
  } else {
    res.render("urls_register");
  }
});



//Submit register form
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

//Submit gotologin form (login button)
app.post("/gotologin", (req, res) => {
  res.redirect("/login");
});

//Display login form
app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls")
  } else {
    res.render("urls_login");
  }
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

//Display urls/:id form
app.get("/urls/:id", (req, res) => {
  const userObj = urlsForUser(req.cookies.user_id)
  if (userObj[req.params.id]) {
    const templateVars = {
      id: req.params.id, 
      longURL: userObj[req.params.id],
      user: users[req.cookies.user_id]
    };
    console.log("longurl", templateVars.longURL)
    res.render("urls_show", templateVars);
  } else {
    res.status(401).send("This URL has not been stored in your shortened urls and cannot display")
  }
});

//Display u/:id form (actual website of longURL)
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

//Submit urls/:id/edit form (edit button on main page)
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

//Submit urls/:id form (submit edit of exisiting longURL)
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userObj = urlsForUser(req.cookies.user_id);
  if (!urlDatabase[id]) {
    res.status(404).send("This page does not exist")
  } else if (!req.cookies.user_id) {
    res.status(401).send("<h1>Please <a href='http://localhost:8080/login'>login</a> to access this page</h1>")
  } else if (!userObj[id]) {
    res.status(401).send("This URL has not been stored in your shortened urls and you cannot make changes to it.")
  } else {
    urlDatabase[id].longUrl = req.body.newURL;
  res.redirect("/urls");
  }
});

//Submit urls/:id/delete (delete button on main page)
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userObj = urlsForUser(req.cookies.user_id);
  if (!urlDatabase[id]) {
    res.status(404).send("This page does not exist")
  } else if (!req.cookies.user_id) {
    res.status(401).send("<h1>Please <a href='http://localhost:8080/login'>login</a> to access this page</h1>")
  } else if (!userObj[id]) {
    res.status(401).send("This URL has not been stored in your shortened urls and you cannot delete it.")
  } else {
    delete urlDatabase[id].longUrl;
    res.redirect("/urls");
  } 
});


//Listener (generate server)
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});