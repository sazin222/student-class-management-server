const express= require('express');
const app= express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000 


// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.na448cw.mongodb.net/?retryWrites=true&w=majority`;

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

    const StudentsCollection= client.db('CreativeDB').collection('students')
    const teacherRequestCollection= client.db('CreativeDB').collection('request')
    const classesCollection= client.db('CreativeDB').collection('classes')
 
  
    app.post('/students', async(req,res)=>{
        const user= req.body 
        const result = await StudentsCollection.insertOne(user)
        res.send(result)
    
      })  
      // teacher request post
    app.post('/teacher/request', async(req,res)=>{
        const user= req.body 
        const result = await teacherRequestCollection.insertOne(user)
        res.send(result)
    
      })  

      app.post('/classes',  async(req,res)=>{
        const item= req.body
        const result= await classesCollection.insertOne(item)
        res.send(result)
      })
   
      // get the all requested user for teacher
      app.get('/requestTeacher', async(req, res)=>{
        const result = await teacherRequestCollection.find().toArray()
        res.send(result)
      })
      // all students users get data
      app.get('/users', async(req, res)=>{
        const result = await StudentsCollection.find().toArray()
        res.send(result)
      })

      // get the all classes data
      app.get('/classes', async(req, res)=>{
        const result = await classesCollection.find().toArray()
        res.send(result)
      })
      // get  classes data by id
      app.get('/class/:id', async (req, res) => {
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result= await classesCollection.findOne(query)
        console.log(result);
        res.send(result)
        
      })

      // get the all users students role
      app.get('/students/:email', async (req, res) => {
        const email = req.params.email
        const result = await StudentsCollection.findOne({ email })
        res.send(result)
      })

      // update the role in students users collection
  app.patch('/students/:email', async(req,res)=>{
    const email= req.params.email
    const filter={email: email}
    const updatedDoc ={
     $set:{
       role: 'teacher'
     }
    }
    const result= await StudentsCollection.updateOne(filter, updatedDoc)
    res.send(result)
 })
  app.patch('/requestTeacher/:id', async(req,res)=>{
    const id= req.params.id
    const filter={_id: new ObjectId(id)}
    const updatedDoc ={
     $set:{
       status: 'accepted'
     }
    }
    const result= await teacherRequestCollection.updateOne(filter, updatedDoc)
    res.send(result)
 })
// update the class from classes collection
 app.patch('/class/update/:id', async(req, res)=>{
  const item = req.body 
  console.log(item);
  const id= req.params.id 
  const filter= {_id: new ObjectId(id)}
  const updatedDoc= {
    $set:{
      title:item.title,
      price:item.price,
      description: item.description,
      image:item.image
    }
  }
  const result = await classesCollection.updateOne(filter, updatedDoc)
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

app.get('/', (req,res)=>{
    res.send('Creative study is running')
 })
 
 app.listen(port ,()=>{
     console.log(`Creative study is running on port`, port);
 })
