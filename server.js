require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bodyparser = require("body-parser");
const cors = require("cors");
const serveStatic = require("serve-static");
const mongodb = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;
const requestIp = require("request-ip");
// const { ObjectID } = require("mongodb");

const dbName = "tododocs";
const dbURL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@chatapp.rz0qg.gcp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
let database;
const port = process.env.PORT || 3000;

mongodb.connect(
  dbURL,
  {
    useUnifiedTopology: true,
  },
  (err, conn) => {
    if (err) {
      console.log("Connection failed to database", err);
    } else {
      console.log("Connection Successfull");
      database = conn.db(dbName);
    }
  }
);

const data = ["tejesh", "charan", "uma", "prasanna"];

app.use(cors());
app.use(bodyparser.json());
app.use(express.json());
app.use(serveStatic(__dirname + "/dist"));

app.post("/api/login", (req, res) => {
  const user = {
    user: "tejesh",
  };

  const accessToken = jwt.sign(user, process.env.ACESS_TOKEN_SECRET);
  res.json(accessToken);
});

app.get("/api/data", authtoken, (req, res) => {
  res.send(data);
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
  res.send({
    ipAddress,
  });
});

let getIp = async (request) => {
  let ipAddress = await requestIp.getClientIp(request);
  return ipAddress;
};

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
    res.send({
      status: 401,
      data: "Unauthorized Access",
    });
  }
};

app.get("/api/releaseIp", async (req, res) => {
  try {
    let ipAddress = await getIp(req);
    let whiteListIp = await database
      .collection("whitelist")
      .insertOne({ ipAddress: ipAddress, createdDate: Date.now() });

    if (whiteListIp.insertedId) {
      res.send({
        status: 200,
        data: "Ip released Successfully",
      });
    } else {
      res.send({
        status: 400,
        data: "Failed to save Ip",
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      status: 500,
      data: "Internal server error",
    });
  }
});

app.get("/api", (req, res) => {
  res.send("Hello this is not the right place you are");
});

// Adding a todo
app.post("/api/addtodo", checkWhiteListed, async (req, res) => {
  try {
    let name = req.body.name;
    if (!name || name.length < 2) {
      res.send({
        status: 429,
        message: "Name is needed and should be greater than 2 Charecters",
        data: {}
      });
    }
    let description = req.body.description;
    if (!description || description.length < 3) {
      res.send({
        status: 429,
        message: "Description is needed and should be greater than 2 Charecters",
        data: {}
      });
    }
    let date = req.body.date || Date.now();
    if (!date || typeof date != "number") {
      res.send({
        status: 429,
        message: "Date is required",
        data: {},
      });
    }
    let addTodo = await database.collection("tododocs").insertOne({
      name: name,
      text: description,
      status: "created",
      createdDate: date,
    });

    if (addTodo.insertedCount) {
      res.send({
        status: 200,
        message: "Task Added Successfully",
        data: {}
      });
    } else {
      res.send({
        status: 400,
        message: "Failed to add a task",
        data: {}
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      status: 500,
      message: "Internal server error",
      data: {}
    });
  }
});

// Edit a todo
app.put("/api/addtodo/:id", checkWhiteListed, async (req, res) => {
  try {
    let taskId = req.params.id;
    if (!taskId || typeof taskId != "string") {
      res.send({ status: 429, data: "Id is required to edit the task" });
    }
    let name = req.body.name;
    if (!name || name.length < 2) {
      res.send({
        status: 429,
        message: "Name is needed and should be greater than 2 Charecters",
        data: {}
      });
    }
    let description = req.body.description;
    if (!description || description.length < 3) {
      res.send({
        status: 429,
        message: "Description is needed and should be greater than 2 Charecters",
        data: {}
      });
    }
    let date = req.body.date || Date.now();
    if (!date || typeof date != "number") {
      res.send({
        status: 429,
        message: "Date is needed",
        data: {}
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
      res.send({
        status: 200,
        message: "Task updated Successfully",
        data: {}
      });
    } else {
      res.send({
        status: 404,
        message: "Failed to update task",
        data: {}
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      status: 500,
      message: "Internal server error",
      data: {}
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
      res.send({
        status: 200,
        message: "No tasks Found",
        data: {}
      });
    } else {
      res.send({
        status: 200,
        message: "Successfully fetched TODOs",
        data: allTasks,
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      status: 500,
      message: "Internal server error",
      data: {}
    });
  }
});

// Delete todo
app.delete("/api/deleteTask/:id", checkWhiteListed, async (req, res) => {
  try {
    let taskId = req.params.id;
    if (!taskId || typeof taskId != "string") {
      res.send({ status: 429, data: "Id is required to edit the task" });
    }
    let date = req.body.date || Date.now();
    if (!date || typeof date != "number") {
      res.send({
        status: 429,
        message: "Date is needed",
        data: {}
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
      res.send({
        status: 200,
        message: "Task deleted Successfully",
        data: {}
      });
    } else {
      res.send({
        status: 404,
        message: "Failed to delete task",
        data: {}
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      status: 500,
      message: "Internal server error",
      data: {}
    });
  }
});

// Completed Task
app.put("/api/completedTask/:id", checkWhiteListed, async (req, res) => {
  try {
    let taskId = req.params.id;
    if (!taskId || typeof taskId != "string") {
      res.send({ status: 429, data: "Id is required to edit the task" });
    }
    let date = req.body.date || Date.now();
    if (!date || typeof date != "number") {
      res.send({
        status: 429,
        message: "Date is needed",
        data: {}
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
      res.send({
        status: 200,
        message: "Task Completed Successfully",
        data: {}
      });
    } else {
      res.send({
        status: 404,
        message: "Task failed to complete",
        data: {}
      });
    }
  } catch (error) {
    console.error(error);
    res.send({
      status: 500,
      message: "Internal server error",
      data: {}
    });
  }
});

// Wild card route
app.get("/*", (req, res) => {
  // console.log("failed route");
  res.redirect("/");
  // res.send({
  //   status: 200,
  //   data: "This is not the right place",
  // });
});

app.listen(port, () => {
  console.log("Running on port:", port);
});
