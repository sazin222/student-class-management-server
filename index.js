const express= require('express');
const app= express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
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
    const paymentCollection= client.db('CreativeDB').collection('payment')
    const feedbackCollection= client.db('CreativeDB').collection('feedBack')
  

    // jwt 
    app.post('/jwt', async(req,res)=>{
      const user = req.body 
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.send({token})
    })

    const verifyToken = (req, res, next)=>{
      console.log('inside verify token',
      req.headers.authorization);
      if(!req.headers.authorization){
       return res.status(401).send({message:'unauthorized access'})
      } 
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err,decoded)=>{
        if(err){
          return res.status(401).send({message:'unauthorized access'})
        }
        req.decoded= decoded

        next()
      })
    } 

    const verifyAdmin = async(req,res, next)=>{
      const email= req.decoded.email
      const query= {email: email} 
      const user = await StudentsCollection.findOne(query)
      const isAdmin = user?.role === 'admin'
      if(!isAdmin){
        return res.status(401).send({message:'forbidden access'})
      }
      next()
    }
 
    const verifyTeacher = async(req,res, next)=>{
      const email= req.decoded.email
      const query= {email: email} 
      const user = await StudentsCollection.findOne(query)
      const isTeacher = user?.role === 'teacher'
      if(!isTeacher){
        return res.status(401).send({message:'forbidden access'})
      }
      next()
    }

   
  // payment intent
  app.post('/create-payment-intent', async (req,res)=>{
    const {price} = req.body 
    const amount = parseInt(price *100);
    console.log(amount,'amount inside the intent');

  const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: [
        "card"
      ],
    })
    res.send({
      clientSecret: paymentIntent.client_secret,
    });

  })

  app.post('/payment',  async(req,res)=>{
    const payment= req.body 
    const paymentResult = await paymentCollection.insertOne(payment)
    res.send(paymentResult)
  })

    app.post('/students', async(req,res)=>{
        const user= req.body 
        const result = await StudentsCollection.insertOne(user)
        res.send(result)
    
      })  
      // teacher request post
    app.post('/teacher/request',  async(req,res)=>{
        const user= req.body 
        const result = await teacherRequestCollection.insertOne(user)
        res.send(result)
    
      })  

      app.post('/classes',  async(req,res)=>{
        const item= req.body
        const result= await classesCollection.insertOne(item)
        res.send(result)
      })
      // feedback
      app.post('/feedback',  async(req,res)=>{
        const feedback= req.body 
        const feedbackResult = await feedbackCollection.insertOne(feedback)
        res.send(feedbackResult)
      })
   
      // get the all requested user for teacher
      app.get('/requestTeacher',  async(req, res)=>{
        const result = await teacherRequestCollection.find().toArray()
        res.send(result)
      })
      // all students users get data
      app.get('/users',  async(req, res)=>{
        const result = await StudentsCollection.find().toArray()
        res.send(result)
      })

      // get the all classes data
      app.get('/classes', async(req, res)=>{
        const result = await classesCollection.find().toArray()
        res.send(result)
      })
      app.get('/reviews', async(req, res)=>{
        const result = await feedbackCollection.find().toArray()
        res.send(result)
      })
      // get  classes data by id
      app.get('/class/:id',  async (req, res) => {
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result= await classesCollection.findOne(query)
        console.log(result);
        res.send(result)
        
      })
      app.get('/single/class/:email',  async (req, res) => {
        const email = req.params.email
        const result = await classesCollection.find({ email }).toArray()

        res.send(result)
        
      })
      app.get('/payment/classes/:id',  async (req, res) => {
        const id = req.params.id
      
        const query = {_id: new ObjectId(id) }
        const result= await paymentCollection.findOne(query)
        console.log(result);
        res.send(result)
        
      })

      // get the all users students role
      app.get('/students/:email',  async (req, res) => {
        const email = req.params.email
        const result = await StudentsCollection.findOne({ email })
        res.send(result)
      })

      app.get('/enrollClass/:email',async (req, res) => {
        const email = req.params.email
        const result = await paymentCollection.find({ email}).toArray()
        res.send(result)
      })

      app.get('/enroll',  async(req, res)=>{
        const result = await paymentCollection.find().toArray()
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
  console.log(result);
  res.send(result)
})

app.patch('/classes/:id', async(req,res)=>{
  const id= req.params.id
  const filter={_id: new ObjectId(id)}
  const updatedDoc ={
   $set:{
     status: 'approved'
   }
  }
  const result= await classesCollection.updateOne(filter, updatedDoc)
  res.send(result)
})
app.patch('/classes/rejected/:id', async(req,res)=>{
  const id= req.params.id
  const filter={_id: new ObjectId(id)}
  const updatedDoc ={
   $set:{
     status: 'rejected'
   }
  }
  const result= await classesCollection.updateOne(filter, updatedDoc)
  res.send(result)
})
// delete data from the classCollection 
app.delete('/class/deleted/:id', verifyToken, verifyAdmin, async(req,res)=>{
  const id= req.params.id
  const query= {_id: new ObjectId(id)} 
  const result = classesCollection.deleteOne(query)
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
