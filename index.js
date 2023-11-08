const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middle ware
app.use(cors())
app.use(express.json())



 


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
    await client.connect();

    const jobCollection = client.db('gigJunctionDB').collection('jobs')
    const bidCollection = client.db('gigJunctionDB').collection('bids')


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
    app.get('/mypostedjobs/:email', async(req, res)=> {
      const email = req.params.email
      console.log(email)
      const query = {buyer_email: email}

      const result = await jobCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/bids', async(req, res)=> {
      const email = req.query.email
      const query = {email: email}
      const result = await bidCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/bidrequest', async(req, res) => {
      const email = req.query.email
      const query = {buyer_email: email}
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