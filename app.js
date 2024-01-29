const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initialABAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server at Running http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Error: ${e.message}`);
    process.exit(1);
  }
};

initialABAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const registerPassword = await bcrypt.hash(password, 10);
  const postQuery = `
    SELECT 
    *
    FROM 
    user
    WHERE username = ${username};`;
  const user = await db.get(postQuery);
  if (user === undefined) {
    const createUser = `
        INSERT INTO
        user (username, name, password, gender, location)
        VALUES (
            '${username},
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const userDetails = await db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const loginDetails = `
    SELECT 
    *
    FROM 
    user
    WHERE username = ${username};`;
  const userDetails = await db.get(loginDetails);
  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt(password, userDetails.password);
    if (isPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, lodPassword, newPassword } = request.body;
  const checkUserDetails = `
    SELECT 
    *
    FROM 
    user 
    WHERE username = ${username};`;
  const dbUser = await db.get(checkUserDetails);

  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      const lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedPassword = `
                UPDATE user
                SET
                password = '${encryptedPassword}'
                WHERE username = '${username}'`;
        await db.run(updatedPassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
