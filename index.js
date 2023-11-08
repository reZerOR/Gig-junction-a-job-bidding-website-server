const express = require('express');
const cors = require('cors');
const app = express()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middle ware
app.use(cors({
      origin: [
        // 'http://localhost:5173'
        'https://gigjunction-f7c2d.web.app',
        "https://gigjunction-f7c2d.firebaseapp.com"

    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser());


// verify token 
const verifyToken = (req, res, next) =>{
    const token = req?.cookies?.token;
    if(!token){
        return res.status(401).send({message: 'unauthorized access'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
        if(err){
            return res.status(401).send({message: 'unauthorized access'})
        }
        req.user = decoded;
        next();
    })
}



 


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o4gj9vp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const jobCollection = client.db('gigJunctionDB').collection('jobs')
    const bidCollection = client.db('gigJunctionDB').collection('bids')



    // jwt token api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
        console.log('user for token', user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({ success: true });
    })
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })


    // apis

    // get api
    app.get('/jobs', async(req, res)=>{
      const category = req.query.category
      const query = {category: category}
      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/jobs/:id', async(req, res)=> {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await jobCollection.findOne(query)
      res.send(result)
    })
    app.get('/mypostedjobs/:email', verifyToken, async(req, res)=> {
      const email = req.params.email
      console.log('token owner info', req.user)
      console.log(email)
      if(req.user.email !== email){
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if (email) {
       query = {buyer_email: email}
      }

      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/bids', verifyToken, async(req, res)=> {
      const email = req.query.email
      console.log('token owner info', req.user)
      if(req.user.email !== email){
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if (email) {
       query = {email: email}
      }
      const result = await bidCollection.find(query).sort({"status": 1}).toArray()
      res.send(result)
    })
    app.get('/bidrequest', verifyToken, async(req, res) => {
      const email = req.query.email
      console.log('token owner info', req.user)
      if(req.user.email !== email){
        return res.status(403).send({message: 'forbidden access'})
      }
      let query = {};
      if (email) {
       query = {buyer_email: email}
      }
      const result = await bidCollection.find(query).toArray()
      res.send(result)
    })


    // put apis
    app.put('/updatejob/:id', async(req, res) => {
      const job = req.body
      const id = req.params.id
      const filter= {_id: new ObjectId(id)}
      const options = {
        upsert: true
      };
      const updatedoc= {
        $set: {
          img: job.img,
          job_title: job.job_title,
          min_price: job.min_price,
          max_price: job.max_price,
          category: job.category,
          deadline: job.deadline,
          description: job.description
        }
      }
      const result = await jobCollection.updateOne(filter, updatedoc, options)
      res.send(result)
    })

    app.put('/bidrequest/:id', async(req, res)=>{
      const status = req.body
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updatedoc ={
        $set: {
          status: status.status,
          buyer_status: status.buyer_status
        }
      }
      const result = await bidCollection.updateOne(filter, updatedoc, options)
      res.send(result)
    })

    // post apis
    app.post('/bids', async(req, res)=>{
      const job = req.body
      const result = await bidCollection.insertOne(job)
      res.send(result)
    })
    app.post('/jobs', async(req, res)=>{
      const job = req.body
      const result = await jobCollection.insertOne(job)
      res.send(result)
    })
    // 

    // delete apis
    app.delete('/deletejob/:id', async(req, res)=> {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await jobCollection.deleteOne(query)
      res.send(result)

    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get("/", (req, res)=> {
    res.send('gigjunction is running on server')
})

app.listen(port, ()=> {
    console.log(`gigjunction server is running on ${port}`)
})