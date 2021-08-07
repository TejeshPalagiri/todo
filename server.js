const config = require("config");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const serveStatic = require("serve-static");
const mongodb = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;
const requestIp = require("request-ip");
const http = require("http");

const dbName = "tododocs";
const dbURL = `mongodb+srv://${config.userName}:${config.dbPassword}@chatapp.rz0qg.gcp.mongodb.net/${config.dbName}?retryWrites=true&w=majority`;
let database;

const port = process.env.PORT || config.serverPort;

mongodb.connect(
  dbURL,
  {
    useUnifiedTopology: true,
  },
  (err, conn) => {
    if (err) {
      console.error("Connection failed to database", err);
    } else {
      console.log("Connection Successfull");
      database = conn.db(dbName);
    }
  }
);

const data = ["tejesh", "charan", "uma", "prasanna"];

app.use(cors());
// app.use(bodyparser.json());
app.use(express.json());
// app.use(serveStatic(__dirname + "/dist"));

app.post("/api/login", (req, res) => {
  const user = {
    user: "tejesh",
  };

  const accessToken = jwt.sign(user, process.env.ACESS_TOKEN_SECRET);
  res.json(accessToken);
});

app.get("/api/data", authtoken, (req, res) => {
  return res.send(data);
});

function authtoken(req, res, next) {
  if (!req.headers["authorization"]) {
    console.log("User Not allowed1");
    return res.status(401).send("Unauthorized request");
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  req.token = token;

  if (token === null || token === "null") {
    console.log("User Not allowed2");
    return res.status(401).send("Unauthorized request");
  }

  jwt.verify(token, process.env.ACESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log("JWT Error", error);
      return res.status(401).send("Unauthorized request");
    } else {
      req.user = user;
      next();
    }
  });
}

app.get("/api/getIp", (req, res) => {
  ipAddress = requestIp.getClientIp(req);
  return res.send({
    ipAddress,
  });
});

let getIp = async (request) => {
  let ipAddress = await requestIp.getClientIp(request);
  return ipAddress;
};

const getLocationOnIP = async (req, res) => {
  return new Promise(async (resolve, reject) => {
    try {
      // const ipAddress = getIp(req);
      const ipAddress = "157.48.181.142";
      let url = `http://ip-api.com/json/${ipAddress}`;
      // request(url, { json: true }, (err, response, body) => {
      //   if (err) {
      //     reject(err);
      //   } else {
      //     resolve(body.country);
      //   }
      // });
      http.get(url, (connection) => {
        let data = "";
        connection.on('data', (chunk) => {
          data += chunk;
        })
        connection.on('end', () => {
          resolve(JSON.parse(data));
        })
      }).on('error', (err) => {
        reject(err);
      })
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

app.get("/api/getlocation", async (req, res) => {
  try {
    let location = await getLocationOnIP(req);
    res.send({ location: location });
  } catch (error) {
    console.error(error);
    res.send({
      msg: "Internal server error",
    });
  }
});

// Whitelisted ip check middleware
let checkWhiteListed = async (req, res, next) => {
  let ipFromRequest = await getIp(req);
  const isIpWhitelisted = await database
    .collection("whitelist")
    .find({
      ipAddress: ipFromRequest,
    })
    .toArray();
  // console.log(isIpWhitelisted);
  if (isIpWhitelisted.length) {
    console.log(`Ip is whitelisted: ${ipFromRequest}`);
    next();
  } else {
    return res.send({
      status: 401,
      message: "Unauthorized Access",
      data: {},
    });
  }
};

app.get("/api/releaseIp", async (req, res) => {
  try {
    let ipAddress = await getIp(req);
    let alreadyExistedIp = await database
      .collection("whitelist")
      .find({ ipAddress: ipAddress })
      .toArray();
    if (alreadyExistedIp.length) {
      return res.send({
        status: 200,
        message: "Ip already released Successfully",
        data: {
          ipAddress,
        },
      });
    }
    let whiteListIp = await database
      .collection("whitelist")
      .insertOne({ ipAddress: ipAddress, createdDate: Date.now() });

    if (whiteListIp.insertedId) {
      return res.send({
        status: 200,
        message: "Ip released Successfully",
        data: {
          ipAddress,
        },
      });
    } else {
      return res.send({
        status: 400,
        message: "Failed to save Ip",
        data: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      status: 500,
      message: "Internal server error",
      data: {},
    });
  }
});

app.get("/api", (req, res) => {
  return res.send("Hello this is not the right place you are");
});

// Adding a todo
app.post("/api/addtodo", checkWhiteListed, async (req, res) => {
  try {
    let name = req.body.name;
    if (!name || name.length < 2) {
      return res.send({
        status: 429,
        message: "Name is needed and should be greater than 2 Charecters",
        data: {},
      });
    }
    let description = req.body.description;
    if (!description || description.length < 3) {
      return res.send({
        status: 429,
        message:
          "Description is needed and should be greater than 2 Charecters",
        data: {},
      });
    }
    let date = req.body.date || Date.now();
    if (!date || typeof date != "number") {
      return res.send({
        status: 429,
        message: "Date is required",
        data: {},
      });
    }
    let addTodo = await database.collection("tododocs").insertOne({
      name: name,
      text: description,
      status: "pending",
      createdDate: date,
    });

    if (addTodo.insertedCount) {
      return res.send({
        status: 200,
        message: "Task Added Successfully",
        data: {},
      });
    } else {
      return res.send({
        status: 400,
        message: "Failed to add a task",
        data: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      status: 500,
      message: "Internal server error",
      data: {},
    });
  }
});

// Edit a todo
app.put("/api/addtodo/:id", checkWhiteListed, async (req, res) => {
  try {
    let taskId = req.params.id;
    if (!taskId || typeof taskId != "string") {
      return res.send({ status: 429, data: "Id is required to edit the task" });
    }
    let name = req.body.name;
    if (!name || name.length < 2) {
      return res.send({
        status: 429,
        message: "Name is needed and should be greater than 2 Charecters",
        data: {},
      });
    }
    let description = req.body.description;
    if (!description || description.length < 3) {
      return res.send({
        status: 429,
        message:
          "Description is needed and should be greater than 2 Charecters",
        data: {},
      });
    }
    let date = req.body.date || Date.now();
    if (!date || typeof date != "number") {
      return res.send({
        status: 429,
        message: "Date is needed",
        data: {},
      });
    }
    let updateTask = await database.collection("tododocs").updateOne(
      {
        _id: objectId(taskId),
        status: { $ne: "removed" },
      },
      {
        $set: {
          name: name,
          text: description,
          updatedDate: date,
        },
      }
    );
    if (updateTask.result.nModified) {
      return res.send({
        status: 200,
        message: "Task updated Successfully",
        data: {},
      });
    } else {
      return res.send({
        status: 404,
        message: "Failed to update task",
        data: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      status: 500,
      message: "Internal server error",
      data: {},
    });
  }
});

// Getting all todo
app.get("/api/gettodo", checkWhiteListed, async (req, res) => {
  try {
    let allTasks = await database
      .collection("tododocs")
      .find({ status: { $ne: "removed" } })
      .sort({ createdDate: -1 })
      .toArray();

    if (!allTasks.length) {
      return res.send({
        status: 200,
        message: "No tasks Found",
        data: {},
      });
    } else {
      return res.send({
        status: 200,
        message: "Successfully fetched TODOs",
        data: allTasks,
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      status: 500,
      message: "Internal server error",
      data: {},
    });
  }
});

// Delete todo
app.delete("/api/deleteTask/:id", checkWhiteListed, async (req, res) => {
  try {
    let taskId = req.params.id;
    if (!taskId || typeof taskId != "string") {
      return res.send({ status: 429, data: "Id is required to edit the task" });
    }
    let date = req.body.date || Date.now();
    if (!date || typeof date != "number") {
      return res.send({
        status: 429,
        message: "Date is needed",
        data: {},
      });
    }
    let deletedTask = await database.collection("tododocs").updateOne(
      {
        _id: objectId(taskId),
      },
      {
        $set: {
          status: "removed",
          updatedDate: date,
        },
      }
    );
    if (deletedTask.result.nModified) {
      return res.send({
        status: 200,
        message: "Task deleted Successfully",
        data: {},
      });
    } else {
      return res.send({
        status: 404,
        message: "Failed to delete task",
        data: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      status: 500,
      message: "Internal server error",
      data: {},
    });
  }
});

// Completed Task
app.put("/api/completedTask/:id", checkWhiteListed, async (req, res) => {
  try {
    let taskId = req.params.id;
    if (!taskId || typeof taskId != "string") {
      return res.send({ status: 429, data: "Id is required to edit the task" });
    }
    let date = req.body.date || Date.now();
    if (!date || typeof date != "number") {
      return res.send({
        status: 429,
        message: "Date is needed",
        data: {},
      });
    }
    let updatedDocument = await database.collection("tododocs").updateOne(
      {
        _id: objectId(taskId),
        status: { $ne: "removed" },
      },
      {
        $set: {
          status: "completed",
          updatedDate: date,
        },
      }
    );
    if (updatedDocument.result.nModified) {
      return res.send({
        status: 200,
        message: "Task Completed Successfully",
        data: {},
      });
    } else {
      return res.send({
        status: 404,
        message: "Task failed to complete",
        data: {},
      });
    }
  } catch (error) {
    console.error(error);
    return res.send({
      status: 500,
      message: "Internal server error",
      data: {},
    });
  }
});

// Delete all
app.get("/api/deleteAll", checkWhiteListed, async (req, res) => {
  let deletedTasks = await database.collection("tododocs").deleteMany();

  return res.send(deletedTasks);
});

// Ignore All requests
app.get("/api/deleteWhiteList", checkWhiteListed, async (req, res) => {
  let blackListedIps = await database.collection("whitelist").deleteMany();

  res.send(blackListedIps);
});

// Wild card route
app.get("/*", (req, res) => {
  res.send("<h1> Todo app working fine</h1>");
  // console.log("failed route");
  // res.redirect("/");
  // return res.send({
  //   status: 200,
  //   data: "This is not the right place",
  // });
});

app.listen(port, () => {
  console.log("Running on port:", port);
});
