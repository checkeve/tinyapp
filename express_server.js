//constants
const express = require("express");
const cookieParser = require('cookie-parser')
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

//function to generate random 6 character id for a new longURL
const generateRandomString = function() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = ""
  for (let i = 0; i < 6; i++) {
    randomNum = Math.floor(Math.random()*chars.length);
    randomString += chars[randomNum];
  }
  return randomString
}

const getUserByEmail = function(email) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return true;
    }
  } 
  return null;
}

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

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  console.log(templateVars.user)
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL; //add new url and random string to urlDatabase
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  res.render("urls_register")
})

app.post("/register", (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  if (email === "" || password === "") {
    return res.status(400).send('You must provide a username and password to register');
  } else if (getUserByEmail(email)) {
    return res.status(400).send("The email provided is already registered");
  } else {
    const randomID = generateRandomString();
    users[randomID]  = {
      id: randomID,
      email,
      password
    }
    res.cookie("user_id", randomID)
    res.redirect("/urls");
  }
})

app.post("/login", (req, res) => {
  //from lecture
  const username = req.body.username;
  // const password = req.body. password;

  // if (!username || !password) {
  //   res.status(400);
  //   return res.send('You must provide a username and password');
  // }
  //check database of registered users
  // const users = {
  //   abc: {
  //     id: "abc",
  //     username: "alice",
  //     password: "123",
  //   },
  //   def: {
  //     id: "def",
  //     username: "bob",
  //     password: "456",
  //   }
  //   }
  // }

  //lookup user in database
  // foundUser = null;
  // for (const userId in users) {
  //   const user = users[userId];
  //   if (user.username === username) {
  //     foundUser = user;
  //   }
  // }
  // if (!foundUser) {
  //   return res.status(400).send("No user with that username was found");
  // }
  //at this point we know if the username is in the database or not
  //are the passwords NOT the same?
  // if (foundUser.password != password) {
  //   return res.status(400).send('the passwords do not match');
  // }

  //my working code
  res.cookie("username", username);
  res.redirect("/urls");


  //or (from lecture)
  // res.cookie('user', foundUser.id);
  // res.redirect('/protected');
})

//from lecture
// app.get('/protected', (req, res) => {
//   //grab the userId from the cookie
//   const userId = req.cookies.userId;
//   //do they not have a cookie?
//   if (!userId) {
//     res.status(401).send('you must have a cookie to see this page');
//   }
//   const user = users[userId];
//   templateVars = {};
//   res.redirect("", templateVars)

// })



app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
})

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;
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
}
)

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.newURL;
  res.redirect("/urls")
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});