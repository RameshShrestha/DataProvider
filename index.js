const http = require('http');
//const https = require('https');
const dotenv = require('dotenv');
const jwt = require("jsonwebtoken");
const { randomUUID } = require('crypto'); // Added in: node v14.17.0
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser');
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const requestIp = require("request-ip");
const { Server } = require("socket.io");
const { ErrorHandler } = require('./middlewares/ErrorHandler');
const path = require('path');
const express = require('express');
const { connectDB } = require("./DB/mongodb");
const { addCallerLog } = require('./DB/Logger/logger');
const getRegisteredUsers = require('./routes/api/getAllUsers');
const { getLoggedInUserOrIgnore } = require("./middlewares/AuthHandler");
const { ChatMessage } = require("./DB/MongoModels/ChatMessageModel");
const { Notifications } = require("./DB/MongoModels/NotificationModel");
//const { addLog } = require('./Utils/LogCreator');
const app = express();
let users = require('./LocalData/Users.json');
let quotes = require('./LocalData/Quotes.json');

const apiRequestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 5000 // limit each IP to 5000 requests per windowMs
})

// AI Chat Rate Limiter - More restrictive for expensive LLM calls
const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // limit each IP to 20 AI requests per 15 minutes
  message: {
    success: false,
    error: 'Too many AI requests from this IP, please try again after 15 minutes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for certain conditions (optional)
  skip: (req) => {
    // You can add logic here to skip rate limiting for premium users
    // For example: return req.user?.isPremium === true;
    return false;
  }
})
dotenv.config({
  path: "./.env",
});
const UsersState = {
  dbConnected: false,
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray;
  },
  setDBConnected: function (isConnected) {
    this.dbConnected = isConnected;
  }
}
let savedUserlist = null;// temporary memory for saving userslist
async function getAllRegisteredUsers(newUserRegistered) {
  let allUsers;
  if (getRegisteredUsers) {
    if (newUserRegistered) {
      allUsers = await getRegisteredUsers(UsersState.dbConnected);//refresh user list when new user is registered
    }
    else if (savedUserlist && savedUserlist.length > 0) {
      allUsers = savedUserlist;
    } else {
      allUsers = await getRegisteredUsers(UsersState.dbConnected);
    }

    //console.log("All users", allUsers);
    const userArray = [];
    allUsers?.forEach((user) => {
      let userStructure = {
        id: "",//blank socket id
        name: user.username,
        fullName: user.firstName + " " + user.lastName,
        status: "Offline",
        loginTime: "",
        image: user.image || "",
        chatNotification: 0
      };
      userArray.push(userStructure);
    });
    UsersState.setUsers(userArray);
    // return users;
  }
}
getAllRegisteredUsers(false);


app.use(express.json());
app.use(express.static("express"));

app.use(requestIp.mw());
app.use(function (req, res, next) {
  const ip = req.clientIp;
  // console.log("IP : ", ip);
  next();
});

// global middlewares
 app.use(
   cors({
     origin: ["http://localhost:8887", "http://127.0.0.1:8887", "https://rameshlearningpoint.onrender.com", "https://testramesh-irhww2w9.launchpad.cfapps.us10.hana.ondemand.com",
       "http://localhost:3000","http://localhost"
     ],
     credentials: true,
     default: process.env.CORS_ORIGIN
   })
 );
 // Configure trust proxy securely - trust only the first proxy (common for cloud platforms like Render, Heroku, etc.)
 // If you're not behind a proxy, set this to false
 app.set('trust proxy', 1);

app.use(apiRequestLimiter);
/*
 app.use(function (req, res, next) {
   res.header("Access-Control-Allow-Origin", "https://testramesh-irhww2w9.launchpad.cfapps.us10.hana.ondemand.com");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
   next();
 });
 */
//app.use(cors());
app.use(cookieParser());
// required for passport
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// default URL for website
app.all('*', function (req, res, next) {
  
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
 
  let username = "anonymous";
  try {
    if (token) {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
   //   console.log("Decoded Token", decodedToken);
      username = decodedToken?.username || "anonymous";
   
    }
  } catch (error) {
    next();
  }
  // console.log("170", req.hostname, req.ip, req.path);
  if (req.path.indexOf("/logs") < 0 && req.hostname.indexOf("localhost") < 0) {
   // console.log("sent to add to log :::", req.hostname, req.clientIp, req.path,username);
    addCallerLog(req.hostname, req.clientIp, req.path,username);
  }
  next();
});
app.use("/auth", require('./routes/api/callbacks'));
app.use("/serverstatus", function (req, res) {
  res.send(UsersState);
})
app.use("/products", require('./routes/api/products'));
app.use("/weatherdata", require('./routes/api/getWeatherData'));
app.use("/countries", require('./routes/api/getCountries'));
app.use("/users", require('./routes/api/users'));
app.use("/dumpquestion", require('./routes/api/getDumpQuestions'));
app.use("/realusers", require('./routes/api/registeredUsers')(UsersState));
app.use("/settings", require('./routes/api/UserSettings'));
app.use("/todolist", require('./routes/api/todoList'));
app.use("/news", require('./FromRAPIDAPI/newsprovider'));
app.use("/newsapi", require('./routes/api/getNewsData'));
app.use("/usefullinks", require('./routes/api/getUsefulLinks'));
app.use("/contactmsg", require('./routes/api/contactMessage'));
app.use("/servererrorlog", require('./routes/api/getServerErrorLogs'));
app.use("/logs", require('./routes/api/getLogs'));
app.use("/notifications", require('./routes/api/getNotifications'));
app.use("/chatwithai", aiChatLimiter, require('./routes/api/aichat'));
app.use("/images", function (req, res) {
  res.send("OK");//Just to track user is looking into imagelist page
});
app.use("/newusercreated", function (req, res) {
  getAllRegisteredUsers(true);
  res.send("done");
})
app.use("/testerror", function (req, res) {
  throw new Error("Intentional Error thrown");
})


app.use(ErrorHandler);
// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });
app.get("/", getLoggedInUserOrIgnore);
app.get('/dummyusers', function (req, res) {
  res.send(users);
});
app.get('/dummyusers/:id', function (req, res) {
  let id = req.params.id;

  let user = users.users.filter(item => item.id == id);
  res.send(user);
});

app.get('/quote', function (req, res) {
  const number = Math.trunc(Math.random() * 1450)
  res.send(quotes.quotes[number]);
});
//const port = process.env.PORT || 3004;
const httpServer = http.createServer(app);
const port = process.env.PORT || 3004;
const majorNodeVersion = +process.env.NODE_VERSION?.split(".")[0] || 0;

if (majorNodeVersion >= 14) {
  try {
    console.log("trying to connect to Mongoose");
    connectDB().then((dbConnected) => {
      console.log("Return from connection DB", dbConnected);
      httpServer.listen(port);
      UsersState.setDBConnected(dbConnected);
      console.debug('Server listening on port upper' + port);
      getAllRegisteredUsers(false);
    }).catch((e) => {
      console.log("Error is here 126");
      console.log(e);
    })
  } catch (err) {
    console.log("Error is here 130");
    console.log("Mongo db connect error: ", err);
  }
} else {
  connectDB()
    .then((dbConnected) => {
      httpServer.listen(port);
      console.log("Return from connection DB", dbConnected);
      UsersState.setDBConnected(dbConnected);
      console.debug('Server listening on port lower' + port);
      getAllRegisteredUsers();
    })
    .catch((err) => {
      console.log("Mongo db connect error: ", err);
    });
}
// app.listen(port, function () {
//   console.log('myapp listening on port ' + port);
// });
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://rameshdataprovider.onrender.com",
      "https://rameshlearningpoint.onrender.com",
      "https://testramesh-irhww2w9.launchpad.cfapps.us10.hana.ondemand.com",
      "http://localhost:3000",
      "http://localhost:80",
      "http://localhost"
    ],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true
  }
});


//  app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
//   next();
// });
// const io = new Server(httpServer, {
//   cors: {
//   origin: "*"
// }
//});
io.engine.on("connection_error", async (err) => {
  console.log("Error at io engine");
  //console.log(err.req);      // the request object
  // console.log(err.code);     // the error code, for example 1
  // console.log(err.message);  // the error message, for example "Session ID unknown"
  // console.log(err.context);  // some additional error context
  //await addLog(JSON.stringify(err.req));
  //await addLog("Error at io Engine");
});
var chatController = require('./SocketControllers/chatController');



var chat = io
  .of('/chat')
  .on('connection', function (socket) {
    console.log(`User ${socket.id} connected`);
    socket.on('getOnline', ({ name, loginTime, image }) => {
      //leave previous room
      // console.log("User joined chat", socket.id,name,loginTime);
      const user = activateUser(socket.id, name, loginTime, image);
      //console.log("User activated");
      //Join room
      socket.join("chatroom");
      // console.log("joined chatroom");
      //To user who joined
      socket.emit('message', buildMsg("Admin", `You are online ,with socket id : ${socket.id}`));

      socket.emit('loggedInUserDetail', user);
      //  console.log("trigger user list");
      socket.emit('userlist', {

        users: getUsersInRoom(user)
      });
      sendChatMessagesFromServer(socket, name);
      //socket.emit('receiveChatMessage')
      //console.log("send all user notification that new user has joined", user)
      socket.broadcast.to("chatroom").emit('newUserJoined', user);
      //to Every one else
      socket.broadcast.to("chatroom").emit('message', buildMsg("Admin", `${user.name} is online`));

    })
    socket.on('getOnlineUsers', (event) => {
      //leave previous room
      //   console.log(event);
      // console.log("Fetching online users");
      //    const user = activateUser(socket.id, userName);
      //Join room
      socket.join("chatroom");
      //To user who joined
      socket.emit('message', buildMsg("ADMIN", `You are online`));
      socket.emit('userlist', {
        users: getUsersInRoom()
      });
      //to Every one else
      // socket.broadcast.to("chatroom").emit('message', buildMsg("ADMIN", `${user.name} is online`));

    })
    //When user disconnects - to all Others
    socket.on('disconnect', () => {
      const user = getUser(socket.id);
      userLeavesApp(socket.id)
      //  socket.broadcast.emit('message', `User ${socket.id.substring(0,10)} disconnected`);
      if (user) {
        socket.broadcast.to("chatroom").emit('useroffline', buildDisconnectMsg("Admin", `${user.name}`));
        socket.broadcast.to("chatroom").emit('userList', {
          users: getUsersInRoom()
        });
        // io.emit('roomList', {
        //     rooms: getAllActiveRooms()
        // })

      }
      // console.log(`User ${socket.id} disconnected`);
    });
    socket.on('adminNotification', async ({ notification }) => {
      const user = getUser(socket.id);
      //  console.log("Admin User", user);
      //check if User have Admin authorization later
      //  console.log("Notification to be triggered", notification);
      notification.id = randomUUID();
      socket.broadcast.emit('NotificationFromAdmin', notification);

      await Notifications.create({
        ...notification,
        from_user: "Admin",
        to_user: "AllUsers"
      });

    })
    //Listening for a message  event
    socket.on('message', ({ name, text }) => {
      // console.log(data);
      // const room = getUser(socket.id)?.room;
      // if (room) {
      io.to("chatroom").emit('message', buildMsg(name, text))
      //}
      //  io.emit('message',`${socket.id.substring(0,10)} : ${name}`);
    }
    );
    socket.on("chatMessage", async (chatData) => {
      const { sender, receiver, currentMessage } = chatData;
      // console.log(sender, receiver, currentMessage);
      //find socketid of the receiver;



      // const existedChat = await ChatMessage.findOne({
      //   $and: [{ sender }, { receiver }],
      // }).exec();

      if (UsersState.dbConnected) {
        //Save chats only if DB is connected

        const savedChat = await ChatMessage.create({
          sender,
          receiver,
          content: currentMessage,
        });
        //     console.log("Chat saving", savedChat);


        const receiverDetail = UsersState.users.find((user) => (user.name === receiver));
        //   console.log("Receiver Detail", receiverDetail?.id);

        socket.emit("newChatMessageRecieved", savedChat); //send back own message to user

        if (receiverDetail && receiverDetail.id) {
          socket.to(receiverDetail.id).emit("newChatMessageRecieved", savedChat); // sending message at receiver socket
        } else {
          //    console.log("User offline, saving as notificaiton");
          await Notifications.create({
            title: "New Message",
            message: "1 New Message received",
            type: "Info",
            from_user: sender,
            to_user: receiver
          });
        }
      }

    });
    socket.on('fetchUserChat', async ({ currentUser, chatUser }) => {
      //fetching chat history between currentUser and Chat User
      let chatsWithUser = [];
      if (UsersState.dbConnected) {
        const existedCurrentUserChat = await ChatMessage.find({
          $or: [{ sender: currentUser }, { receiver: currentUser }]
        }).exec();
        chatsWithUser = existedCurrentUserChat.filter((chatItem) => {
          if (chatItem.sender === chatUser || chatItem.receiver === chatUser) {
            return chatItem;
          }
        })
      }
      //  console.log(`Existing Chat betwenn ${currentUser} and ${chatUser}`, chatsWithUser);
      socket.emit('chatHistoryLoad', { oldChat: chatsWithUser, currentUser: currentUser, chatUser: chatUser });

    });
    //Listen for activity
    socket.on('activity', (name) => {
      const room = getUser(socket.id)?.room;
      //  socket.broadcast.emit('activity',name);
      if (room) {
        socket.broadcast.to(room).emit('activity', name)
      }
    });
    socket.on('typingEvent', ({ sender, receiver }) => {
      //  console.log(sender, " typing event to ", receiver);
      const foundUser = UsersState.users.find((user) => user.name === receiver);
      // console.log("foundUser", foundUser)
      socket.to(foundUser.id).emit("chatUserTyping", ({ sender, receiver }));
    })

    async function sendChatMessagesFromServer(socket, currentUser) {
      if (UsersState.dbConnected) {
        const existedChat = await ChatMessage.find({
          $or: [{ sender: currentUser }, { receiver: currentUser }],
        }).exec();
        // console.log("Existing Chat", existedChat);
        socket.emit('receiveChatMessage', existedChat);
      }
      else {
        socket.emit('receiveChatMessage', []);
      }
    }
    function buildMsg(name, text) {
      return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        }).format(new Date())
      }
    }
    function buildDisconnectMsg(sender, username) {
      return {
        sender: sender,
        name: username,
        status: "Offline",
        message: username + " have left chat",
        time: new Intl.DateTimeFormat('default', {
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        }).format(new Date())

      }
    }
    //User functions
    function activateUser(id, userName, loginTime, image) {
      const user = { id, name: userName, status: "Online", loginTime: loginTime, image: image, chatNotification: 0 };
      //   console.log(user);

      const changedUsers = UsersState.users.map((oldUser) => {
        if (oldUser.name === userName) {
          oldUser.id = id;
          oldUser.loginTime = loginTime,
            //  oldUser.image = image;
            oldUser.status = "Online";
          return oldUser;
        } else {
          return oldUser;
        }
      });
      UsersState.setUsers(changedUsers);
      // UsersState.setUsers([
      //   ...UsersState.users.filter(user => user.id !== id), user
      // ]);
      return user;
    }
    function userLeavesApp(id) {
      UsersState.setUsers(
        UsersState.users.map((user) => {
          if (user.id === id) {
            user.status = "Offline";
            user.id === "";
          }
          return user;
        })
      )
    }
    function getUser(id) {
      return UsersState.users.find(user => user.id === id)
    }

    function getUsersInRoom(currentUser) {
      // if (currentUser) {
      //   return UsersState.users.filter((user) => user.name != currentUser.name);
      // }
      // getAllRegisteredUsers();

      return UsersState.users;
    }

  });

