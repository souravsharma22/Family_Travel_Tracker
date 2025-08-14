import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "First_databse",
  password: "ss22",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

// let users = [
//   { id: 1, name: "Sourav", color: "teal" },
//   { id: 2, name: "Soumajit", color: "powderblue" },
// ];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries join users on visited_countries.user_id = users.id where users.id = $1",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getcurrentUser() {
  const result = await db.query('select * from users where id = $1', [currentUserId]);
  return result.rows[0];
}

async function getUsers(){
  const result = await db.query('select * from users');
  return result.rows;
}



app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getcurrentUser();
  const users = await getUsers();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color:currentUser.color
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_name, country_code FROM country_and_code WHERE LOWER(country_name) = $1;",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    const country_name = data.country_name;
    try {
      await db.query(
        "INSERT INTO visited_countries (name,country_code,user_id) VALUES ($1, $2, $3)",
        [ country_name, countryCode , currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  }
   catch (err) {
    const countries = await checkVisisted();
  const currentUser = await getcurrentUser();
  const users = await getUsers();
    res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color:currentUser.color,
      error: "Country name not found try with correct spelling"
  });
  }
});
app.post("/user", async (req, res) => {

  if (req.body.add === 'new'){
    res.render('new.ejs')
  }
  else{
    currentUserId = req.body.user;
    res.redirect("/")
  }
  
});

app.post("/new", async (req, res) => {

  const name = req.body.name;
  const color = req.body.color;

  const result = db.query('insert into users (name,color) values ($1, $2)',[name, color]);
  const newId = getcurrentUser()
  currentUserId - newId;
  res.redirect("/");

  
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
