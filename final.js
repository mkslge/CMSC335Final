const express = require("express"); /* Accessing express module */
const portNumber = 5001;
const http = require("http");
const path = require("path");
const app = express();
const fs = require("fs");
const axios = require("axios");
var nodemailer = require('nodemailer');

//this is the code for the login information to our email
var transporter = nodemailer.createTransport({
    service:'gmail', 
    auth: {
        user: 'cmscfinalproject@gmail.com', //email made just for this
        pass:'rroj snys zzab xxtq',  //App password not actual password
    },
});

const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config({ path: path.resolve(__dirname, '.env') })  

const uri = process.env.MONGO_CONNECTION_STRING;
app.use(express.static(path.resolve(__dirname, "templates")));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
const databaseAndCollection = {db: "CMSC335DB", collection:"finalProjectEmails"};

app.listen(portNumber, (err) => {
    if (err) {
      console.log("Starting server failed.");
    } else {
      console.log(`To access server: http://localhost:${portNumber}`);
      console.log("Type stop to shutdown the server: ");
    }



  });

process.stdin.on('data', (dataInput) => {  /* on equivalent to addEventListener */
	/*const dataInput = process.stdin.read();*/
	if (dataInput !== null) {
		const command = dataInput.toString().trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0);  /* exiting */
        } else {
			/* After invalid command, we cannot type anything else */
			      console.log(`Invalid command: ${command} `);
            console.log("Type stop to shutdown the server: ");
		  }
    }
});

app.get("/", async (req,res) => {
    res.render("index");
}) 

let globalEmail = "0";
app.get("/processApplication", async (request, response) => {
  
    let statusCode = 200;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1});
    try {
        await client.connect();
        let email = request.query.email;
        let currEmail = {
            email: email
        };
        globalEmail = currEmail;

        await insertEmail(client, databaseAndCollection, currEmail);
        let advice = await getAdvice();
        let mailOptions = {
            from: 'cmscfinalproject@gmail.com',
            to: email,
            subject: 'Need Advice?',
            text:advice
        }
        transporter.sendMail(mailOptions, function (error,info) {
            if(error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response());
            }
        })
        response.render("confirmation",currEmail);
       

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
   
    
});

//loads confirmation
app.get("/confirmation",async (request,response) => {
    response.render("confirmation",globalEmail);
})


//inserts email into database
async function insertEmail(client, databaseAndCollection, newEmail) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newEmail);

}

//this function gets advice from advice api
async function getAdvice() {
    let response = await axios.get("https://api.adviceslip.com/advice");
    //returns string of advice
    return response.data.slip.advice;
    
}







